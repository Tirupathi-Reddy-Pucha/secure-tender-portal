const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
    contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: String, required: true },
    encryptedAmount: { type: String, required: true }, // AES Encrypted
    documentHash: { type: String, required: true },   // SHA-256 Hash of original file
    supportingDocument: { type: String, required: true }, // Base64 Encoded Image
    status: {
        type: String,
        enum: ['sealed', 'unsealed'],
        default: 'sealed'
    },
    unsealedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    unsealedAt: { type: Date },
    resealedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resealedAt: { type: Date },
    otp: { type: String }, // In prod, hash this
    otpExpires: { type: Date },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending'
    },
    paymentId: { type: String },
    razorpayOrderId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Bid', bidSchema);
