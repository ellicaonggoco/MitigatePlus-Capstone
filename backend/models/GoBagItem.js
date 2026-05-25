const mongoose = require("mongoose");

const goBagItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add item name"],
    trim: true,
  },
  category: {
    type: String,
    required: true,
    enum: [
      "Food & Water",
      "First Aid",
      "Tools",
      "Documents",
      "Clothing",
      "Hygiene",
      "Communication",
      "Other",
    ],
  },
  description: {
    type: String,
    default: "",
  },
  whyImportant: {
    type: String,
    default: "",
  },
  forRiskLevel: [
    {
      type: String,
      enum: ["low", "moderate", "high"],
    },
  ],
  imageUrl: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("GoBagItem", goBagItemSchema);
