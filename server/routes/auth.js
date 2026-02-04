const router = require('express').Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const AuditLog = require('../models/AuditLog');

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, role, officerCode } = req.body;

        if (role === 'officer') {
            const OFFICER_REGISTRATION_CODE = "SECURE_OFFICER_2026";
            if (officerCode !== OFFICER_REGISTRATION_CODE) {
                return res.status(403).json({ error: "Invalid Officer Registration Code" });
            }
        }

        const user = new User({ username, email, password, role });
        await user.save();
        res.status(201).json({ message: 'User registered' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            console.log("No user found: ", username);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        if (!(await user.comparePassword(password))) {
            console.log("Invalid password: ", username);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secretKey', { expiresIn: '7d' });

        // Log login
        const log = new AuditLog({
            action: 'LOGIN',
            performedBy: user._id,
            details: { username: user.username }
        });
        await log.save();

        res.json({ token, role: user.role, userId: user._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
