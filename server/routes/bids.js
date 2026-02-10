const router = require('express').Router();
const Bid = require('../models/Bid');
const AuditLog = require('../models/AuditLog');
const { auth, checkRole } = require('../middleware/authMiddleware');
const crypto = require('crypto'); // Native crypto for hashing
const CryptoJS = require('crypto-js');

// Secret Key for AES (In prod, this should be very secure)
const BID_SECRET = process.env.BID_SECRET || 'superSecretBidKey123';

// Create Bid (Contractor) - Hybrid Encryption Flow
router.post('/', auth, checkRole(['contractor']), async (req, res) => {
    try {
        const { projectId, amount, supportingDocument, clientPublicKey } = req.body;

        // Validate Tender
        const Tender = require('../models/Tender');
        const tender = await Tender.findById(projectId);
        if (!tender) return res.status(404).json({ message: 'Tender not found' });
        if (tender.status !== 'open') return res.status(400).json({ message: 'Bidding is closed' });
        if (new Date() > new Date(tender.deadline)) return res.status(400).json({ message: 'Deadline has passed' });

        // 1. KEY EXCHANGE & DECRYPTION
        // Compute Shared Secret using Client's Public Key
        const dhKey = require('../utils/dhKey');
        const sharedSecretBuffer = dhKey.computeSecret(clientPublicKey);
        // Derive AES Key from Shared Secret (SHA256 hash of secret)
        const sharedSecretHash = crypto.createHash('sha256').update(sharedSecretBuffer).digest('hex');

        // Decrypt the bid amount using the Session Key (Shared Secret)
        // Note: Client encrypts using the SHA256 of the shared secret
        const bytes = CryptoJS.AES.decrypt(amount, sharedSecretHash);
        const originalAmount = bytes.toString(CryptoJS.enc.Utf8);

        if (!originalAmount || isNaN(parseFloat(originalAmount))) {
            return res.status(400).json({ message: 'Encryption Handshake Failed' });
        }

        // 2. RE-ENCRYPTION FOR STORAGE
        // Encrypt with Master BID_SECRET for consistent storage
        const storageEncryptedAmount = CryptoJS.AES.encrypt(originalAmount, BID_SECRET).toString();

        // 3. Hash Document
        const hashSum = crypto.createHash('sha256');
        hashSum.update(supportingDocument);
        const documentHash = hashSum.digest('hex');

        const bid = new Bid({
            contractor: req.user.id,
            projectId,
            encryptedAmount: storageEncryptedAmount, // Stored securely with Master Key
            documentHash,
            supportingDocument
        });

        await bid.save();

        await new AuditLog({
            action: 'SUBMIT_BID',
            performedBy: req.user.id,
            details: { bidId: bid._id, projectId, encryption: 'Hybrid (DH+AES)' }
        }).save();

        res.status(201).json({ message: 'Bid submitted securely via Hybrid Encryption' });
    } catch (err) {
        console.error("Bid Submission Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get Bids (Officer sees encrypted, Contractor sees own)
router.get('/', auth, async (req, res) => {
    try {
        let bids;
        if (req.user.role === 'contractor') {
            bids = await Bid.find({ contractor: req.user.id });
        } else if (req.user.role === 'officer') {
            // Officer sees all, but encryptedAmount is returned as is (gibberish)
            bids = await Bid.find().populate('contractor', 'username');
        } else {
            return res.status(403).json({ message: 'Access denied' });
        }
        res.json(bids);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Request OTP (Officer only)
router.post('/:id/request-otp', auth, checkRole(['officer']), async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.id);
        if (!bid) return res.status(404).json({ message: 'Bid not found' });

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save to Bid (In prod, use Redis or Hash)
        bid.otp = otp;
        bid.otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins
        await bid.save();

        // Simulate Sending SMS/Email
        console.log(`=================================================`);
        console.log(`[SECURE SMS GATEWAY] OTP for Bid ${bid._id}: ${otp}`);
        console.log(`=================================================`);

        res.json({ message: 'OTP sent to registered device' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Unseal Bid (Officer only + MFA)
router.post('/:id/unseal', auth, checkRole(['officer']), async (req, res) => {
    try {
        const { otp } = req.body;
        const bid = await Bid.findById(req.params.id);

        if (!bid) return res.status(404).json({ message: 'Bid not found' });

        // Verify OTP
        if (!bid.otp || bid.otp !== otp) {
            return res.status(403).json({ message: 'Invalid or Expired OTP' });
        }

        if (bid.otpExpires < Date.now()) {
            return res.status(403).json({ message: 'OTP Expired' });
        }

        // Decrypt
        const bytes = CryptoJS.AES.decrypt(bid.encryptedAmount, BID_SECRET);
        const originalAmount = bytes.toString(CryptoJS.enc.Utf8);

        // Update Status
        bid.status = 'unsealed';
        bid.unsealedBy = req.user.id;
        bid.unsealedAt = Date.now();
        bid.otp = undefined; // Clear OTP
        bid.otpExpires = undefined;
        await bid.save();

        // Log
        await new AuditLog({
            action: 'UNSEAL_BID',
            performedBy: req.user.id,
            details: { bidId: bid._id }
        }).save();

        res.json({ amount: originalAmount, supportingDocument: bid.supportingDocument });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reseal Bid (Officer only)
router.post('/:id/reseal', auth, checkRole(['officer']), async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.id);
        if (!bid) return res.status(404).json({ message: 'Bid not found' });

        if (bid.status !== 'unsealed') {
            return res.status(400).json({ message: 'Bid is not unsealed' });
        }

        // Re-encrypt/Update Status
        bid.status = 'sealed';
        bid.resealedBy = req.user.id;
        bid.resealedAt = Date.now();
        await bid.save();

        // Log
        await new AuditLog({
            action: 'RESEAL_BID',
            performedBy: req.user.id,
            details: { bidId: bid._id }
        }).save();

        res.json({ message: 'Bid resealed successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
