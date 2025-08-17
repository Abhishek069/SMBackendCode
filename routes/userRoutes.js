import express from "express";
import { User } from "../Module.js"; // Make sure Module.js also uses ESM

const router = express.Router();

// Create a user
router.post("/addUser", async (req, res) => {
  try {
    const userDetils = req.body;
    console.log(userDetils);
    
    const user = await User.create(userDetils);
    res.status(201).json(user);
  } catch (err) {
    console.log(err);
    
    res.status(400).json({ error: err.message });
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
