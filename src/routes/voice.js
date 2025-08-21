const express = require('express');
const router = express.Router();
const voiceController = require('../controllers/voiceController');

// Main voice prompt endpoint
router.post('/prompt', voiceController.voicePrompt);

// Session management endpoints
router.get('/session/:userId?', voiceController.getSessionInfo);
router.delete('/session/:userId?', voiceController.endSession);

// Service status endpoint
router.get('/status', voiceController.getStatus);

module.exports = router;
