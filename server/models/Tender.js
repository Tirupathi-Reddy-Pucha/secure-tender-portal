const mongoose = require('mongoose');

const tenderSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    deadline: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['open', 'closed'],
        default: 'open'
    },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid' }
}, { timestamps: true });

module.exports = mongoose.model('Tender', tenderSchema);
