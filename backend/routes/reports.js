const express = require("express");
const router = express.Router();
const axios = require("axios");
const Report = require("../models/Report");
const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

const MANILA_BOUNDS = {
  minLat: 14.55,
  maxLat: 14.64,
  minLng: 120.94,
  maxLng: 121.03,
};

const isManilaLocation = (point) =>
  point &&
  point.lat >= MANILA_BOUNDS.minLat &&
  point.lat <= MANILA_BOUNDS.maxLat &&
  point.lng >= MANILA_BOUNDS.minLng &&
  point.lng <= MANILA_BOUNDS.maxLng;

const OFFICIAL_NEARBY_RADIUS_METERS = 1000;

const distanceInMeters = (lat1, lng1, lat2, lng2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const normalizeArea = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const isReportInOfficialScope = (report, official) => {
  const assignedBarangay = normalizeArea(
    official.barangayAssigned || official.barangay,
  );
  const reportBarangay = normalizeArea(report.barangay);

  if (assignedBarangay && reportBarangay && assignedBarangay === reportBarangay) {
    return true;
  }

  const officialLocation = official.lastKnownLocation;
  if (
    Number.isFinite(officialLocation?.lat) &&
    Number.isFinite(officialLocation?.lng) &&
    Number.isFinite(report.location?.lat) &&
    Number.isFinite(report.location?.lng)
  ) {
    return (
      distanceInMeters(
        officialLocation.lat,
        officialLocation.lng,
        report.location.lat,
        report.location.lng,
      ) <= OFFICIAL_NEARBY_RADIUS_METERS
    );
  }

  return false;
};

const reportIcons = {
  Flood: "💧",
  Fire: "🔥",
  Landslide: "⛰️",
  "Fault Line": "⚡",
  Typhoon: "🌀",
  "Drainage Issue": "▦",
  "Structural Damage": "🏚️",
};

Object.assign(reportIcons, {
  Flood: "\u{1F30A}",
  Fire: "\u{1F525}",
  Landslide: "\u{26F0}\u{FE0F}",
  "Fault Line": "\u{26A1}",
  Typhoon: "\u{1F32A}\u{FE0F}",
  "Drainage Issue": "\u{1F6A7}",
  "Structural Damage": "\u{1F3DA}\u{FE0F}",
});

const findAssignedOfficial = async (barangay) => {
  if (!barangay) return null;
  return User.findOne({
    role: "barangay_official",
    status: "active",
    $or: [{ barangayAssigned: barangay }, { barangay }],
  }).select("name email barangay barangayAssigned");
};

const getStreetRouteCoordinates = async (waypoints) => {
  if (!process.env.ORS_API_KEY || !waypoints || waypoints.length < 2) {
    return waypoints || [];
  }

  try {
    const coordinates = waypoints.map((point) => [point.lng, point.lat]);
    const response = await axios.post(
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
      { coordinates },
      {
        headers: {
          Authorization: process.env.ORS_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 12000,
      },
    );

    return response.data.features[0].geometry.coordinates.map(([lng, lat]) => ({
      lat,
      lng,
    }));
  } catch (error) {
    console.error("Report routing error:", error.response?.data || error.message);
    return waypoints;
  }
};

// @desc    Submit report (resident or official)
// @route   POST /api/reports
router.post("/", protect, upload.single("image"), async (req, res) => {
  try {
    const {
      type,
      emoji,
      severity,
      description,
      location,
      address,
      barangay,
      startLocation,
      endLocation,
      routeWaypoints,
      isEmergency,
      emergencyAcknowledged,
    } = req.body;

    const emergency = isEmergency === true || isEmergency === "true";
    const acknowledged =
      emergencyAcknowledged === true || emergencyAcknowledged === "true";
    const parsedLocation = JSON.parse(location);
    const parsedStartLocation = startLocation ? JSON.parse(startLocation) : undefined;
    const parsedEndLocation = endLocation ? JSON.parse(endLocation) : undefined;
    const parsedRouteWaypoints = routeWaypoints ? JSON.parse(routeWaypoints) : [];
    const validRouteWaypoints = Array.isArray(parsedRouteWaypoints)
      ? parsedRouteWaypoints.filter((point) => Number.isFinite(point?.lat) && Number.isFinite(point?.lng))
      : [];
    const routeBase =
      type === "Flood" && validRouteWaypoints.length >= 2
        ? validRouteWaypoints
        : parsedStartLocation && parsedEndLocation
          ? [parsedStartLocation, parsedEndLocation]
          : [];
    const routeCoordinates =
      type === "Flood" && routeBase.length >= 2
        ? await getStreetRouteCoordinates(routeBase)
        : [];

    if (
      !isManilaLocation(parsedLocation) ||
      (parsedStartLocation && !isManilaLocation(parsedStartLocation)) ||
      (parsedEndLocation && !isManilaLocation(parsedEndLocation)) ||
      validRouteWaypoints.some((point) => !isManilaLocation(point))
    ) {
      return res.status(400).json({
        success: false,
        message: "Reports are limited to the City of Manila map area",
      });
    }

    if (emergency && !acknowledged) {
      return res.status(400).json({
        success: false,
        message: "Emergency reports require acknowledgement",
      });
    }

    const reportBarangay = barangay || req.user.barangay;
    const assignedOfficial = emergency
      ? await findAssignedOfficial(reportBarangay)
      : null;

    const report = await Report.create({
      userId: req.user._id,
      type,
      emoji: emoji || reportIcons[type] || "⚠️",
      severity,
      description,
      location: parsedLocation,
      startLocation: parsedStartLocation,
      endLocation: parsedEndLocation,
      routeCoordinates,
      imageUrl: req.file ? req.file.path : null,
      barangay: reportBarangay,
      isEmergency: emergency,
      emergencyAcknowledged: acknowledged,
      emergencyPingedAt: emergency ? new Date() : null,
      assignedOfficial: assignedOfficial?._id || null,
      assignedArea: emergency ? reportBarangay : "",
      assignedAt: assignedOfficial ? new Date() : null,

      // NEW: tracks who submitted and sets validation requirement
      reportedBy: req.user._id,
      reportedByRole: req.user.role,
      requiredValidations: 3,
    });

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: emergency ? "EMERGENCY_PING_SUBMITTED" : "REPORT_SUBMITTED",
      details: emergency
        ? `Emergency ping submitted for ${type} at ${parsedLocation.lat}, ${parsedLocation.lng}`
        : `Submitted ${type} report - ${severity} severity`,
      ipAddress: req.ip,
    });

    const io = req.app.get("io");
    const assignedOfficialPayload = assignedOfficial
      ? {
          id: assignedOfficial._id,
          name: assignedOfficial.name,
          email: assignedOfficial.email,
          barangay: assignedOfficial.barangayAssigned || assignedOfficial.barangay,
        }
      : null;
    io.emit("new_report", {
      reportId: report._id,
      type: report.type,
      severity: report.severity,
      location: report.location,
      barangay: report.barangay,
      isEmergency: report.isEmergency,
      emergencyPingedAt: report.emergencyPingedAt,
      assignedOfficial: assignedOfficialPayload,
    });
    if (report.isEmergency || report.severity === "high") {
      io.emit("urgent_report", {
        reportId: report._id,
        type: report.type,
        severity: report.severity,
        description: report.description,
        location: report.location,
        barangay: report.barangay,
        isEmergency: report.isEmergency,
        emergencyPingedAt: report.emergencyPingedAt,
        assignedOfficial: assignedOfficialPayload,
        reporter: {
          id: req.user._id,
          name: req.user.name,
          role: req.user.role,
          email: req.user.email,
        },
      });
    }

    res.status(201).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Submit report error:", error);
    res.status(500).json({
      success: false,
      message: "Server error submitting report",
    });
  }
});

