const axios = require('axios');

const SECRET_KEY = process.env.SECRET_KEY;

// Verify payment
async function verifyPayment(req, res) {
    const { reference } = req.body;
    
    try {
        const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${SECRET_KEY}`,
            },
        });

        if (response.data.status) {
            res.status(200).json({ message: 'Payment verified successfully', data: response.data });
        } else {
            res.status(400).json({ message: 'Payment verification failed' });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ message: 'Server error', error });
    }
}

// Initiate transaction
async function initiateTransaction(req, res) {
    const { email, amount } = req.body;  // amount should be in kobo (Naira * 100)
    
    try {
        const response = await axios.post('https://api.paystack.co/transaction/initialize', {
            email,
            amount,
        }, {
            headers: {
                Authorization: `Bearer ${SECRET_KEY}`,
            },
        });

        if (response.data.status) {
            res.status(200).json({ authorization_url: response.data.data.authorization_url });
        } else {
            res.status(400).json({ message: 'Failed to initiate transaction' });
        }
    } catch (error) {
        console.error('Error initiating transaction:', error);
        res.status(500).json({ message: 'Server error', error });
    }
}

module.exports = { verifyPayment, initiateTransaction };
