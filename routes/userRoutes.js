import express from "express";
import bcrypt from "bcryptjs";
import { User } from "../Module.js"; // Make sure Module.js also uses ESM
import jwt from "jsonwebtoken";

const router = express.Router();

// Create a user
router.post("/addUser", async (req, res) => {
  try {
    const { name, role, mobile, password, address } = req.body;

    // Check if user already exists
    const existing = await User.findOne({ mobile });
    if (existing) {
      return res
        .status(400)
        .json({ error: "User with this mobile already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

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
    res.status(400).json({ error: err.message });
  }
});

router.post("/authorize", async (req, res) => {
  try {
    const { mobile, password } = req.body;

    const user = await User.findOne({ mobile });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    // generate token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        username: user.name, // 👈 add username here
      },
      process.env.JWT_SECRET || "supersecretkey",
      { expiresIn: "2h" }
    );

    res.json({
      success: true,
      token,
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all users
router.get("/", async (_req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
