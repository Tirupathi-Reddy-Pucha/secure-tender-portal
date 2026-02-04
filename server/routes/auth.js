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

// Login (Step 1: Check Password & Generate OTP)
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

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
        await user.save();

        console.log(`=================================================`);
        console.log(`[SECURE LOGIN GATEWAY] OTP for ${username}: ${otp}`);
        console.log(`=================================================`);

        res.json({ message: 'OTP_SENT', username });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Verify OTP (Step 2: Generate Token)
router.post('/verify-otp', async (req, res) => {
    try {
        const { username, otp } = req.body;
        const user = await User.findOne({ username });

        if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or Expired OTP' });
        }

        // Clear OTP
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

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
