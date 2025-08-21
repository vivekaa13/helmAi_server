const bedrockService = require('../services/bedrockService');

const voicePrompt = async (req, res) => {
  try {
    const { prompt, userId } = req.body;
    
    // Validate input
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required',
        timestamp: new Date().toISOString()
      });
    }

    // Use userId from request or default
    const sessionUserId = userId || 'default';
    
    // Invoke the Bedrock agent
    const result = await bedrockService.invokeAgent(prompt, sessionUserId);
    
    // Return the response
    res.json(result);
    
  } catch (error) {
    console.error('❌ Error in voicePrompt controller:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error while processing voice prompt',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Get session information for a user
const getSessionInfo = async (req, res) => {
  try {
    const { userId } = req.params;
    const sessionInfo = bedrockService.getSessionInfo(userId || 'default');
    
    if (!sessionInfo) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
        userId: userId || 'default'
      });
    }
    
    res.json({
      success: true,
      session: sessionInfo
    });
    
  } catch (error) {
    console.error('❌ Error getting session info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session information',
      details: error.message
    });
  }
};

// End a session for a user
const endSession = async (req, res) => {
  try {
    const { userId } = req.params;
    const sessionUserId = userId || 'default';
    
    const ended = bedrockService.endSession(sessionUserId);
    
    res.json({
      success: true,
      message: ended ? 'Session ended successfully' : 'No active session found',
      userId: sessionUserId,
      sessionEnded: ended
    });
    
  } catch (error) {
    console.error('❌ Error ending session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end session',
      details: error.message
    });
  }
};

// Get service status
const getStatus = async (req, res) => {
  try {
    const status = bedrockService.getStatus();
    res.json({
      success: true,
      service: 'Bedrock Agent Service',
      ...status
    });
  } catch (error) {
    console.error('❌ Error getting service status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get service status',
      details: error.message
    });
  }
};

module.exports = {
  voicePrompt,
  getSessionInfo,
  endSession,
  getStatus
};
