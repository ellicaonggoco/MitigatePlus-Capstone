const mongoose = require("mongoose");
require("dotenv").config();
const Report = require("./models/Report");
const HazardZone = require("./models/HazardZone");
const EvacuationCenter = require("./models/EvacuationCenter");

const clean = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected");

  // Remove reports with missing lat/lng
  const badReports = await Report.find({
    $or: [
      { "location.lat": { $exists: false } },
      { "location.lng": { $exists: false } },
    ],
  });
  for (const r of badReports) {
    console.log("Removing bad report:", r._id);
    await r.deleteOne();
  }
  console.log(`Removed ${badReports.length} bad reports`);

  // Remove hazard zones with missing coordinates
  const badZones = await HazardZone.find({
    $or: [{ coordinates: { $size: 0 } }, { coordinates: { $exists: false } }],
  });
  for (const z of badZones) {
    console.log("Removing bad hazard zone:", z._id);
    await z.deleteOne();
  }
  console.log(`Removed ${badZones.length} bad hazard zones`);

  // Remove evacuation centers with missing lat/lng
  const badEvac = await EvacuationCenter.find({
    $or: [
      { "location.lat": { $exists: false } },
      { "location.lng": { $exists: false } },
    ],
  });
  for (const e of badEvac) {
    console.log("Removing bad evacuation center:", e._id);
    await e.deleteOne();
  }
  console.log(`Removed ${badEvac.length} bad evacuation centers`);

  console.log("Cleanup complete!");
  process.exit();
};

clean();
