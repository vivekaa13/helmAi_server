const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require('@aws-sdk/client-bedrock-agent-runtime');
const https = require('https');

class BedrockService {
  constructor() {
    this.client = null;
    this.sessions = new Map(); // Store session data for different users
    this.initialized = false;
  }

  // Initialize the Bedrock client (called once during server startup)
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Create optimized HTTPS agent
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false, // For development - allows self-signed certificates
        keepAlive: true,
        keepAliveMsecs: 30000,
        maxSockets: 50, // Increase concurrent connections
        maxFreeSockets: 10,
        timeout: 60000, // Increase timeout for complex queries
        freeSocketTimeout: 30000
      });

      this.client = new BedrockAgentRuntimeClient({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
        requestHandler: {
          httpsAgent: httpsAgent,
          requestTimeout: 60000, // 60 seconds for complex agent operations
          connectionTimeout: 10000, // 10 seconds connection timeout
        },
        maxAttempts: 2, // Reduce retry attempts for faster failure
        retryMode: 'standard'
      });
      
      this.initialized = true;
      console.log('✅ Bedrock Agent client initialized with performance optimizations');
    } catch (error) {
      console.error('❌ Failed to initialize Bedrock client:', error);
      throw error;
    }
  }

  // Get or create a session for a user
  getSession(userId) {
    if (!this.sessions.has(userId)) {
      this.sessions.set(userId, {
        sessionId: this.generateSessionId(),
        createdAt: new Date(),
        lastActivity: new Date(),
        messageCount: 0
      });
    }
    
    const session = this.sessions.get(userId);
    session.lastActivity = new Date();
    return session;
  }

  // Generate a unique session ID
  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Clean up old sessions (optional - call periodically)
  cleanupOldSessions(maxAgeMinutes = 60) {
    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    
    for (const [userId, session] of this.sessions.entries()) {
      if (session.lastActivity < cutoffTime) {
        this.sessions.delete(userId);
        console.log(`🧹 Cleaned up session for user: ${userId}`);
      }
    }
  }

  // Main method to invoke the Bedrock agent
  async invokeAgent(prompt, userId = 'default') {
    if (!this.initialized) {
      throw new Error('Bedrock service not initialized. Call initialize() first.');
    }

    const session = this.getSession(userId);
    session.messageCount++;

    try {
      // Validate required parameters
      if (!process.env.BEDROCK_AGENT_ID) {
        throw new Error('BEDROCK_AGENT_ID environment variable is required');
      }
      
      if (!prompt || prompt.trim().length === 0) {
        throw new Error('Prompt cannot be empty');
      }

      console.log(`🤖 Sending prompt to Bedrock agent: ${process.env.BEDROCK_AGENT_ID}`);
      console.log(`📍 Region: ${process.env.AWS_REGION}`);
      console.log(`🔑 Alias: ${process.env.BEDROCK_AGENT_ALIAS_ID}`);
      console.log(`💬 Prompt length: ${prompt.length} chars`);
      
      const command = new InvokeAgentCommand({
        agentId: process.env.BEDROCK_AGENT_ID.trim(),
        agentAliasId: (process.env.BEDROCK_AGENT_ALIAS_ID || 'TSTALIASID').trim(),
        sessionId: session.sessionId,
        inputText: prompt.trim(),
        enableTrace: false, // Disable tracing for faster response
        endSession: false // Keep session alive for conversation continuity
      });

      const startTime = Date.now();
      const response = await this.client.send(command);
      
      console.log(`✅ Bedrock command sent successfully`);
      
      // Process the response chunks more efficiently
      let fullResponse = '';
      let citations = [];
      const chunks = [];

      if (response.completion) {
        for await (const chunk of response.completion) {
          if (chunk.chunk) {
            try {
              // Handle different chunk types more efficiently
              if (chunk.chunk.bytes) {
                const chunkText = new TextDecoder().decode(chunk.chunk.bytes);
                chunks.push(chunkText);
                fullResponse += chunkText;
              }
              
              // Process attribution (citations) if present
              if (chunk.chunk.attribution && chunk.chunk.attribution.citations) {
                citations.push(...chunk.chunk.attribution.citations);
              }
            } catch (decodeError) {
              console.warn('⚠️ Error processing chunk:', decodeError.message);
            }
          }
        }
      }

      const processingTime = Date.now() - startTime;
      console.log(`✅ Bedrock response received in ${processingTime}ms`);

      return {
        success: true,
        response: fullResponse.trim() || 'No response from agent',
        sessionId: session.sessionId,
        messageCount: session.messageCount,
        userId: userId,
        citations: citations,
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Detailed Bedrock error:', {
        message: error.message,
        name: error.name,
        code: error.code,
        statusCode: error.$metadata?.httpStatusCode,
        requestId: error.$metadata?.requestId,
        region: process.env.AWS_REGION,
        agentId: process.env.BEDROCK_AGENT_ID,
        aliasId: process.env.BEDROCK_AGENT_ALIAS_ID
      });
      
      // Provide more specific error messages
      let errorMessage = error.message;
      
      if (error.$metadata?.httpStatusCode === 400) {
        if (error.message.includes('Agent not found')) {
          errorMessage = 'Agent not found. Check your BEDROCK_AGENT_ID.';
        } else if (error.message.includes('Alias not found')) {
          errorMessage = 'Agent alias not found. Check your BEDROCK_AGENT_ALIAS_ID.';
        } else if (error.message.includes('not prepared')) {
          errorMessage = 'Agent is not prepared. Please prepare the agent in AWS Console.';
        } else {
          errorMessage = `Invalid request parameters. Status: ${error.$metadata?.httpStatusCode}`;
        }
      }
      
      return {
        success: false,
        error: errorMessage,
        details: {
          code: error.code,
          statusCode: error.$metadata?.httpStatusCode,
          requestId: error.$metadata?.requestId
        },
        sessionId: session.sessionId,
        userId: userId,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get session info for a user
  getSessionInfo(userId) {
    const session = this.sessions.get(userId);
    if (!session) {
      return null;
    }

    return {
      sessionId: session.sessionId,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      messageCount: session.messageCount,
      isActive: true
    };
  }

  // End a session for a user
  endSession(userId) {
    if (this.sessions.has(userId)) {
      this.sessions.delete(userId);
      return true;
    }
    return false;
  }

  // Validate agent configuration
  async validateAgentSetup() {
    try {
      console.log('🔍 Validating agent setup...');
      console.log(`📍 Region: ${process.env.AWS_REGION}`);
      console.log(`🤖 Agent ID: ${process.env.BEDROCK_AGENT_ID}`);
      console.log(`🔑 Alias ID: ${process.env.BEDROCK_AGENT_ALIAS_ID}`);
      
      // Try a simple test invocation
      const testSession = this.generateSessionId();
      const command = new InvokeAgentCommand({
        agentId: process.env.BEDROCK_AGENT_ID.trim(),
        agentAliasId: (process.env.BEDROCK_AGENT_ALIAS_ID || 'TSTALIASID').trim(),
        sessionId: testSession,
        inputText: 'Hello',
        enableTrace: false,
        endSession: true // End test session immediately
      });

      await this.client.send(command);
      console.log('✅ Agent validation successful');
      return true;
      
    } catch (error) {
      console.error('❌ Agent validation failed:', {
        message: error.message,
        statusCode: error.$metadata?.httpStatusCode,
        requestId: error.$metadata?.requestId
      });
      return false;
    }
  }

  // Get service status
  getStatus() {
    return {
      initialized: this.initialized,
      activeSessions: this.sessions.size,
      configuration: {
        region: process.env.AWS_REGION,
        agentId: process.env.BEDROCK_AGENT_ID ? 'configured' : 'missing',
        aliasId: process.env.BEDROCK_AGENT_ALIAS_ID ? 'configured' : 'using default'
      },
      sessions: Array.from(this.sessions.keys()).map(userId => ({
        userId,
        ...this.getSessionInfo(userId)
      }))
    };
  }
}

// Create a singleton instance
const bedrockService = new BedrockService();

module.exports = bedrockService;
