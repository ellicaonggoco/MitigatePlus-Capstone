const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

const resetAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const admin = await User.findOne({ email: "admin@mitigateplus.com" });
    if (!admin) {
      console.log("Admin not found. Please create one first.");
      process.exit();
    }

    // Set new password (will be hashed by the pre-save hook)
    admin.password = "Admin123!";
    admin.role = "superadmin";
    admin.isEmailVerified = true;
    admin.status = "active";
    await admin.save();

    console.log("✅ Admin password reset successfully!");
    console.log("   Email: admin@mitigateplus.com");
    console.log("   Password: Admin123!");
    process.exit();
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
};

resetAdmin();
