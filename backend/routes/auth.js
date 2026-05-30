const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const OTP = require("../models/OTP");
const sendEmail = require("../utils/sendEmail");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");
const ActivityLog = require("../models/ActivityLog");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const createAndSendRegisterOTP = async (user, officialRequested = false) => {
  await OTP.deleteMany({ email: user.email, type: "register" });

  const otp = generateOTP();
  const otpRecord = await OTP.create({
    email: user.email,
    otp,
    type: "register",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  try {
    await sendEmail({
      email: user.email,
      subject: "MitigatePlus - Email Verification OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0d2b6b;">MitigatePlus - Verify Your Email</h2>
          <p>Hello ${user.name || ""},</p>
          <p>Your OTP for email verification is:</p>
          <h1 style="color: #1565c0; font-size: 36px; text-align: center; background: #f0f4ff; padding: 20px; border-radius: 10px;">
            ${otp}
          </h1>
          <p>This OTP will expire in 10 minutes.</p>
          ${
            officialRequested
              ? "<p>Your account will open as a resident after verification. Barangay official tools will be enabled after admin approval.</p>"
              : ""
          }
          <p>If you did not create an account, please ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    await OTP.deleteOne({ _id: otpRecord._id });
    throw error;
  }
};

// @desc    Register user
// @route   POST /api/auth/register
router.post("/register", upload.single("officialId"), async (req, res) => {
  try {
    const { name, password, phone, address, barangay, isBarangayOfficial } = req.body;
    const email = normalizeEmail(req.body.email);
    const officialRequested = isBarangayOfficial === "true";
    const missingFields = [];

    if (!name?.trim()) missingFields.push("name");
    if (!email) missingFields.push("email");
    if (!phone?.trim()) missingFields.push("mobile number");
    if (!barangay?.trim()) missingFields.push("barangay");
    if (!address?.trim()) missingFields.push("complete address");
    if (!password) missingFields.push("password");

    if (missingFields.length) {
      return res.status(400).json({
        success: false,
        message: `Please provide: ${missingFields.join(", ")}`,
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      if (!userExists.isEmailVerified || userExists.status === "pending_otp") {
        await createAndSendRegisterOTP(
          userExists,
          userExists.isBarangayOfficial,
        );

        return res.status(200).json({
          success: true,
          message: "This email is already registered but not verified. We sent a new OTP.",
          data: {
            userId: userExists._id,
            email: userExists.email,
            requiresOTP: true,
            officialAccessPending:
              userExists.isBarangayOfficial &&
              userExists.role !== "barangay_official",
          },
        });
      }

      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Create user
    const userData = {
      name,
      email,
      password,
      phone,
      address,
      barangay,
      role: "resident",
      isBarangayOfficial: officialRequested,
      officialIdUrl: req.file ? req.file.path : null,
      status: "pending_otp",
    };

    const user = await User.create(userData);

    try {
      await createAndSendRegisterOTP(user, officialRequested);
    } catch (error) {
      await User.deleteOne({ _id: user._id });
      throw error;
    }

    res.status(201).json({
      success: true,
      message: officialRequested
        ? "User registered. Verify your email to continue as a resident while admin reviews official access."
        : "User registered. Please verify your email with the OTP sent.",
      data: {
        userId: user._id,
        email: user.email,
        requiresOTP: true,
        officialAccessPending: officialRequested,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }
    res.status(500).json({
      success: false,
      message:
        error.publicMessage ||
        "Could not send OTP. Please check the email address and try again.",
    });
  }
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
router.post("/verify-otp", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { otp } = req.body;

    const otpRecord = await OTP.findOne({
      email,
      type: "register",
      isUsed: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "No OTP found or OTP expired. Please request a new one.",
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteMany({ email, type: "register" });
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    const isMatch = await otpRecord.matchOTP(otp);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with this email",
      });
    }

    const wasPendingApproval = user.status === "pending_approval";
    user.isEmailVerified = true;
    if (user.status === "pending_otp" || user.status === "pending_approval") {
      user.status = "active";
    }
    if (
      wasPendingApproval &&
      user.isBarangayOfficial &&
      user.role === "barangay_official"
    ) {
      user.role = "resident";
    }
    await user.save();

    // Log activity
    await ActivityLog.create({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: "EMAIL_VERIFIED",
      details: `User verified email`,
      ipAddress: req.ip,
    });

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Email verified successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        barangay: user.barangay,
        phone: user.phone,
        address: user.address,
        officialIdUrl: user.officialIdUrl,
        profilePictureUrl: user.profilePictureUrl,
        status: user.status,
        isBarangayOfficial: user.isBarangayOfficial,
        officialAccessPending:
          user.isBarangayOfficial && user.role !== "barangay_official",
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during OTP verification",
    });
  }
});

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
router.post("/resend-otp", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with this email",
      });
    }

    if (user.isEmailVerified && user.status !== "pending_otp") {
      return res.status(400).json({
        success: false,
        message: "This email is already verified. Please log in.",
      });
    }

    await createAndSendRegisterOTP(user, user.isBarangayOfficial);

    res.json({
      success: true,
      message: "New OTP sent to your email",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      success: false,
      message: error.publicMessage || "Server error while resending OTP",
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check account status
    if (!user.isEmailVerified || user.status === "pending_otp") {
      await createAndSendRegisterOTP(user, user.isBarangayOfficial);
      return res.status(403).json({
        success: false,
        message: "Please verify your email first. We sent a new OTP.",
        requiresOTP: true,
        email: user.email,
      });
    }

    if (user.status === "pending_approval") {
      return res.status(403).json({
        success: false,
        message: "Your account is pending approval by admin",
      });
    }

    if (user.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended. Contact administrator.",
      });
    }

    // Log activity
    await ActivityLog.create({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: "LOGIN",
      details: `User logged in`,
      ipAddress: req.ip,
    });

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        barangay: user.barangay,
        phone: user.phone,
        address: user.address,
        officialIdUrl: user.officialIdUrl,
        profilePictureUrl: user.profilePictureUrl,
        status: user.status,
        isBarangayOfficial: user.isBarangayOfficial,
        officialAccessPending:
          user.isBarangayOfficial && user.role !== "barangay_official",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
});

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with this email",
      });
    }

    // Delete existing OTPs
    await OTP.deleteMany({ email, type: "forgot_password" });

    // Generate OTP
    const otp = generateOTP();

    // Create OTP record
    await OTP.create({
      email,
      otp,
      type: "forgot_password",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Send email
    await sendEmail({
      email,
      subject: "MitigatePlus - Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0d2b6b;">MitigatePlus - Password Reset</h2>
          <p>Hello ${user.name},</p>
          <p>You have requested to reset your password. Your OTP is:</p>
          <h1 style="color: #1565c0; font-size: 36px; text-align: center; background: #f0f4ff; padding: 20px; border-radius: 10px;">
            ${otp}
          </h1>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: "Password reset OTP sent to your email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during forgot password request",
    });
  }
});

