const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

router.post('/confirm', bookingController.confirmBooking);

module.exports = router;
