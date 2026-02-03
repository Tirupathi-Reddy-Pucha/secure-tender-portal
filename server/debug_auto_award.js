const mongoose = require('mongoose');
const Tender = require('./models/Tender');
const Bid = require('./models/Bid'); // Ensure this path is correct relative to where you run passing from
const CryptoJS = require('crypto-js');
require('dotenv').config();

const BID_SECRET = process.env.BID_SECRET || 'superSecretBidKey123';

async function debugAutoAward() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/secure-tender', {});
        console.log('Connected to DB');

        const now = new Date();
        console.log('Current Server Time:', now);

        const expiredTenders = await Tender.find({
            status: 'open',
            deadline: { $lt: now }
        });

        console.log(`Found ${expiredTenders.length} open expired tenders.`);

        for (const tender of expiredTenders) {
            console.log(`Processing Tender: ${tender.title} (Deadline: ${tender.deadline})`);

            const bids = await Bid.find({ projectId: tender._id });
            console.log(`  - Found ${bids.length} bids.`);

            if (bids.length === 0) {
                console.log('  - No bids. Closing without winner.');
                tender.status = 'closed';
                await tender.save();
                continue;
            }

            const decryptedBids = bids.map(bid => {
                try {
                    const bytes = CryptoJS.AES.decrypt(bid.encryptedAmount, BID_SECRET);
                    const originalText = bytes.toString(CryptoJS.enc.Utf8);
                    const amount = parseFloat(originalText);
                    // console.log(`    - Bid ${bid._id}: Encrypted=${bid.encryptedAmount.substring(0,10)}... DecryptedString='${originalText}' Parsed=${amount}`);
                    return { ...bid.toObject(), amount };
                } catch (e) {
                    console.error('    - Decryption Failed:', e.message);
                    return { ...bid.toObject(), amount: Infinity };
                }
            });

            decryptedBids.sort((a, b) => {
                if (a.amount === b.amount) {
                    return new Date(a.createdAt) - new Date(b.createdAt);
                }
                return a.amount - b.amount;
            });

            const winner = decryptedBids[0];
            console.log(`  - Winner determined: ${winner.contractor} with amount $${winner.amount}`);

            try {
                tender.winner = winner._id;
                tender.status = 'closed';
                await tender.save();
                console.log('  - Tender updated successfully.');
            } catch (saveErr) {
                console.error('  - Failed to save tender update:', saveErr);
            }
        }

        console.log('Debug Run Complete.');
        process.exit();

    } catch (err) {
        console.error('Script Error:', err);
        process.exit(1);
    }
}

debugAutoAward();
