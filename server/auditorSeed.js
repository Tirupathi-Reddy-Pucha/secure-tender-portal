require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const seedAuditor = async () => {
  try {
    // 1. Connect to DB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔌 Connected to DB...");

    // 2. Check if Auditor already exists
    const existingAuditor = await User.findOne({ email: "auditor@gov.in" });
    if (existingAuditor) {
      console.log("⚠️ Auditor already exists!");
      process.exit();
    }

    // 4. Create the Hardcoded Auditor
    const auditor = new User({
      username: "Chief_Auditor",
      email: "auditor@gov.in",
      password: "secureAuditPass2026",
      role: "auditor" // This is the ONLY place this role is allowed
    });

    await auditor.save();
    console.log("✅ Auditor Account Created Successfully!");
    console.log("📧 Email: auditor@gov.in");
    console.log("🔑 Password: secureAuditPass2026");

    process.exit();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

seedAuditor();