// @desc    Verify Reset OTP
// @route   POST /api/auth/verify-reset-otp
router.post("/verify-reset-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await OTP.findOne({
      email,
      type: "forgot_password",
      isUsed: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "No OTP found or OTP expired",
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    const isMatch = await otpRecord.matchOTP(otp);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    const resetToken = jwt.sign(
      { email, purpose: "password_reset" },
      process.env.JWT_SECRET,
      { expiresIn: "10m" },
    );

    res.json({
      success: true,
      message: "OTP verified. You can now reset your password.",
      verified: true,
      resetToken,
    });
  } catch (error) {
    console.error("Verify reset OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during OTP verification",
    });
  }
});

// @desc    Reset Password
// @route   POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, password, resetToken } = req.body;

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: "Password reset verification is required",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        message: "Password reset verification expired. Please request a new OTP.",
      });
    }

    if (decoded.purpose !== "password_reset" || decoded.email !== email) {
      return res.status(401).json({
        success: false,
        message: "Invalid password reset verification",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.password = password;
    await user.save();

    // Log activity
    await ActivityLog.create({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: "PASSWORD_RESET",
      details: "User reset password",
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during password reset",
    });
  }
});

// @desc    Get all users
// @route   GET /api/auth/users
router.get(
  "/users",
  protect,
  authorize("admin", "superadmin"),
  async (req, res) => {
    try {
      const users = await User.find().select("-password");
      res.json({
        success: true,
        count: users.length,
        data: users,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error fetching users",
      });
    }
  },
);

