const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Tender = require('../models/Tender');
const Bid = require('../models/Bid');
const CryptoJS = require('crypto-js');
const { auth } = require('../middleware/authMiddleware'); // Import Auth Middleware
require('dotenv').config();

const BID_SECRET = process.env.BID_SECRET || 'superSecretBidKey123';

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @route   POST api/payments/order
// @desc    Create a new payment order (Winner Only)
// @access  Protected
router.post('/order', auth, async (req, res) => {
    try {
        const { tenderId } = req.body;

        if (!tenderId) return res.status(400).send("Tender ID is required");

        // 1. Fetch Tender
        const tender = await Tender.findById(tenderId).populate('winner');
        if (!tender) return res.status(404).json({ message: 'Tender not found' });

        if (tender.status !== 'closed') {
            return res.status(400).json({ message: 'Tender is not closed yet' });
        }

        if (!tender.winner) {
            return res.status(400).json({ message: 'No winner declared for this tender' });
        }

        // 2. Check if Requesting User is the Winner
        // tender.winner is a Bid object (due to populate in Tender model logic? verification needed)
        // Wait, in Tender model: winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid' }
        // So populated 'winner' is the Bid document.
        // Bid document has 'contractor' field. We need to check that.

        // Use deep populate if needed, or just check the ID if populate was only 1 level.
        // Let's re-verify Tender model populate in previous steps or just fetch Bid.
        // Actually, if tender.winner is populated, it is the Bid object.
        // bid.contractor is the User ID.

        const winningBid = tender.winner;

        if (winningBid.contractor.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access Denied: You are not the winner of this tender' });
        }

        // 3. Decrypt Amount
        let amount = 0;
        try {
            const bytes = CryptoJS.AES.decrypt(winningBid.encryptedAmount, BID_SECRET);
            const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
            if (!decryptedString) throw new Error("Decryption failed");
            amount = parseFloat(decryptedString);
        } catch (e) {
            console.error("Decryption Error during payment:", e);
            return res.status(500).json({ message: 'Failed to process bid amount' });
        }

        // 4. Create Razorpay Order
        const options = {
            amount: amount * 100, // Convert to smallest currency unit (paise)
            currency: "INR",
            receipt: `rcpt_${Date.now().toString().slice(-10)}`,
        };

        const order = await instance.orders.create(options);

        if (!order) return res.status(500).send("Some error occured");

        // Save Razorpay Order ID to Bid for later verification mapping
        winningBid.razorpayOrderId = order.id;
        await winningBid.save();

        res.json(order);
    } catch (error) {
        console.error("Payment Order Error:", error);
        res.status(500).send(error.message);
    }
});

// @route   POST api/payments/verify
// @desc    Verify payment signature
// @access  Public (Can be protected, but callback often comes from client)
router.post('/verify', async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // Find the bid associated with this order
            const bid = await Bid.findOne({ razorpayOrderId: razorpay_order_id });

            if (bid) {
                bid.paymentStatus = 'paid';
                bid.paymentId = razorpay_payment_id;
                await bid.save();
                return res.status(200).json({ message: "Payment verified and recorded successfully" });
            } else {
                // Even if verified, we couldn't find the bid. This might handle cases where DB save failed previously or direct API calls.
                // For now, return success but log warning, or return specific message.
                // Choosing to return success for payment, but warning.
                console.warn(`Payment verified for order ${razorpay_order_id} but no matching Bid found.`);
                return res.status(200).json({ message: "Payment verified (Bid update pending or not found)" });
            }

        } else {
            return res.status(400).json({ message: "Invalid signature sent!" });
        }
    } catch (error) {
        console.error("Payment Verification Error:", error);
        res.status(500).send(error.message);
    }
});

module.exports = router;
