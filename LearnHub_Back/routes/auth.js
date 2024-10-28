const { calculateProfileLevel } = require('../utils/CalculateProfileLevel');
const { getResponseFromAPI } = require('../utils/generateResponse');
const TempUser = require("../models/TempUser");
const { generateOTP } = require("../utils/generateOTP.js");
const { mailService } = require('../mail/mail');
const { emailTemplate } = require('../mail/emailtemplate');
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const profileRoutes = require('../models/Profile');
require("dotenv").config();
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET_KEY;
let tempUsers = {};
router.post("/signup", async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    await TempUser.create({ username, email, hashedPassword, otp });

    await mailService(email, "Email Verification - OTP", emailTemplate(username, otp));

    res.status(201).json({
      message: "Signup successful! Please verify your email using the OTP sent to your email.",
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({
      message: "Server error occurred while signing up. Please try again later.",
    });
  }
});

router.post("/resend", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const tempUser = await TempUser.findOne({ email });
  if (!tempUser) {
    return res.status(404).json({ message: "User not found or OTP expired" });
  }

  try {
    const otp = generateOTP();
    tempUser.otp = otp;
    await tempUser.save();

    await mailService(email, "Email Verification - Resend OTP", emailTemplate(tempUser.username, otp));

    res.status(200).json({ message: "OTP resent successfully" });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    res.status(500).json({ message: "Error sending OTP" });
  }
});

router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  try {
    const tempUser = await TempUser.findOne({ email });
    if (!tempUser || tempUser.otp !== otp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const newUser = new User({
      username: tempUser.username,
      email: tempUser.email,
      password: tempUser.hashedPassword,
      coins: 0,
      profileLevel: {
        level: 1,
        label: "Novice"
      },
      verified: true,
    });

    await newUser.save();
    await TempUser.deleteOne({ email });

    res.status(200).json({ message: "Email verified successfully!" });
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ message: "Server error occurred while verifying OTP" });
  }
});

// Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      token,
      userId: user._id,
      username: user.username,
      email: user.email,
      coins: user.coins,
      profileLevel: user.profileLevel,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/updateCoins", async (req, res) => {
  const { email, coinsEarned } = req.body;

  if (!email || coinsEarned === undefined) {
    return res.status(400).json({ message: "Email and coins earned are required" });
  }

  if (typeof coinsEarned !== "number" || !Number.isFinite(coinsEarned)) {
    return res.status(400).json({ message: "Invalid coins value" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.coins += coinsEarned;

    const newProfileLevel = calculateProfileLevel(user.coins);
    const profileLabels = {
      1: 'Novice',
      2: 'Intermediate',
      3: 'Ace',
      4: 'Pro',
      5: 'Expert',
      6: 'Master',
    };

    if (newProfileLevel !== user.profileLevel.level) {
      const newLabel = profileLabels[newProfileLevel] || 'Grandmaster';

      user.profileLevel = {
        level: newProfileLevel,
        label: newLabel,
      };

      user.levelUpHistory.push({
        level: newProfileLevel,
        label: newLabel,
        date: new Date(),
      });
    }

    await user.save();

    res.status(200).json({
      message: "Coins and profile level updated successfully",
      coins: user.coins,
      profileLevel: user.profileLevel,
      levelUpHistory: user.levelUpHistory,
    });
  } catch (error) {
    console.error("Error updating coins:", error);
    res.status(500).json({ message: "Database error", error: error.message });
  }
});



router.get("/userProfile/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user.toObject());
  } catch (error) {
    console.error("User Profile Error:", error);
    res.status(500).json({ message: "Database error" });
  }
});


router.get("/userScores/:email", async (req, res) => {
  const { email } = req.params;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.scores);
  } catch (error) {
    console.error("User Scores Error:", error);
    res.status(500).json({ message: "Database error" });
  }
});

router.post('/askQuestion', async (req, res) => {
  console.log("askQuestion route hit");

  const { prompt } = req.body;

  if (!prompt) {
    console.error("Prompt is missing");
    return res.status(400).json({ message: "Prompt is required" });
  }

  console.log("Prompt received:", prompt);

  try {
    const response = await getResponseFromAPI(prompt);

    console.log("API response:", response);

    res.status(200).json({ response });
  } catch (error) {
    console.error("Error in askQuestion route:", error.message);
    res.status(500).json({ message: "Error processing request" });
  }
});


router.get("/profileImages", async (req, res) => {
  try {
    const profiles = await profileRoutes.find();
    console.log("Retrieved profiles from the database:", profiles);

    if (!profiles || profiles.length === 0) {
      return res.status(404).json({ message: "No profiles found" });
    }

    res.status(200).json({
      message: "Profiles fetched successfully",
      profiles: profiles,
    });
  } catch (error) {
    console.error("Error fetching profiles:", error);
    res.status(500).json({ message: "Database error", error: error.message });
  }
});

// Update profile image route
router.put("/update-profile-image", async (req, res) => {
  const { email, profileImageUrl } = req.body;

  if (!email || !profileImageUrl) {
    return res.status(400).json({ message: "Email and profile image URL are required" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.profileUrl = profileImageUrl;

    await user.save();

    res.status(200).json({
      message: "Profile image updated successfully",
      user: {
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("Profile Image Update Error:", error);
    res.status(500).json({ message: "Server error while updating profile image" });
  }
});

// Leaderboard 
router.get("/leaderboard", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const users = await User.find({})
      .sort({ coins: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-password -verificationToken");

    const totalUsers = await User.countDocuments();

    res.status(200).json({
      message: "Leaderboard data fetched successfully",
      leaderboard: users,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    res.status(500).json({ message: "Database error", error: error.message });
  }
});
// Module Update route
router.put("/module-Update", async (req, res) => {
  const { email, modules } = req.body;

  if (!email || !modules) {
    return res.status(400).json({ message: "Email and modules data are required" });
  }

  const allowedModules = ["code", "quiz", "typing"];
  const invalidFields = Object.keys(modules).filter(field => !allowedModules.includes(field));
  if (invalidFields.length) {
    return res.status(400).json({ message: `Invalid fields in modules: ${invalidFields.join(", ")}` });
  }

  const invalidValues = Object.entries(modules).filter(([key, value]) => typeof value !== "number" || !Number.isFinite(value));
  if (invalidValues.length) {
    return res.status(400).json({ message: `Invalid values in modules: ${invalidValues.map(([key]) => key).join(", ")}` });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    Object.keys(modules).forEach(key => {
      user.modules[key] = modules[key];
    });

    await user.save();

    res.status(200).json({
      message: "Modules updated successfully",
      modules: user.modules,
    });
  } catch (error) {
    console.error("Module Update Error:", error);
    res.status(500).json({ message: "Server error while updating modules" });
  }
});


module.exports = router;