// @desc    Create admin or superadmin account
// @route   POST /api/auth/users
router.post(
  "/users",
  protect,
  authorize("superadmin"),
  async (req, res) => {
    try {
      const { name, email, password, phone, address, barangay, role } = req.body;
      const allowedRoles = ["admin", "superadmin"];

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Super admins can only create admin or super admin accounts",
        });
      }

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "Name, email, and password are required",
        });
      }

      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: "User already exists with this email",
        });
      }

      const user = await User.create({
        name,
        email,
        password,
        phone: phone || "",
        address: address || "",
        barangay: barangay || "City of Manila",
        barangayAssigned: role === "admin" ? barangay || "City of Manila" : null,
        role,
        status: "active",
        isEmailVerified: true,
        isBarangayOfficial: false,
      });

      await ActivityLog.create({
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: "ADMIN_ACCOUNT_CREATED",
        details: `Created ${role} account ${user.email}`,
        ipAddress: req.ip,
      });

      try {
        await sendEmail({
          email: user.email,
          subject: "MitigatePlus - Dashboard Account Created",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #0d2b6b;">MitigatePlus Dashboard Access</h2>
              <p>Hello ${user.name},</p>
              <p>A ${role.replace("_", " ")} account has been created for you by a MitigatePlus super admin.</p>
              <p>You may now sign in using this email address. For security, change your password after your first login.</p>
              <a href="${process.env.CLIENT_URL}/login" style="display: inline-block; background: #1565c0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin-top: 20px;">
                Login to Dashboard
              </a>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Account creation email error:", emailError.message);
      }

      const createdUser = await User.findById(user._id).select("-password");
      res.status(201).json({
        success: true,
        message: `${role === "superadmin" ? "Super admin" : "Admin"} account created`,
        data: createdUser,
      });
    } catch (error) {
      console.error("Create admin account error:", error);
      res.status(500).json({
        success: false,
        message: "Server error creating account",
      });
    }
  },
);

// @desc    Get current logged-in user
// @route   GET /api/auth/users/me
// IMPORTANT: Keep this BEFORE "/users/:id"
router.get("/users/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @desc    Update current user's latest app location
// @route   PATCH /api/auth/location
router.patch("/location", protect, async (req, res) => {
  try {
    const { lat, lng, accuracy } = req.body;
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    const parsedAccuracy =
      accuracy === undefined || accuracy === null ? null : Number(accuracy);

    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude are required",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        lastKnownLocation: {
          lat: parsedLat,
          lng: parsedLng,
          accuracy: Number.isFinite(parsedAccuracy) ? parsedAccuracy : null,
          updatedAt: new Date(),
        },
      },
      { new: true },
    ).select("-password");

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Update location error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating location",
    });
  }
});

// @desc    Get single user
// @route   GET /api/auth/users/:id
router.get("/users/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error fetching user",
    });
  }
});