// @desc    Get all reports (admin / official)
// @route   GET /api/reports
router.get(
  "/",
  protect,
  authorize("admin", "superadmin", "barangay_official"),
  async (req, res) => {
    try {
      let query = {};

      if (req.query.status) query.status = req.query.status;
      if (req.query.type) query.type = req.query.type;
      if (req.query.barangay && req.user.role !== "barangay_official") {
        query.barangay = req.query.barangay;
      }
      if (req.query.severity) query.severity = req.query.severity;

      let reports = await Report.find(query)
        .populate("userId", "name email phone barangay address")
        .populate("reportedBy", "name email phone barangay address")
        .populate("assignedOfficial", "name email barangay barangayAssigned")
        .populate("barangayValidatedBy", "name")
        .populate("adminValidatedBy", "name")
        .populate("validatedBy", "name")
        .sort({ isEmergency: -1, emergencyPingedAt: -1, createdAt: -1 });

      if (req.user.role === "barangay_official") {
        reports = reports.filter((report) =>
          isReportInOfficialScope(report, req.user),
        );
      }

      res.json({
        success: true,
        count: reports.length,
        data: reports,
      });
    } catch (error) {
      console.error("Get reports error:", error);
      res.status(500).json({
        success: false,
        message: "Server error fetching reports",
      });
    }
  },
);

// @desc    Get validated reports (public map)
// @route   GET /api/reports/validated
router.get("/validated", async (req, res) => {
  try {
    const reports = await Report.find({ status: "validated" })
      .select(
        "type emoji severity description location startLocation endLocation routeCoordinates imageUrl barangay isEmergency createdAt",
      )
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error("Get validated reports error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching validated reports",
    });
  }
});

