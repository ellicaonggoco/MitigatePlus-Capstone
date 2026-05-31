const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
    trim: true,
    maxlength: [100, "Name cannot be more than 100 characters"],
  },
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please add a valid email",
    ],
  },
  phone: {
    type: String,
    trim: true,
    default: "",
  },
  address: {
    type: String,
    trim: true,
    maxlength: [180, "Address cannot be more than 180 characters"],
    default: "",
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
    minlength: [6, "Password must be at least 6 characters"],
    select: false,
  },
  role: {
    type: String,
    enum: ["resident", "barangay_official", "admin", "superadmin"],
    default: "resident",
  },
  barangay: {
    type: String,
    required: [true, "Please specify barangay"],
  },
  isBarangayOfficial: {
    type: Boolean,
    default: false,
  },
  officialIdUrl: {
    type: String,
    default: null,
  },
  officialAccessRejectedReason: {
    type: String,
    trim: true,
    maxlength: [500, "Rejection reason cannot be more than 500 characters"],
    default: "",
  },
  officialAccessRejectedAt: {
    type: Date,
    default: null,
  },
  profilePictureUrl: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ["pending_otp", "pending_approval", "active", "suspended"],
    default: "pending_otp",
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  barangayAssigned: {
    type: String,
    default: null,
  },
  lastKnownLocation: {
    lat: {
      type: Number,
      default: null,
    },
    lng: {
      type: Number,
      default: null,
    },
    accuracy: {
      type: Number,
      default: null,
    },
    updatedAt: {
      type: Date,
      default: null,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password using bcrypt (only if password is modified)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next(); // <-- fixed: stop here if password not changed
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next(); // proceed after hashing
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
