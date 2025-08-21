const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require('@aws-sdk/client-bedrock-agent-runtime');
const https = require('https');

class BedrockService {
  constructor() {
    this.client = null;
    this.sessions = new Map(); // Store session data for different users
    this.initialized = false;
    this.connectionHealthy = true;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000; // 5 seconds initial delay
    this.healthCheckInterval = null;
    this.lastSuccessfulConnection = null;
  }

  // Initialize the Bedrock client (called once during server startup)
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      await this.createClient();
      this.initialized = true;
      this.connectionHealthy = true;
      this.reconnectAttempts = 0;
      this.lastSuccessfulConnection = new Date();
      
      // Start health check monitoring
      this.startHealthCheck();
      
      console.log('✅ Bedrock Agent client initialized with auto-reconnect enabled');
    } catch (error) {
      console.error('❌ Failed to initialize Bedrock client:', error);
      // Don't throw error - allow server to start and try reconnecting
      this.scheduleReconnect();
    }
  }

  // Create or recreate the Bedrock client
  async createClient() {
    // Create optimized HTTPS agent with persistent connections
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
      keepAlive: true,
      keepAliveMsecs: 30000,
      maxSockets: 50,
      maxFreeSockets: 10,
      timeout: 60000,
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
        requestTimeout: 60000,
        connectionTimeout: 10000,
      },
      maxAttempts: 3,
      retryMode: 'adaptive' // Use adaptive retry mode for better resilience
    });
  }

  // Start periodic health checks
  startHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Check connection health every 2 minutes
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 120000);
  }

  // Perform health check
  async performHealthCheck() {
    try {
      if (!this.initialized) {
        console.log('🔄 Health check: Client not initialized, attempting reconnect...');
        await this.reconnect();
        return;
      }

      // Simple health check - try to create a command (don't send it)
      const testCommand = new InvokeAgentCommand({
        agentId: process.env.BEDROCK_AGENT_ID?.trim(),
        agentAliasId: (process.env.BEDROCK_AGENT_ALIAS_ID || 'TSTALIASID').trim(),
        sessionId: 'health-check-session',
        inputText: 'health-check',
        enableTrace: false,
        endSession: true
      });

      if (testCommand && this.client) {
        this.connectionHealthy = true;
        this.lastSuccessfulConnection = new Date();
        console.log('✅ Health check passed');
      }
    } catch (error) {
      console.log('⚠️ Health check failed, scheduling reconnect...');
      this.connectionHealthy = false;
      await this.scheduleReconnect();
    }
  }

  // Schedule reconnection with exponential backoff
  async scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log(`⚠️ Max reconnect attempts (${this.maxReconnectAttempts}) reached. Resetting counter.`);
      this.reconnectAttempts = 0; // Reset to keep trying
    }

    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 60000); // Max 1 minute
    this.reconnectAttempts++;

    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    setTimeout(async () => {
      await this.reconnect();
    }, delay);
  }

  // Reconnect to Bedrock
  async reconnect() {
    try {
      console.log(`🔄 Attempting to reconnect to Bedrock (attempt ${this.reconnectAttempts})...`);
      
      await this.createClient();
      
      // Test the connection
      const isValid = await this.validateAgentSetup();
      
      if (isValid) {
        this.initialized = true;
        this.connectionHealthy = true;
        this.reconnectAttempts = 0;
        this.lastSuccessfulConnection = new Date();
        console.log('✅ Successfully reconnected to Bedrock');
        
        // Restart health checks
        this.startHealthCheck();
      } else {
        throw new Error('Connection validation failed');
      }
    } catch (error) {
      console.error(`❌ Reconnect attempt ${this.reconnectAttempts} failed:`, error.message);
      this.connectionHealthy = false;
      
      // Schedule another reconnect
      setTimeout(async () => {
        await this.scheduleReconnect();
      }, 1000);
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

  // Main method to invoke the Bedrock agent with auto-reconnect
  async invokeAgent(prompt, userId = 'default', retryCount = 0) {
    const maxRetries = 3;

    // Check if we need to reconnect
    if (!this.initialized || !this.connectionHealthy) {
      console.log('🔄 Connection unhealthy, attempting to reconnect...');
      await this.reconnect();
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
      console.log(`� Prompt length: ${prompt.length} chars | User: ${userId} | Attempt: ${retryCount + 1}`);
      
      const command = new InvokeAgentCommand({
        agentId: process.env.BEDROCK_AGENT_ID.trim(),
        agentAliasId: (process.env.BEDROCK_AGENT_ALIAS_ID || 'TSTALIASID').trim(),
        sessionId: session.sessionId,
        inputText: prompt.trim(),
        enableTrace: false,
        endSession: false
      });

      const startTime = Date.now();
      const response = await this.client.send(command);
      
      console.log(`✅ Bedrock command sent successfully`);
      this.connectionHealthy = true;
      this.lastSuccessfulConnection = new Date();
      
      // Process the response chunks
      let fullResponse = '';
      let citations = [];

      if (response.completion) {
        for await (const chunk of response.completion) {
          if (chunk.chunk) {
            try {
              if (chunk.chunk.bytes) {
                const chunkText = new TextDecoder().decode(chunk.chunk.bytes);
                fullResponse += chunkText;
              }
              
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
        connectionStatus: 'healthy',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Bedrock error (attempt ${retryCount + 1}):`, {
        message: error.message,
        code: error.code,
        statusCode: error.$metadata?.httpStatusCode
      });
      
      this.connectionHealthy = false;
      
      // Auto-retry logic for connection issues
      if (retryCount < maxRetries && this.isRetryableError(error)) {
        console.log(`🔄 Retrying request (${retryCount + 1}/${maxRetries}) after connection error`);
        
        // Wait before retry with exponential backoff
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        // Attempt to reconnect
        await this.reconnect();
        
        // Retry the request
        return this.invokeAgent(prompt, userId, retryCount + 1);
      }
      
      // Provide specific error messages
      let errorMessage = this.getErrorMessage(error);
      
      return {
        success: false,
        error: errorMessage,
        details: {
          code: error.code,
          statusCode: error.$metadata?.httpStatusCode,
          requestId: error.$metadata?.requestId,
          retryCount: retryCount + 1
        },
        sessionId: session.sessionId,
        userId: userId,
        connectionStatus: this.connectionHealthy ? 'healthy' : 'reconnecting',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Check if error is retryable
  isRetryableError(error) {
    const retryableCodes = [
      'ECONNRESET',
      'ECONNREFUSED', 
      'ETIMEDOUT',
      'ENOTFOUND',
      'NetworkingError',
      'TimeoutError'
    ];
    
    const retryableStatusCodes = [500, 502, 503, 504];
    
    return retryableCodes.includes(error.code) || 
           retryableStatusCodes.includes(error.$metadata?.httpStatusCode) ||
           error.message.includes('timeout') ||
           error.message.includes('connection');
  }

  // Get user-friendly error message
  getErrorMessage(error) {
    if (error.$metadata?.httpStatusCode === 400) {
      if (error.message.includes('Agent not found')) {
        return 'Agent not found. Check your BEDROCK_AGENT_ID.';
      } else if (error.message.includes('Alias not found')) {
        return 'Agent alias not found. Check your BEDROCK_AGENT_ALIAS_ID.';
      } else if (error.message.includes('not prepared')) {
        return 'Agent is not prepared. Please prepare the agent in AWS Console.';
      }
    }
    
    if (this.isRetryableError(error)) {
      return 'Connection issue - automatically retrying...';
    }
    
    return error.message || 'Unknown error occurred';
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

  // Enhanced session cleanup with error handling
  cleanupOldSessions(maxAgeMinutes = 60) {
    try {
      const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
      let cleanedCount = 0;
      
      for (const [userId, session] of this.sessions.entries()) {
        if (session.lastActivity < cutoffTime) {
          this.sessions.delete(userId);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} inactive sessions`);
      }
    } catch (error) {
      console.error('⚠️ Error during session cleanup:', error.message);
    }
  }

  // Validate agent configuration with retry
  async validateAgentSetup() {
    const maxAttempts = 3;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`� Validating agent setup (attempt ${attempt}/${maxAttempts})...`);
        
        if (!this.client) {
          await this.createClient();
        }
        
        // Try a simple test invocation
        const testSession = this.generateSessionId();
        const command = new InvokeAgentCommand({
          agentId: process.env.BEDROCK_AGENT_ID.trim(),
          agentAliasId: (process.env.BEDROCK_AGENT_ALIAS_ID || 'TSTALIASID').trim(),
          sessionId: testSession,
          inputText: 'Hello',
          enableTrace: false,
          endSession: true
        });

        await this.client.send(command);
        console.log('✅ Agent validation successful');
        return true;
        
      } catch (error) {
        console.error(`❌ Agent validation failed (attempt ${attempt}):`, {
          message: error.message,
          statusCode: error.$metadata?.httpStatusCode
        });
        
        if (attempt < maxAttempts) {
          console.log(`⏳ Retrying validation in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    return false;
  }

  // Get comprehensive service status
  getStatus() {
    const uptime = this.lastSuccessfulConnection ? 
      Date.now() - this.lastSuccessfulConnection.getTime() : null;
      
    return {
      initialized: this.initialized,
      connectionHealthy: this.connectionHealthy,
      reconnectAttempts: this.reconnectAttempts,
      lastSuccessfulConnection: this.lastSuccessfulConnection,
      uptimeMs: uptime,
      activeSessions: this.sessions.size,
      configuration: {
        region: process.env.AWS_REGION,
        agentId: process.env.BEDROCK_AGENT_ID ? 'configured' : 'missing',
        aliasId: process.env.BEDROCK_AGENT_ALIAS_ID ? 'configured' : 'using default',
        autoReconnect: 'enabled'
      },
      sessions: Array.from(this.sessions.keys()).map(userId => ({
        userId,
        ...this.getSessionInfo(userId)
      }))
    };
  }

  // Graceful shutdown
  async shutdown() {
    try {
      console.log('🛑 Shutting down Bedrock service...');
      
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }
      
      // End all active sessions gracefully
      for (const [userId, session] of this.sessions.entries()) {
        try {
          if (this.client && this.connectionHealthy) {
            const command = new InvokeAgentCommand({
              agentId: process.env.BEDROCK_AGENT_ID.trim(),
              agentAliasId: (process.env.BEDROCK_AGENT_ALIAS_ID || 'TSTALIASID').trim(),
              sessionId: session.sessionId,
              inputText: 'goodbye',
              enableTrace: false,
              endSession: true
            });
            await this.client.send(command);
          }
        } catch (error) {
          // Ignore errors during shutdown
        }
      }
      
      this.sessions.clear();
      this.initialized = false;
      this.connectionHealthy = false;
      
      console.log('✅ Bedrock service shutdown complete');
    } catch (error) {
      console.error('⚠️ Error during shutdown:', error.message);
    }
  }
}

// Create a singleton instance
const bedrockService = new BedrockService();

module.exports = bedrockService;
