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
    
    // Validate agent setup (don't fail if validation fails)
    const isValid = await bedrockService.validateAgentSetup();
    if (!isValid) {
      console.log('⚠️  Agent validation failed, but server will continue running.');
      console.log('📋 The service will keep trying to reconnect automatically.');
    }
    
    // Set up session cleanup (every 30 minutes)
    setInterval(() => {
      bedrockService.cleanupOldSessions(30);
    }, 30 * 60 * 1000);
    
    // Start the server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Helm AI Server running on port ${PORT}`);
      console.log(`📡 Access the API at: http://localhost:${PORT}`);
      console.log(`🤖 Bedrock Agent integration ${isValid ? 'verified ✅' : 'reconnecting 🔄'}`);
      console.log(`🛡️  Auto-reconnect enabled - server will never stop`);
    });

    // Handle server errors gracefully - never let server die
    server.on('error', (err) => {
      console.error('❌ Server error (will attempt recovery):', err);
      
      if (err.code === 'EADDRINUSE') {
        console.log('🔄 Port in use, trying again in 5 seconds...');
        setTimeout(() => {
          server.close();
          startServer(); // Restart server
        }, 5000);
      }
    });

    // Handle uncaught exceptions - log but don't crash
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception (continuing anyway):', error);
    });

    // Handle unhandled promise rejections - log but don't crash  
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection (continuing anyway):', reason);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);
      
      try {
        // Stop accepting new connections
        server.close(async () => {
          console.log('📡 HTTP server closed');
          
          // Shutdown Bedrock service gracefully
          await bedrockService.shutdown();
          
          console.log('✅ Graceful shutdown complete');
          process.exit(0);
        });
        
        // Force shutdown after 30 seconds
        setTimeout(() => {
          console.log('⚠️ Forcing shutdown after timeout');
          process.exit(1);
        }, 30000);
        
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Listen for shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.log('🔄 Retrying server start in 10 seconds...');
    
    // Don't exit - retry starting the server
    setTimeout(() => {
      startServer();
    }, 10000);
  }
};

// Start the server
startServer();

module.exports = app;
