const express = require('express');
const intentController = require('../controllers/intentController');

const router = express.Router();

router.post('/recognize', intentController.recognizeIntent);
router.post('/populate', intentController.populateDatabase);
router.post('/populate-single', intentController.populateSingleFile);
router.get('/stats', intentController.getStats);
router.delete('/clear', intentController.clearDatabase);

module.exports = router;
