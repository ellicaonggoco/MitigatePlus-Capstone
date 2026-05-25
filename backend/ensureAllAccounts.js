const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./models/User");

const accounts = [
  {
    name: "Super Admin",
    email: "admin@mitigateplus.com",
    password: "Admin123!",
    role: "superadmin",
    barangay: "Manila",
  },
  {
    name: "LGU Admin",
    email: "admin.lgu@mitigateplus.com",
    password: "Admin123!",
    role: "admin",
    barangay: "Manila",
  },
  {
    name: "Barangay Captain",
    email: "official@barangay.gov.ph",
    password: "Official123!",
    role: "barangay_official",
    barangay: "Manila",
  },
];

const ensureAll = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB\n");

    for (const acc of accounts) {
      const existing = await User.findOne({ email: acc.email });
      if (existing) {
        // Reset password & ensure active
        existing.password = acc.password; // pre-save hook will hash
        existing.role = acc.role;
        existing.isEmailVerified = true;
        existing.status = "active";
        await existing.save();
        console.log(`✅ RESET: ${acc.email} (${acc.role})`);
      } else {
        await User.create({
          ...acc,
          isEmailVerified: true,
          status: "active",
        });
        console.log(`✅ CREATED: ${acc.email} (${acc.role})`);
      }
    }

    console.log("\nAll accounts ready!");
    process.exit();
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
};

ensureAll();
