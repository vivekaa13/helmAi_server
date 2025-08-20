const express = require('express');
const router = express.Router();
const voiceController = require('../controllers/voiceController');

router.post('/prompt', voiceController.voicePrompt);

module.exports = router;
