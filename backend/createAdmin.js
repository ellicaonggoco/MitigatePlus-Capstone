// Run this once to create an admin account
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Admin123!", salt);

    const admin = await User.create({
      name: "Super Admin",
      email: "admin@mitigateplus.com",
      password: "Admin123!", // will be hashed by the pre-save hook
      role: "superadmin",
      barangay: "Manila",
      isEmailVerified: true,
      status: "active",
    });

    console.log("✅ Admin created successfully:");
    console.log("   Email: admin@mitigateplus.com");
    console.log("   Password: Admin123!");
    process.exit();
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
};

createAdmin();
