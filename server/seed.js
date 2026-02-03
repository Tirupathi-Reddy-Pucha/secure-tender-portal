const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/secure-tender', {})
    .then(() => {
        console.log('MongoDB Connected');
        seedUsers();
    })
    .catch(err => {
        console.log(err);
        process.exit(1);
    });

const seedUsers = async () => {
    try {
        await User.deleteMany({});

        const users = [
            { username: 'contractor', email: 'contractor@example.com', password: 'password', role: 'contractor' },
            { username: 'officer', email: 'officer@example.com', password: 'password', role: 'officer' },
            { username: 'auditor', email: 'auditor@example.com', password: 'password', role: 'auditor' }
        ];

        for (const u of users) {
            const user = new User(u);
            await user.save();
        }

        console.log('Users Seeded: contractor, officer, auditor (pass: password)');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
