import express from "express";
import bcrypt from "bcryptjs";
import { User } from "../Module.js"; // Make sure Module.js also uses ESM
import jwt from "jsonwebtoken";

const router = express.Router();

// Create a user
router.post("/addUser", async (req, res) => {
  try {
    const { name, role, mobile, password, address } = req.body;

    // 🔹 Check if user already exists by mobile
    let existing = await User.findOne({ mobile });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "User with this mobile already exists" });
    }

    existing = await User.findOne({ name }); // Re-use the existing variable
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "User with this name already exists." });
    }

    // 🔹 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔹 Create new user
    const user = await User.create({
      name,
      role,
      mobile,
      password: hashedPassword,
      address,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        mobile: user.mobile,
      },
    });
  } catch (err) {
    console.error("Add User Error:", err);
    
    // ✅ Handle duplicate key error
    if (err.code === 11000) {
      if (err.keyPattern?.mobile) {
        return res
          .status(200)
          .json({ success: false, message: `User with mobile "${req.body.mobile}" already exists.` });
      }
      if (err.keyPattern?.name) {
        return res
          .status(200)
          .json({ success: false, message: `User with name "${req.body.name}" already exists.` });
      }
    }

    res.status(400).json({ success: false, error: err.message });
  }
});


router.post("/authorize", async (req, res) => {
  try {
    const { mobile, password } = req.body;

    // 1️⃣ Check if user exists
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // 2️⃣ Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(200).json({ success: false, error: "Incorrect password" });
    }

    // 3️⃣ Generate token with 1-minute expiry
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        username: user.name,
      },
      process.env.JWT_SECRET || "supersecretkey",
      { expiresIn: "2h" } // 1 minute
    );

    // 4️⃣ Send success response
    res.json({
      success: true,
      token,
      role: user.role,
      username: user.name, // optionally send name to frontend
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Update user password
router.put("/updatePassword/:id", async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: "Password required" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { password: hashed },
      { new: true }
    );

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// Get all users including hashed password
router.get("/allWithPassword", async (req, res) => {
  try {
    const users = await User.find().select("+password");

    res.status(200).json({
      success: true,
      message: "All users including password fetched successfully",
      data: users,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// Get all users
router.get("/", async (_req, res) => {
  try {
    const users = await User.find();
    // console.log(users);
    
    res.status(200).json({success: true, data: users});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
