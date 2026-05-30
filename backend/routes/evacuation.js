const express = require("express");
const router = express.Router();
const EvacuationCenter = require("../models/EvacuationCenter");
const ActivityLog = require("../models/ActivityLog");
const { protect, authorize } = require("../middleware/auth");

// @desc    Get all evacuation centers
// @route   GET /api/evacuation
router.get("/", async (req, res) => {
  try {
    const centers = await EvacuationCenter.find({ isActive: true })
      .populate("placedBy", "name")
      .sort({ name: 1 });

    res.json({
      success: true,
      count: centers.length,
      data: centers,
    });
  } catch (error) {
    console.error("Get evacuation centers error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching evacuation centers",
    });
  }
});

// @desc    Create evacuation center
// @route   POST /api/evacuation
router.post(
  "/",
  protect,
  authorize("admin", "superadmin"),
  async (req, res) => {
    try {
      const {
        name,
        address,
        location,
        capacity,
        contactPerson,
        contactNumber,
        facilities,
      } = req.body;

      const center = await EvacuationCenter.create({
        name,
        address,
        location,
        capacity,
        contactPerson: contactPerson || "",
        contactNumber: contactNumber || "",
        facilities: facilities || [],
        isActive: true,
        placedBy: req.user._id,
      });

      // Log activity
      await ActivityLog.create({
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: "EVACUATION_CENTER_CREATED",
        details: `Created evacuation center: ${name}`,
        ipAddress: req.ip,
      });

      // Emit socket event
      const io = req.app.get("io");
      io.emit("new_evacuation", {
        centerId: center._id,
        name: center.name,
        location: center.location,
      });

      res.status(201).json({
        success: true,
        data: center,
      });
    } catch (error) {
      console.error("Create evacuation center error:", error);
      res.status(500).json({
        success: false,
        message: "Server error creating evacuation center",
      });
    }
  },
);

// @desc    Update evacuation center
// @route   PUT /api/evacuation/:id
router.put(
  "/:id",
  protect,
  authorize("admin", "superadmin"),
  async (req, res) => {
    try {
      const {
        name,
        address,
        location,
        capacity,
        contactPerson,
        contactNumber,
        facilities,
        isActive,
      } = req.body;

      const center = await EvacuationCenter.findByIdAndUpdate(
        req.params.id,
        {
          name,
          address,
          location,
          capacity,
          contactPerson,
          contactNumber,
          facilities,
          isActive,
        },
        { new: true },
      );

      if (!center) {
        return res.status(404).json({
          success: false,
          message: "Evacuation center not found",
        });
      }

      // Log activity
      await ActivityLog.create({
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: "EVACUATION_CENTER_UPDATED",
        details: `Updated evacuation center: ${name}`,
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        data: center,
      });
    } catch (error) {
      console.error("Update evacuation center error:", error);
      res.status(500).json({
        success: false,
        message: "Server error updating evacuation center",
      });
    }
  },
);

// @desc    Delete evacuation center
// @route   DELETE /api/evacuation/:id
router.delete(
  "/:id",
  protect,
  authorize("admin", "superadmin"),
  async (req, res) => {
    try {
      const center = await EvacuationCenter.findById(req.params.id);

      if (!center) {
        return res.status(404).json({
          success: false,
          message: "Evacuation center not found",
        });
      }

      await center.deleteOne();

      // Log activity
      await ActivityLog.create({
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: "EVACUATION_CENTER_DELETED",
        details: `Deleted evacuation center: ${center.name}`,
        ipAddress: req.ip,
      });

      req.app.get("io").emit("evacuation_deleted", {
        centerId: center._id,
        name: center.name,
      });

      res.json({
        success: true,
        message: "Evacuation center deleted successfully",
      });
    } catch (error) {
      console.error("Delete evacuation center error:", error);
      res.status(500).json({
        success: false,
        message: "Server error deleting evacuation center",
      });
    }
  },
);

module.exports = router;
