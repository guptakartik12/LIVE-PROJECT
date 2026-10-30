const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  extendBooking
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createBooking);
router.get('/my', protect, getMyBookings);
router.get('/:id', getBookingById);
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/extend', protect, extendBooking);

module.exports = router;
