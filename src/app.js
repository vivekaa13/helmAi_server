// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const voiceRoutes = require('./routes/voice');
const bedrockService = require('./services/bedrockService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/voice', voiceRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Helm AI Server API - Bedrock Agent Integration',
    version: '1.0.0',
    endpoints: [
      'POST /api/voice/prompt - Send prompt to Bedrock agent',
      'GET /api/voice/session/:userId - Get session info',  
      'DELETE /api/voice/session/:userId - End session',
      'GET /api/voice/status - Get service status'
    ]
  });
});

// Initialize Bedrock service and start server
const startServer = async () => {
  try {
    // Initialize Bedrock service
    await bedrockService.initialize();
    
    // Validate agent setup
    const isValid = await bedrockService.validateAgentSetup();
    if (!isValid) {
      console.log('⚠️  Agent validation failed, but server will continue running.');
      console.log('📋 Common issues:');
      console.log('   • Agent not found - check BEDROCK_AGENT_ID');
      console.log('   • Alias not found - check BEDROCK_AGENT_ALIAS_ID');
      console.log('   • Agent not prepared - prepare in AWS Console');
      console.log('   • Wrong region - check AWS_REGION');
    }
    
    // Set up session cleanup (every 30 minutes)
    setInterval(() => {
      bedrockService.cleanupOldSessions(30);
    }, 30 * 60 * 1000);
    
    // Start the server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Helm AI Server running on port ${PORT}`);
      console.log(`📡 Access the API at: http://localhost:${PORT}`);
      console.log(`🤖 Bedrock Agent integration ${isValid ? 'verified' : 'needs attention'}`);
    }).on('error', (err) => {
      console.error('❌ Server error:', err);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
