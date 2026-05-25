const mongoose = require("mongoose");

const hazardZoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a zone name"],
    trim: true,
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
    required: true,
  },
  riskLevel: {
    type: String,
    enum: ["low", "moderate", "high"],
    required: true,
  },
  coordinates: [
    {
      lat: Number,
      lng: Number,
    },
  ],
  radius: {
    type: Number,
    required: true,
    min: [10, "Radius must be at least 10 meters"],
    max: [3000, "Radius cannot exceed 3000 meters"],
  },
  description: {
    type: String,
    default: "",
  },
  isFloodZone: {
    type: Boolean,
    default: false,
  },
  placedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("HazardZone", hazardZoneSchema);
