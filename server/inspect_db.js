const mongoose = require('mongoose');
const Tender = require('./models/Tender');
const Bid = require('./models/Bid');
require('dotenv').config();

async function inspect() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/secure-tender', {});
        console.log('Connected to DB');
        console.log('Server Time (UTC):', new Date().toISOString());

        const tenders = await Tender.find({});
        console.log(`\n=== FOUND ${tenders.length} TENDERS ===`);
        for (const t of tenders) {
            const bids = await Bid.find({ projectId: t._id });
            console.log(`\n[TENDER] ID: ${t._id}`);
            console.log(`  Title: ${t.title}`);
            console.log(`  Status: ${t.status}`);
            console.log(`  Deadline (UTC): ${t.deadline.toISOString()}`);
            console.log(`  Has Passed? ${t.deadline < new Date()}`);
            console.log(`  WinnerID: ${t.winner}`);
            console.log(`  Bids Count: ${bids.length}`);
            bids.forEach(b => console.log(`    - BidID: ${b._id} | Time: ${b.createdAt.toISOString()}`));
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspect();
