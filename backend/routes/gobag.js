const express = require("express");
const router = express.Router();
const GoBagItem = require("../models/GoBagItem");
const ActivityLog = require("../models/ActivityLog");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

// @desc    Get all go bag items
// @route   GET /api/gobag
router.get("/", async (req, res) => {
  try {
    const items = await GoBagItem.find().sort({ category: 1, name: 1 });

    res.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error("Get go bag items error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching go bag items",
    });
  }
});

// @desc    Create go bag item
// @route   POST /api/gobag
router.post(
  "/",
  protect,
  authorize("admin", "superadmin"),
  upload.single("image"),
  async (req, res) => {
    try {
      const { name, category, description, whyImportant, forRiskLevel } =
        req.body;

      const item = await GoBagItem.create({
        name,
        category,
        description: description || "",
        whyImportant: whyImportant || "",
        forRiskLevel: JSON.parse(forRiskLevel || '["low","moderate","high"]'),
        imageUrl: req.file ? req.file.path : null,
      });

      // Log activity
      await ActivityLog.create({
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: "GOBAG_ITEM_CREATED",
        details: `Added go bag item: ${name}`,
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        data: item,
      });
    } catch (error) {
      console.error("Create go bag item error:", error);
      res.status(500).json({
        success: false,
        message: "Server error creating go bag item",
      });
    }
  },
);

// @desc    Delete go bag item
// @route   DELETE /api/gobag/:id
router.delete(
  "/:id",
  protect,
  authorize("admin", "superadmin"),
  async (req, res) => {
    try {
      const item = await GoBagItem.findById(req.params.id);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Go bag item not found",
        });
      }

      await item.deleteOne();

      // Log activity
      await ActivityLog.create({
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: "GOBAG_ITEM_DELETED",
        details: `Deleted go bag item: ${item.name}`,
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        message: "Go bag item deleted successfully",
      });
    } catch (error) {
      console.error("Delete go bag item error:", error);
      res.status(500).json({
        success: false,
        message: "Server error deleting go bag item",
      });
    }
  },
);

