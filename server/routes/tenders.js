const router = require('express').Router();
const Tender = require('../models/Tender');
const { auth, checkRole } = require('../middleware/authMiddleware');

// Create Tender (Officer only)
router.post('/', auth, checkRole(['officer']), async (req, res) => {
    try {
        const { title, description, deadline } = req.body;

        const tender = new Tender({
            title,
            description,
            deadline,
            createdBy: req.user.id
        });

        await tender.save();
        res.status(201).json(tender);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const Bid = require('../models/Bid');
const AuditLog = require('../models/AuditLog');
const CryptoJS = require('crypto-js');
const BID_SECRET = process.env.BID_SECRET || 'superSecretBidKey123';

// Helper: Process Winner
const processWinner = async (tender) => {
    try {
        const bids = await Bid.find({ projectId: tender._id });
        if (bids.length === 0) {
            tender.status = 'closed';
            await tender.save();
            return;
        }

        // Decrypt and Map
        const decryptedBids = bids.map(bid => {
            try {
                const bytes = CryptoJS.AES.decrypt(bid.encryptedAmount, BID_SECRET);
                const amount = parseFloat(bytes.toString(CryptoJS.enc.Utf8));
                return { ...bid.toObject(), amount };
            } catch (e) {
                return { ...bid.toObject(), amount: Infinity }; // Invalid decryption
            }
        });

        // Sort: Lowest Amount -> Earliest Turn-in (Tie-breaker)
        decryptedBids.sort((a, b) => {
            if (a.amount !== b.amount) {
                return a.amount - b.amount; // Lowest Amount First
            }
            // Tie-breaker: Earliest Creation Time
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();
            if (timeA !== timeB) {
                return timeA - timeB; // Earliest Date First
            }
            // Ultimate Tie-breaker: ObjectId (Creation Order)
            return String(a._id).localeCompare(String(b._id));
        });

        const winner = decryptedBids[0];

        console.log(`[Auto-Award] Tender: ${tender.title}`);
        console.log(`[Auto-Award] Sorted Bids:`, decryptedBids.map(b => ({ id: b._id, amount: b.amount, time: b.createdAt })));
        console.log(`[Auto-Award] Selected Winner: ${winner._id} ($${winner.amount})`);

        tender.winner = winner._id;
        tender.status = 'closed';
        await tender.save();

        // Log
        await new AuditLog({
            action: 'AUTO_AWARD',
            performedBy: tender.createdBy, // System action attributed to creator
            details: { tenderId: tender._id, winnerBidId: winner._id, amount: winner.amount }
        }).save();

    } catch (err) {
        console.error("Auto-Award Error:", err);
    }
};

// Get All Tenders (Everyone)
router.get('/', auth, async (req, res) => {
    try {
        // Auto-close expired tenders
        const expiredTenders = await Tender.find({
            status: 'open',
            deadline: { $lt: new Date() }
        });

        for (const tender of expiredTenders) {
            await processWinner(tender);
        }

        // Return all (now updated)
        const tenders = await Tender.find()
            .populate({
                path: 'winner',
                populate: { path: 'contractor', select: 'username' }
            })
            .sort({ createdAt: -1 });

        res.json(tenders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Close Tender (Officer only)
router.post('/:id/close', auth, checkRole(['officer']), async (req, res) => {
    try {
        const tender = await Tender.findById(req.params.id);
        if (!tender) return res.status(404).json({ message: 'Tender not found' });

        tender.status = 'closed';
        await tender.save();

        res.json({ message: 'Tender closed successfully', tender });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
