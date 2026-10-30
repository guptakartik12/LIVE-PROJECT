const express = require('express');
const router = express.Router();
const { createOrder, verifySignature } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-order', protect, createOrder);
router.post('/verify-signature', protect, verifySignature);

module.exports = router;