// Seed default go bag items
router.post(
  "/seed-default",
  protect,
  authorize("superadmin"),
  async (req, res) => {
    try {
      const defaultItems = [
        {
          name: "Drinking Water (1 gallon per person)",
          category: "Food & Water",
          description: "4 liters per person per day",
          whyImportant: "Essential for survival during emergencies",
          forRiskLevel: ["low", "moderate", "high"],
        },
        {
          name: "Non-perishable Food (3-day supply)",
          category: "Food & Water",
          description: "Canned goods, energy bars, dried food",
          whyImportant:
            "Provides nutrition when regular food supply is disrupted",
          forRiskLevel: ["low", "moderate", "high"],
        },
        {
          name: "First Aid Kit",
          category: "First Aid",
          description: "Bandages, antiseptic, medicines, scissors",
          whyImportant:
            "Critical for treating injuries when medical help is delayed",
          forRiskLevel: ["low", "moderate", "high"],
        },
        {
          name: "Flashlight with Extra Batteries",
          category: "Tools",
          description: "LED flashlight preferred",
          whyImportant: "Essential for visibility during power outages",
          forRiskLevel: ["low", "moderate", "high"],
        },
        {
          name: "Multi-tool or Swiss Army Knife",
          category: "Tools",
          description: "Basic toolset in one device",
          whyImportant: "Versatile tool for various emergency situations",
          forRiskLevel: ["moderate", "high"],
        },
        {
          name: "Important Documents (Waterproof Container)",
          category: "Documents",
          description: "IDs, insurance, medical records, bank info",
          whyImportant: "Protects critical documents from water damage",
          forRiskLevel: ["low", "moderate", "high"],
        },
        {
          name: "Cash (Small Bills)",
          category: "Documents",
          description: "At least ₱1000 in small denominations",
          whyImportant: "ATMs and card payments may be unavailable",
          forRiskLevel: ["moderate", "high"],
        },
        {
          name: "Emergency Blanket",
          category: "Clothing",
          description: "Thermal/space blanket",
          whyImportant: "Prevents hypothermia and provides warmth",
          forRiskLevel: ["moderate", "high"],
        },
        {
          name: "Change of Clothes",
          category: "Clothing",
          description: "Weather-appropriate, sturdy shoes",
          whyImportant: "Dry clothes prevent illness and discomfort",
          forRiskLevel: ["low", "moderate", "high"],
        },
        {
          name: "Personal Hygiene Items",
          category: "Hygiene",
          description: "Toothbrush, toothpaste, soap, sanitizer",
          whyImportant: "Prevents disease spread in evacuation centers",
          forRiskLevel: ["low", "moderate", "high"],
        },
        {
          name: "Face Masks (N95)",
          category: "Hygiene",
          description: "At least 5 masks per person",
          whyImportant: "Protection from dust, smoke, and airborne particles",
          forRiskLevel: ["moderate", "high"],
        },
        {
          name: "Whistle",
          category: "Communication",
          description: "Loud emergency whistle",
          whyImportant: "Signal for help when voice communication fails",
          forRiskLevel: ["moderate", "high"],
        },
        {
          name: "Power Bank",
          category: "Communication",
          description: "Fully charged, 10000mAh minimum",
          whyImportant: "Keeps phone charged for emergency communications",
          forRiskLevel: ["low", "moderate", "high"],
        },
        {
          name: "Emergency Contact List",
          category: "Communication",
          description: "Written list of emergency numbers",
          whyImportant: "Access contacts even if phone dies",
          forRiskLevel: ["low", "moderate", "high"],
        },
        {
          name: "Raincoat or Poncho",
          category: "Clothing",
          description: "Waterproof rain gear",
          whyImportant: "Protection from rain during evacuation",
          forRiskLevel: ["low", "moderate", "high"],
        },
        {
          name: "Rope (20 feet)",
          category: "Tools",
          description: "Strong nylon or paracord",
          whyImportant: "Multiple uses: securing items, rescue, climbing",
          forRiskLevel: ["high"],
        },
        {
          name: "Dust Mask",
          category: "Hygiene",
          description: "N95 or better",
          whyImportant: "Protection from debris dust after disasters",
          forRiskLevel: ["high"],
        },
        {
          name: "Fire Extinguisher (Small)",
          category: "Tools",
          description: "ABC type, 1kg minimum",
          whyImportant: "Quick response to small fires",
          forRiskLevel: ["high"],
        },
        {
          name: "Local Maps",
          category: "Documents",
          description: "Printed maps with evacuation routes",
          whyImportant: "Navigation when GPS is unavailable",
          forRiskLevel: ["moderate", "high"],
        },
        {
          name: "Pet Supplies",
          category: "Other",
          description: "Food, water, leash, carrier",
          whyImportant: "Don't forget your pets during evacuation",
          forRiskLevel: ["low", "moderate", "high"],
        },
        {
          name: "Prescription Medications",
          category: "First Aid",
          description: "7-day supply minimum",
          whyImportant: "Critical medications must not be interrupted",
          forRiskLevel: ["low", "moderate", "high"],
        },
        {
          name: "Plastic Sheeting and Duct Tape",
          category: "Tools",
          description: "10x10 feet minimum",
          whyImportant: "Creates temporary shelter and seals openings",
          forRiskLevel: ["high"],
        },
        {
          name: "Wrench or Pliers",
          category: "Tools",
          description: "For utility shutoffs",
          whyImportant: "Turn off gas, water in emergencies",
          forRiskLevel: ["moderate", "high"],
        },
        {
          name: "Sleeping Bag or Warm Blanket",
          category: "Clothing",
          description: "Per person",
          whyImportant: "Essential for comfort in evacuation centers",
          forRiskLevel: ["low", "moderate", "high"],
        },
      ];

      await GoBagItem.deleteMany({}); // Clear existing items
      const items = await GoBagItem.insertMany(defaultItems);

      res.json({
        success: true,
        message: "Default go bag items seeded",
        count: items.length,
      });
    } catch (error) {
      console.error("Seed go bag items error:", error);
      res.status(500).json({
        success: false,
        message: "Server error seeding go bag items",
      });
    }
  },
);

module.exports = router;
