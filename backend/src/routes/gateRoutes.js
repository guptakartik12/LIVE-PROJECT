const express = require('express');
const router = express.Router();
const { verifyQR, processEntry, processExit } = require('../controllers/gateController');

router.post('/verify-qr', verifyQR);
router.post('/entry', processEntry);
router.post('/exit', processExit);

module.exports = router;
