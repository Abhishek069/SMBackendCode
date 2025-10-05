import express from "express";
import fetch from "node-fetch";
import jwt from "jsonwebtoken";
import { AllGames } from "../Module.js";
// import { JWT_SECRET } from "../config.js"

const router = express.Router();


router.put("/updatePayment/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { gameId, method, amount, date } = req.body;

    if (!gameId) {
      return res.status(400).json({ success: false, message: "Game ID required" });
    }

    // 🔹 Example: Update payment info inside Game collection
    const game = await AllGames.findOneAndUpdate(
      { _id: gameId }, // make sure game belongs to user
      {
        $set: {
          "payment.method": method,
          "payment.amount": amount,
          "payment.date": date,
        },
      },
      { new: true }
    );

    if (!game) {
      return res.status(404).json({ success: false, message: "Game not found for user" });
    }

    res.json({ success: true, message: "Payment updated", game });
  } catch (err) {
    console.error("Error updating payment:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---------------- GET ALL ----------------
router.get("/", async (req, res) => {
  try {
    const users = await AllGames.find();
    res.status(200).json({
      success: true,
      message: "Fetched all game data successfully",
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch game data",
      error: error.message,
    });
  }
});

// ---------------- LATEST UPDATES ----------------
// ---------------- SET LIVE TIME ----------------
// ---------------- SET LIVE TIME ----------------
router.put("/setLiveTime/:id", async (req, res) => {
  console.log("calls");
  
  try {
    const { liveTime } = req.body;

    if (liveTime === undefined || liveTime === null) {
      return res.status(400).json({ success: false, message: "Live time is required" });
    }

    // Save liveTime as a number directly
    const updatedGame = await AllGames.findByIdAndUpdate(
      req.params.id,
      { liveTime: Number(liveTime) },
      { new: true }
    );

    if (!updatedGame) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    res.json({
      success: true,
      message: "Game live time set successfully",
      data: updatedGame,
    });
  } catch (err) {
    console.error("Error setting live time:", err);
    res.status(500).json({
      success: false,
      message: "Failed to set live time",
      error: err.message,
    });
  }
});


router.put("/updateNotification/:id", async (req, res) => {
  try {
    const { notificationMessage } = req.body;
    // console.log(notificationMessage);
    
    if (!notificationMessage) {
      return res.status(400).json({ success: false, message: "Live time is required" });
    }

    const updatedGame = await AllGames.findByIdAndUpdate(
      req.params.id,
      { Notification_Message: notificationMessage },
      { new: true }
    );
    // console.log(updatedGame);
    

    if (!updatedGame) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    res.json({
      success: true,
      message: "Notification Message Update succeefulllt",
      data: updatedGame,
    });
  } catch (err) {
    console.error("Error setting live time:", err);
    res.status(500).json({
      success: false,
      message: "Failed to set notifiction",
      error: err.message,
    });
  }
});




// ---------------- LATEST UPDATES ----------------
router.get("/latest-updates", async (req, res) => {
  try {
    const now = new Date();

    // Convert current UTC time to IST
    let hours = now.getUTCHours() + 5;
    let minutes = now.getUTCMinutes() + 30;

    // Handle overflow
    if (minutes >= 60) {
      minutes -= 60;
      hours += 1;
    }
    if (hours >= 24) {
      hours -= 24;
    }

    const nowInMinutes = hours * 60 + minutes;

    const allGames = await AllGames.find({});

    const records = allGames.filter((game) => {
      if (!game.startTime) return false;

      // Determine the window in minutes
      const windowMinutes = game.liveTime ? Number(game.liveTime) : 15;
      const windowEndInMinutes = nowInMinutes + windowMinutes;

      const [startH, startM] = game.startTime.split(":").map(Number);
      const startInMinutes = startH * 60 + startM;

      // Show games whose startTime is within the calculated window
      return startInMinutes+game.liveTime >= nowInMinutes && startInMinutes <= windowEndInMinutes;
    });

    // Sort by startTime ascending (soonest first)
    const sortedRecords = records.sort((a, b) => {
      const [aH, aM] = a.startTime.split(":").map(Number);
      const [bH, bM] = b.startTime.split(":").map(Number);
      return aH * 60 + aM - (bH * 60 + bM);
    });

    const isDataPresent = sortedRecords.length > 0;

    // ✅ Always send "data" as an array
    res.status(200).json({
      message: isDataPresent ? "There is data" : "Data is not present",
      hasData: isDataPresent,
      data: sortedRecords, // will be [] if no records
    });
  } catch (error) {
    console.error("Error fetching records:", error);
    res.status(500).json({ error: "Failed to fetch records" });
  }
});
// router.get("/latest-updates", async (req, res) => {
//   console.log("called");
  
//   try {
//     const now = new Date();

//     // Convert UTC to IST
//     let hours = now.getUTCHours() + 5;
//     let minutes = now.getUTCMinutes() + 30;

//     if (minutes >= 60) {
//       minutes -= 60;
//       hours += 1;
//     }
//     if (hours >= 24) {
//       hours -= 24;
//     }

//     const nowInMinutes = hours * 60 + minutes;

//     const allGames = await AllGames.find({});

//     // --- Upcoming games (within next 15 minutes) ---
//     const upcoming = allGames.filter((game) => {
//       if (!game.startTime) return false;

//       const [startH, startM] = game.startTime.split(":").map(Number);
//       const startInMinutes = startH * 60 + startM;

//       // Show only games starting within the next 15 min
//       return startInMinutes > nowInMinutes && startInMinutes <= nowInMinutes + 15;
//     });

//     // --- Live games (startTime <= now < startTime + liveTime) ---
//     const live = allGames.filter((game) => {
//       if (!game.startTime || !game.liveTime) return false;

//       const [startH, startM] = game.startTime.split(":").map(Number);
//       const startInMinutes = startH * 60 + startM;
//       const liveDuration = Number(game.liveTime);

//       // Game is live if current time is within [startTime, startTime + liveTime]
//       return nowInMinutes >= startInMinutes && nowInMinutes <= startInMinutes + liveDuration;
//     });

//     // Sort both arrays by startTime
//     const sortByTime = (a, b) => {
//       const [aH, aM] = a.startTime.split(":").map(Number);
//       const [bH, bM] = b.startTime.split(":").map(Number);
//       return aH * 60 + aM - (bH * 60 + bM);
//     };

//     const sortedUpcoming = upcoming.sort(sortByTime);
//     const sortedLive = live.sort(sortByTime);

//     res.status(200).json({
//       upcoming: sortedUpcoming,
//       live: sortedLive,
//     });
//   } catch (error) {
//     console.error("Error fetching records:", error);
//     res.status(500).json({ error: "Failed to fetch records" });
//   }
// });



// ---------------- GET BY ID ----------------
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

router.post("/api/getGameFormLink", async (req, res) => {
  const { url, userName,admin } = req.body;
  // console.log("called");
  try {
    const response = await fetch(url);
    // console.log(response);
    
    const gamesFromApi = await response.json();
    // console.log(gamesFromApi.data);
    

    if (!Array.isArray(gamesFromApi.data)) {
      return res.status(400).json({ error: "Invalid API response format" });
    }

    const today = new Date();
    const dayName = today.toLocaleDateString("en-US", { weekday: "long" });

    const results = [];

    for (const game of gamesFromApi.data) {
      
      const dbGame = await AllGames.findOne({ name: game.category_name });
      if (!dbGame) continue;
      // console.log(role);
      
      // ✅ Ownership check
      if (admin !== "Admin" && dbGame.owner !== userName) {
        results.push({ 
          game: game.category_name, 
          status: "skipped - not owner" 
        });
        continue;
      }

      // ✅ Build result
      const resultArray = [
        game.value1,
        game.value2,
        game.value3,
        today,
        "Open",
        dayName,
      ];

      // ✅ Save to DB
      await AllGames.findByIdAndUpdate(dbGame._id, {
        $push: { resultNo: resultArray, openNo: resultArray },
        updatedAt: new Date(),
      });

      results.push({ game: game.category_name, status: "updated" });
    }

    res.status(200).json({ success: true, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

// ---------------- VALIDATOR ----------------
function isValidResult(resultArray) {
  const mainNumber = resultArray[0];
  if (!/^\d+$/.test(mainNumber)) return false; // only digits allowed

  // Optional checks, you can remove if too strict:
  if (mainNumber.length >= 2) {
    const first = parseInt(mainNumber[0], 10);
    const second = parseInt(mainNumber[1], 10);
    if (first >= second) return false;
  }

  if (mainNumber.length >= 3) {
    const lastThree = mainNumber.slice(-3).split("").map(Number);
    const sum = lastThree.reduce((a, b) => a + b, 0);
    const expectedCheckDigit = sum % 10;
    const providedCheck = parseInt(resultArray[1], 10);
    if (!isNaN(providedCheck) && providedCheck !== expectedCheckDigit) {
      return false;
    }
  }

  return true;
}

router.put("/saveFontSize/:id", async (req, res) => {
  try {
    const { fontSize } = req.body;
    if (!fontSize) {
      return res.status(400).json({ success: false, message: "Font size is required" });
    }

    const updatedGame = await AllGames.findByIdAndUpdate(
      req.params.id,
      { fontSize },
      { new: true }
    );

    if (!updatedGame) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    res.json({ success: true, data: updatedGame });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---------------- ADD GAME ----------------
router.post("/addGame", async (req, res) => {
  try {
    const newGame = new AllGames(req.body);
    const savedGame = await newGame.save();

    res.status(201).json({
      success: true,
      message: "Game added successfully!",
      data: savedGame,
    });
  } catch (err) {
    console.error("Error adding new game:", err);

    // ✅ Handle duplicate game name error
    if (err.code === 11000 && err.keyPattern?.name) {
      return res.status(400).json({
        success: false,
        message: `Game with name "${req.body.name}" already exists.`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to add game.",
      error: err.message,
    });
  }
});


// ---------------- DELETE GAME ----------------
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
    res.status(500).json({
      success: false,
      message: "Failed to delete game.",
      error: err.message,
    });
  }
});

router.put("/updateColor/:id", async (req, res) => {
  const gameId = req.params.id;
  const { nameColor, resultColor, panelColor, notificationColor } = req.body;

  try {
    // Find game by ID
    const game = await AllGames.findById(gameId);
    if (!game) return res.status(404).json({ success: false, message: "Game not found" });

    // Update color fields if provided
    if (nameColor) game.nameColor = nameColor;
    if (resultColor) game.resultColor = resultColor;
    if (panelColor) game.panelColor = panelColor;
    if (notificationColor) game.notificationColor = notificationColor;

    await game.save();

    res.json({ success: true, message: "Colors updated successfully", data: game });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---------------- MANUAL UPDATE ----------------
router.put("/updateGame/:id", async (req, res) => {
  // console.log(req.body);
  
  try {
    const { resultNo } = req.body;

    if (!Array.isArray(resultNo) || resultNo.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Invalid result format",
      });
    }

    let updateField = {};

    if (resultNo[3] === "Open") {
      updateField = { $push: { openNo: resultNo } };
    } else if (resultNo[3] === "Close") {
      updateField = { $push: { closeNo: resultNo } };
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid OpenOrClose value. Use 'Open' or 'Close'.",
      });
    }

    const updatedGame = await AllGames.findByIdAndUpdate(req.params.id, updateField, { new: true });

    if (!updatedGame) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    res.json({
      success: true,
      message: `Game updated successfully with ${resultNo[3]} result`,
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

router.put("/updateStatus/:id", async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    // update only the status field
    const updatedGame = await AllGames.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedGame) {
      return res
        .status(404)
        .json({ success: false, message: "Game not found" });
    }

    res.json({
      success: true,
      message: "Game status updated successfully",
      data: updatedGame,
    });
  } catch (err) {
    console.error("Error updating game status:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update game status",
      error: err.message,
    });
  }
});


export default router;