// @desc    Get reports by barangay (official)
// @route   GET /api/reports/barangay/:name
router.get(
  "/barangay/:name",
  protect,
  authorize("barangay_official", "admin", "superadmin"),
  async (req, res) => {
    try {
      const reports = await Report.find({ barangay: req.params.name })
        .populate("userId", "name email")
        .populate("assignedOfficial", "name email barangay barangayAssigned")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        count: reports.length,
        data: reports,
      });
    } catch (error) {
      console.error("Get barangay reports error:", error);
      res.status(500).json({
        success: false,
        message: "Server error fetching barangay reports",
      });
    }
  },
);

// @desc    Update report status (admin/official) – DUAL‑VALIDATION LOGIC
// @route   PATCH /api/reports/:id/status
router.patch("/:id/status", protect, async (req, res) => {
  try {
    const { status, note } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // ==================== BARANGAY OFFICIAL ====================
    if (req.user.role === "barangay_official") {
      if (report.status !== "pending") {
        return res.status(403).json({
          success: false,
          message: "Officials can only review pending reports",
        });
      }

      if (!isReportInOfficialScope(report, req.user)) {
        return res.status(403).json({
          success: false,
          message: "This report is outside your barangay or nearby area",
        });
      }

      if (status === "rejected") {
        if (!report.isEmergency && report.severity !== "high") {
          return res.status(403).json({
            success: false,
            message: "Only urgent or high-risk reports can be quickly rejected by officials",
          });
        }

        report.status = "rejected";
        report.barangayOfficialNote = note || "";
        report.barangayValidatedBy = req.user._id;
        await report.save();

        await ActivityLog.create({
          userId: req.user._id,
          userName: req.user.name,
          userRole: req.user.role,
          action: "REPORT_REJECTED_BY_OFFICIAL",
          details: `Barangay official rejected urgent report ${report._id}`,
          ipAddress: req.ip,
        });

        req.app.get("io").emit("report_validated", {
          reportId: report._id,
          status: report.status,
          type: report.type,
          location: report.location,
        });

        return res.json({ success: true, data: report });
      }

      if (report.reportedBy?.toString() === req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You cannot validate your own report",
        });
      }

      const alreadyValidated = report.validatedBy.some(
        (id) => id.toString() === req.user._id.toString(),
      );
      if (alreadyValidated) {
        return res.status(403).json({
          success: false,
          message: "You have already validated this report",
        });
      }

      report.validatedBy.push(req.user._id);
      report.barangayOfficialNote = note || report.barangayOfficialNote;
      report.requiredValidations = report.requiredValidations || 3;

      if (report.validatedBy.length >= report.requiredValidations) {
        report.status = "barangay_validated";
        report.barangayValidatedBy = req.user._id;
      }

      await report.save();

      await ActivityLog.create({
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: "REPORT_VALIDATED",
        details: `Barangay official validated report ${report._id} (${report.validatedBy.length}/${report.requiredValidations})`,
        ipAddress: req.ip,
      });

      const io = req.app.get("io");
      io.emit("report_validated", {
        reportId: report._id,
        status: report.status,
        type: report.type,
        location: report.location,
        validations: report.validatedBy.length,
        requiredValidations: report.requiredValidations,
      });

      return res.json({
        success: true,
        data: report,
      });
    }

    // ==================== ADMIN / SUPERAD ====================
    if (req.user.role === "admin" || req.user.role === "superadmin") {
      if (["validated", "rejected", "on_hold", "pending", "barangay_validated"].includes(status)) {
        report.status = status;
        report.adminNote = note || "";
        if (status === "pending" || status === "barangay_validated") {
          report.adminValidatedBy = null;
          report.adminNote = "";
        } else {
          report.adminValidatedBy = req.user._id;
        }
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid status update",
        });
      }

      await report.save();

      await ActivityLog.create({
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: `REPORT_${status.toUpperCase()}`,
        details: `${req.user.role} ${status} report for ${report.type}`,
        ipAddress: req.ip,
      });

      const io = req.app.get("io");
      io.emit("report_validated", {
        reportId: report._id,
        status: report.status,
        type: report.type,
        location: report.location,
      });

      return res.json({
        success: true,
        data: report,
      });
    }

    // Any other role – not allowed
    return res.status(403).json({
      success: false,
      message: "You are not authorized to update this report",
    });
  } catch (error) {
    console.error("Update report status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating report status",
    });
  }
});

// @desc    Delete report (admin)
// @route   DELETE /api/reports/:id
router.delete(
  "/:id",
  protect,
  authorize("admin", "superadmin"),
  async (req, res) => {
    try {
      const report = await Report.findById(req.params.id);
      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Report not found",
        });
      }

      await report.deleteOne();

      await ActivityLog.create({
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: "REPORT_DELETED",
        details: `Deleted report for ${report.type}`,
        ipAddress: req.ip,
      });

      req.app.get("io").emit("report_deleted", {
        reportId: report._id,
        type: report.type,
      });

      res.json({
        success: true,
        message: "Report deleted successfully",
      });
    } catch (error) {
      console.error("Delete report error:", error);
      res.status(500).json({
        success: false,
        message: "Server error deleting report",
      });
    }
  },
);

module.exports = router;
