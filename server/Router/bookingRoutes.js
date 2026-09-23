const express = require('express');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.post(
  '/tours/:tourId/bookings',
  authController.protect,
  bookingController.bookTour,
);

router.get(
  '/bookings/:bookingId',
  authController.protect,
  bookingController.getBooking,
);

router.get('/bookings/:bookingId/verify', bookingController.verifyBookingPayment);

module.exports = router;
