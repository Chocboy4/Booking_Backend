const express = require('express');
const { verifyPayment, initiateTransaction } = require('../controllers/paymentController');
const router = express.Router();

// POST request to verify payment
router.post('/verify-payment', verifyPayment);

// POST request to initiate a transaction
router.post('/initiate-transaction', initiateTransaction);

module.exports = router;
