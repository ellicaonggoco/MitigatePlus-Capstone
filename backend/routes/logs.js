const express = require("express");
const router = express.Router();
const ActivityLog = require("../models/ActivityLog");
const { protect, authorize } = require("../middleware/auth");
const { generateActivityLogPDF } = require("../utils/generatePDF");

// @desc    Get all activity logs
// @route   GET /api/logs
router.get("/", protect, authorize("admin", "superadmin"), async (req, res) => {
  try {
    let query = {};

    // Filter by user role if provided
    if (req.query.userRole) {
      query.userRole = req.query.userRole;
    }

    // Filter by action type if provided
    if (req.query.action) {
      query.action = { $regex: req.query.action, $options: "i" };
    }

    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) {
        query.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 100);

    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error("Get logs error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching activity logs",
    });
  }
});

// @desc    Download activity logs as PDF
// @route   GET /api/logs/download
router.get(
  "/download",
  protect,
  authorize("admin", "superadmin"),
  async (req, res) => {
    try {
      let query = {};

      // Apply filters similar to GET route
      if (req.query.userRole) {
        query.userRole = req.query.userRole;
      }
      if (req.query.action) {
        query.action = { $regex: req.query.action, $options: "i" };
      }
      if (req.query.startDate || req.query.endDate) {
        query.createdAt = {};
        if (req.query.startDate) {
          query.createdAt.$gte = new Date(req.query.startDate);
        }
        if (req.query.endDate) {
          query.createdAt.$lte = new Date(req.query.endDate);
        }
      }

      const logs = await ActivityLog.find(query).sort({ createdAt: -1 });

      // Generate PDF
      const pdfBuffer = await generateActivityLogPDF(logs);

      // Log the download
      await ActivityLog.create({
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: "LOGS_PDF_DOWNLOADED",
        details: `Downloaded ${logs.length} activity logs as PDF`,
        ipAddress: req.ip,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=mitigateplus-logs-${Date.now()}.pdf`,
      );
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Download logs PDF error:", error);
      res.status(500).json({
        success: false,
        message: "Server error generating PDF",
      });
    }
  },
);

module.exports = router;
