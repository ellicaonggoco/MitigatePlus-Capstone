const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: [
      "Flood",
      "Fire",
      "Landslide",
      "Fault Line",
      "Typhoon",
      "Drainage Issue",
      "Structural Damage",
    ],
    required: [true, "Please specify hazard type"],
  },
  emoji: {
    type: String,
    default: "⚠️",
  },
  severity: {
    type: String,
    enum: ["low", "moderate", "high"],
    required: [true, "Please specify severity"],
  },
  description: {
    type: String,
    required: [true, "Please add a description"],
    maxlength: [500, "Description cannot be more than 500 characters"],
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, default: "" },
  },
  // optional start/end for flood corridors
  startLocation: {
    lat: { type: Number },
    lng: { type: Number },
  },
  endLocation: {
    lat: { type: Number },
    lng: { type: Number },
  },
  routeCoordinates: [
    {
      lat: Number,
      lng: Number,
    },
  ],
  indicatorType: {
    type: String,
    enum: ["circle", "line"],
    default: "circle",
  },
  radius: {
    type: Number,
    default: 150,
    min: 25,
    max: 3000,
  },
  imageUrl: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ["pending", "barangay_validated", "validated", "rejected", "on_hold"],
    default: "pending",
  },
  isEmergency: {
    type: Boolean,
    default: false,
  },
  emergencyAcknowledged: {
    type: Boolean,
    default: false,
  },
  emergencyPingedAt: {
    type: Date,
    default: null,
  },
  emergencyResolvedAt: {
    type: Date,
    default: null,
  },
  assignedOfficial: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  assignedArea: {
    type: String,
    default: "",
  },
  assignedAt: {
    type: Date,
    default: null,
  },
  barangayOfficialNote: {
    type: String,
    default: "",
  },
  adminNote: {
    type: String,
    default: "",
  },
  barangayValidatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  adminValidatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  barangay: {
    type: String,
    required: true,
  },

  // ---------- NEW: multi-validation for officials ----------
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  reportedByRole: {
    type: String,
    default: null,
  },
  validatedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  requiredValidations: {
    type: Number,
    default: 3,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

reportSchema.path("emoji").default("⚠️");

module.exports = mongoose.model("Report", reportSchema);
