const express = require('express');
const { processVoice } = require('../controllers/voiceProcessController');

const router = express.Router();

router.post('/process', processVoice);

module.exports = router;
