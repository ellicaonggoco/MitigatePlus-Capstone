const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  hazardType: {
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
    required: true,
  },
  answers: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  riskScore: {
    type: Number,
    required: true,
  },
  riskLevel: {
    type: String,
    enum: ["low", "moderate", "high"],
    required: true,
  },
  recommendations: [
    {
      type: String,
    },
  ],
  weakAreas: [
    {
      type: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Assessment", assessmentSchema);
