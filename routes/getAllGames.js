const express = require('express');
const router = express.Router();
const {AllGames} = require('../Module'); // Make sure this is your Mongoose model

// Route: GET /user/all
router.get('/', async (req, res) => {
  try {
    const users = await AllGames.find(); // Fetch all user documents from the database
    res.status(200).json({
      success: true,
      message: 'Fetched all user data successfully',
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user data',
      error: error.message,
    });
  }
});

router.get("/latest-updates", async (req, res) => {
  try {
    const records = await AllGames.find({})
      .sort({ updatedAt: -1 }) // newest first
      .limit(6); // no .toArray()

    res.json(records);
  } catch (error) {
    console.error("Error fetching records:", error);
    res.status(500).json({ error: "Failed to fetch records" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const game = await AllGames.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }
    res.json({ success: true, data: game });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



router.post('/addGame', async (req, res) => {
  try {
    const newGameData = req.body;
    // Assuming 'GameModel' is your Mongoose model for games
    const newGame = new AllGames(newGameData);

    // .save() is a method, so it needs to be called with ()
    // and awaited because it's an asynchronous operation
    const savedGame = await newGame.save();

    // Respond with a success message and the saved data
    res.status(201).json({ success: true, message: 'Game added successfully!', data: savedGame });
  } catch (err) {
    console.error('Error adding new game:', err);
    // Respond with an error message and status code
    res.status(500).json({ success: false, message: 'Failed to add game.', error: err.message });
  }
});

// DELETE game by name
router.delete('/deleteGame/:name', async (req, res) => {
  try {
    const gameName = req.params.name;

    // Find and delete the game by name (case-sensitive by default)
    const deletedGame = await AllGames.findOneAndDelete({ name: gameName });

    if (!deletedGame) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    res.json({ success: true, message: 'Game deleted successfully!', data: deletedGame });
  } catch (err) {
    console.error('Error deleting game:', err);
    res.status(500).json({ success: false, message: 'Failed to delete game.', error: err.message });
  }
});


router.put("/updateGame/:id", async (req, res) => {
  try {
    const { resultNo } = req.body; // Expecting array of numbers: [222, 22, 222]

    const updatedGame = await AllGames.findByIdAndUpdate(
      req.params.id,
      { $push: { resultNo: resultNo } }, // Push new set into array
      { new: true }
    );

    if (!updatedGame) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    res.json({ success: true, message: "Game updated successfully", data: updatedGame });
  } catch (err) {
    console.error("Error updating game:", err);
    res.status(500).json({ success: false, message: "Failed to update game", error: err.message });
  }
});




module.exports = router;
