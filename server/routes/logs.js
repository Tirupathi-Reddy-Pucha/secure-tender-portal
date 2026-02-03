const router = require('express').Router();
const AuditLog = require('../models/AuditLog');
const { auth, checkRole } = require('../middleware/authMiddleware');

// Get all logs (Auditor only)
router.get('/', auth, checkRole(['auditor']), async (req, res) => {
    try {
        const logs = await AuditLog.find().populate('performedBy', 'username role').sort({ timestamp: -1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
