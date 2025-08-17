import express from "express";
import { AllGames } from "../Module.js"; // make sure Module.js also uses ESM
const router = express.Router();

// Route: GET /
router.get("/", async (req, res) => {
  try {
    const users = await AllGames.find();
    res.status(200).json({
      success: true,
      message: "Fetched all user data successfully",
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user data",
      error: error.message,
    });
  }
});

// Route: GET /latest-updates
router.get("/latest-updates", async (req, res) => {
  console.log("called");
  
  try {
    const records = await AllGames.find({})
      .sort({ updatedAt: -1 })
      .limit(6);
    console.log(records);
    res.json(records);
  } catch (error) {
    console.error("Error fetching records:", error);
    res.status(500).json({ error: "Failed to fetch records" });
  }
});

// Route: GET /:id
router.get("/:id", async (req, res) => {
  try {
    const game = await AllGames.findById(req.params.id);
    if (!game) {
      return res
        .status(404)
        .json({ success: false, message: "Game not found" });
    }
    res.json({ success: true, data: game });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Route: POST /addGame
router.post("/addGame", async (req, res) => {
  try {
    const newGameData = req.body;
    const newGame = new AllGames(newGameData);
    const savedGame = await newGame.save();

    res
      .status(201)
      .json({ success: true, message: "Game added successfully!", data: savedGame });
  } catch (err) {
    console.error("Error adding new game:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to add game.", error: err.message });
  }
});

// Route: DELETE /deleteGame/:name
router.delete("/deleteGame/:name", async (req, res) => {
  try {
    const gameName = req.params.name;
    const deletedGame = await AllGames.findOneAndDelete({ name: gameName });

    if (!deletedGame) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    res.json({
      success: true,
      message: "Game deleted successfully!",
      data: deletedGame,
    });
  } catch (err) {
    console.error("Error deleting game:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete game.", error: err.message });
  }
});

// Route: PUT /updateGame/:id
router.put("/updateGame/:id", async (req, res) => {
  try {
    const { resultNo } = req.body;

    const updatedGame = await AllGames.findByIdAndUpdate(
      req.params.id,
      { $push: { resultNo: resultNo } },
      { new: true }
    );

    if (!updatedGame) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    res.json({
      success: true,
      message: "Game updated successfully",
      data: updatedGame,
    });
  } catch (err) {
    console.error("Error updating game:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update game",
      error: err.message,
    });
  }
});

export default router;
