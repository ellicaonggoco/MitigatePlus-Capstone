const mongoose = require("mongoose");

const evacuationCenterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add center name"],
    trim: true,
  },
  address: {
    type: String,
    required: [true, "Please add an address"],
  },
  location: {
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
  },
  capacity: {
    type: Number,
    required: [true, "Please add capacity"],
  },
  contactPerson: {
    type: String,
    default: "",
  },
  contactNumber: {
    type: String,
    default: "",
  },
  facilities: [
    {
      type: String,
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
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

module.exports = mongoose.model("EvacuationCenter", evacuationCenterSchema);
