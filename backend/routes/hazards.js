const express = require("express");
const router = express.Router();
const HazardZone = require("../models/HazardZone");
const ActivityLog = require("../models/ActivityLog");
const { protect, authorize } = require("../middleware/auth");

// @desc    Get all hazard zones
// @route   GET /api/hazards
router.get("/", async (req, res) => {
  try {
    const hazards = await HazardZone.find()
      .populate("placedBy", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: hazards.length,
      data: hazards,
    });
  } catch (error) {
    console.error("Get hazards error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching hazard zones",
    });
  }
});

// @desc    Create hazard zone
// @route   POST /api/hazards
router.post(
  "/",
  protect,
  authorize("admin", "superadmin"),
  async (req, res) => {
    try {
      const { name, type, riskLevel, coordinates, radius, description } =
        req.body;

      const hazard = await HazardZone.create({
        name,
        type,
        riskLevel,
        coordinates,
        radius,
        description: description || "",
        isFloodZone: type === "Flood",
        placedBy: req.user._id,
      });

      // Log activity
      await ActivityLog.create({
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: "HAZARD_ZONE_CREATED",
        details: `Created ${type} hazard zone: ${name}`,
        ipAddress: req.ip,
      });

      // Emit socket event
      const io = req.app.get("io");
      io.emit("new_hazard_zone", {
        zoneId: hazard._id,
        name: hazard.name,
        type: hazard.type,
        riskLevel: hazard.riskLevel,
        coordinates: hazard.coordinates,
        radius: hazard.radius,
      });

      res.status(201).json({
        success: true,
        data: hazard,
      });
    } catch (error) {
      console.error("Create hazard error:", error);
      res.status(500).json({
        success: false,
        message: "Server error creating hazard zone",
      });
    }
  },
);

// @desc    Update hazard zone
// @route   PUT /api/hazards/:id
router.put(
  "/:id",
  protect,
  authorize("admin", "superadmin"),
  async (req, res) => {
    try {
      const { name, type, riskLevel, coordinates, radius, description } =
        req.body;

      const hazard = await HazardZone.findByIdAndUpdate(
        req.params.id,
        {
          name,
          type,
          riskLevel,
          coordinates,
          radius,
          description,
          isFloodZone: type === "Flood",
        },
        { new: true },
      );

      if (!hazard) {
        return res.status(404).json({
          success: false,
          message: "Hazard zone not found",
        });
      }

      // Log activity
      await ActivityLog.create({
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: "HAZARD_ZONE_UPDATED",
        details: `Updated hazard zone: ${name}`,
        ipAddress: req.ip,
      });

      // Emit socket event
      const io = req.app.get("io");
      io.emit("zone_updated", {
        zoneId: hazard._id,
        name: hazard.name,
        type: hazard.type,
        riskLevel: hazard.riskLevel,
        radius: hazard.radius,
      });

      res.json({
        success: true,
        data: hazard,
      });
    } catch (error) {
      console.error("Update hazard error:", error);
      res.status(500).json({
        success: false,
        message: "Server error updating hazard zone",
      });
    }
  },
);

// @desc    Delete hazard zone
// @route   DELETE /api/hazards/:id
router.delete(
  "/:id",
  protect,
  authorize("admin", "superadmin"),
  async (req, res) => {
    try {
      const hazard = await HazardZone.findById(req.params.id);

      if (!hazard) {
        return res.status(404).json({
          success: false,
          message: "Hazard zone not found",
        });
      }

      await hazard.deleteOne();

      // Log activity
      await ActivityLog.create({
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: "HAZARD_ZONE_DELETED",
        details: `Deleted hazard zone: ${hazard.name}`,
        ipAddress: req.ip,
      });

      req.app.get("io").emit("hazard_zone_deleted", {
        zoneId: hazard._id,
        name: hazard.name,
      });

      res.json({
        success: true,
        message: "Hazard zone deleted successfully",
      });
    } catch (error) {
      console.error("Delete hazard error:", error);
      res.status(500).json({
        success: false,
        message: "Server error deleting hazard zone",
      });
    }
  },
);

module.exports = router;