// @desc    Update user status
// @route   PATCH /api/auth/users/:id/status
router.patch(
  "/users/:id/status",
  protect,
  authorize("admin", "superadmin"),
  async (req, res) => {
    try {
      const { status } = req.body;
      const allowedStatuses = ["active", "suspended", "pending_approval", "pending_otp"];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid account status",
        });
      }

      const targetUser = await User.findById(req.params.id);

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (
        req.user.role !== "superadmin" &&
        ["admin", "superadmin"].includes(targetUser.role)
      ) {
        return res.status(403).json({
          success: false,
          message: "Only a super admin can change admin account status",
        });
      }

      if (
        targetUser._id.equals(req.user._id) &&
        status !== "active"
      ) {
        return res.status(400).json({
          success: false,
          message: "You cannot suspend your own account",
        });
      }

      targetUser.status = status;
      await targetUser.save();
      const user = await User.findById(targetUser._id).select("-password");

      // Log activity
      await ActivityLog.create({
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: "USER_STATUS_UPDATED",
        details: `Updated user ${user.email} status to ${status}`,
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error updating user status",
      });
    }
  },
);

// @desc    Delete a user account
// @route   DELETE /api/auth/users/:id
router.delete(
  "/users/:id",
  protect,
  authorize("superadmin"),
  async (req, res) => {
    try {
      const targetUser = await User.findById(req.params.id);

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (targetUser._id.equals(req.user._id)) {
        return res.status(400).json({
          success: false,
          message: "You cannot delete your own account",
        });
      }

      await targetUser.deleteOne();

      await ActivityLog.create({
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: "USER_DELETED",
        details: `Deleted user account ${targetUser.email}`,
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        message: "User account deleted",
      });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({
        success: false,
        message: "Server error deleting user",
      });
    }
  },
);

// @desc    Get pending officials
// @route   GET /api/auth/officials/pending
router.get(
  "/officials/pending",
  protect,
  authorize("admin", "superadmin"),
  async (req, res) => {
    try {
      const officials = await User.find({
        isBarangayOfficial: true,
        officialIdUrl: { $ne: null },
        $or: [
          { role: { $ne: "barangay_official" }, status: "active" },
          { role: "barangay_official", status: "pending_approval" },
        ],
      }).select("-password");

      res.json({
        success: true,
        count: officials.length,
        data: officials,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error fetching pending officials",
      });
    }
  },
);

// @desc    Approve official
// @route   PATCH /api/auth/officials/:id/approve
router.patch(
  "/officials/:id/approve",
  protect,
  authorize("admin", "superadmin"),
  async (req, res) => {
    try {
      const targetUser = await User.findById(req.params.id);

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "Official not found",
        });
      }

      if (!targetUser.isBarangayOfficial || !targetUser.officialIdUrl) {
        return res.status(400).json({
          success: false,
          message: "This user has no barangay official ID on file",
        });
      }

      targetUser.status = "active";
      targetUser.isEmailVerified = true;
      targetUser.role = "barangay_official";
      targetUser.barangayAssigned = targetUser.barangayAssigned || targetUser.barangay;
      await targetUser.save();

      const user = await User.findById(targetUser._id).select("-password");

      // Log activity
      await ActivityLog.create({
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: "OFFICIAL_APPROVED",
        details: `Approved barangay official ${user.email}`,
        ipAddress: req.ip,
      });

      // Send email notification
      await sendEmail({
        email: user.email,
        subject: "MitigatePlus - Account Approved",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0d2b6b;">MitigatePlus - Account Approved</h2>
          <p>Hello ${user.name},</p>
          <p>Your barangay official account has been approved! You can now log in and start managing reports in your barangay.</p>
          <a href="${process.env.CLIENT_URL}/login" style="display: inline-block; background: #1565c0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin-top: 20px;">
            Login to Your Account
          </a>
        </div>
      `,
      });

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error approving official",
      });
    }
  },
);

// ==================== PROFILE PICTURE UPLOAD ====================
// @desc    Update profile picture
// @route   PATCH /api/auth/profile/picture
router.patch(
  "/profile/picture",
  protect,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please upload an image file",
        });
      }

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { profilePictureUrl: req.file.path },
        { new: true },
      ).select("-password");

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error("Profile picture upload error:", error);
      res.status(500).json({
        success: false,
        message: "Server error uploading picture",
      });
    }
  },
);

module.exports = router;
