import express from "express";
import fetch from "node-fetch";
import jwt from "jsonwebtoken";
import { AllGames } from "../Module.js";
import dayjs from "dayjs";

// import { JWT_SECRET } from "../config.js"

const router = express.Router();

// ---------------- UPDATE GAME DATA FROM FRONTEND JSON ----------------
router.post("/updateGamesData", async (req, res) => {
  console.log("hello I hitted", req);
  
  try {
    const records = req.body; // The frontend will send JSON array here

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or empty data received. Expected an array of records.",
      });
    }

    const getDayFromDate = (dateStr) => dayjs(dateStr).format("dddd");

    let updatedGames = 0;
    let newGames = 0;

    for (const record of records) {
      const { category_name, date, open_pana, open_close, close_pana } = record;

      if (!category_name || !open_pana || !close_pana || !open_close || !date)
        continue;

      const openDigit = open_close[0];
      const closeDigit = open_close[1];
      const day = getDayFromDate(date);
      const dateTime = new Date(date).toISOString();

      // Prepare entries
      const openEntry = [open_pana, openDigit, dateTime, "Open", day];
      const closeEntry = [close_pana, closeDigit, dateTime, "Close", day];

      // Find existing game
      let game = await AllGames.findOne({ name: category_name });

      if (!game) {
        game = new AllGames({
          name: category_name,
          owner: "System",
          resultNo: [],
          openNo: [],
          closeNo: [],
          startTime: "00:00",
          liveTime: 0,
          endTime: "01:00",
          Notification_Message: [],
          nameColor: "#000000",
          resultColor: "#000000",
          panelColor: "#66ff00",
          notificationColor: "#ff0000",
          status: "Active",
          fontSize: "18",
        });
        newGames++;
      } else {
        updatedGames++;
      }

      // Append new data
      game.openNo.push(openEntry);
      game.closeNo.push(closeEntry);

      await game.save();
      console.log(newGames,updatedGames, "games update and added successfully");
      
    }

    res.json({
      success: true,
      message: "✅ Game data updated successfully from frontend JSON",
      stats: { updatedGames, newGames },
    });
  } catch (err) {
    console.error("❌ Error updating games:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update games",
      error: err.message,
    });
  }
});

router.put("/updatePayment/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { gameId, method, amount, date } = req.body;

    if (!gameId) {
      return res
        .status(400)
        .json({ success: false, message: "Game ID required" });
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
      return res
        .status(404)
        .json({ success: false, message: "Game not found for user" });
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
      return res
        .status(400)
        .json({ success: false, message: "Live time is required" });
    }

    // Save liveTime as a number directly
    const updatedGame = await AllGames.findByIdAndUpdate(
      req.params.id,
      { liveTime: Number(liveTime) },
      { new: true }
    );

    if (!updatedGame) {
      return res
        .status(404)
        .json({ success: false, message: "Game not found" });
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
      return res
        .status(400)
        .json({ success: false, message: "Live time is required" });
    }

    const updatedGame = await AllGames.findByIdAndUpdate(
      req.params.id,
      { Notification_Message: notificationMessage },
      { new: true }
    );
    // console.log(updatedGame);

    if (!updatedGame) {
      return res
        .status(404)
        .json({ success: false, message: "Game not found" });
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
      const windowMinutes = 15;
      const windowEndInMinutes = nowInMinutes + windowMinutes;

      const [startH, startM] = game.startTime.split(":").map(Number);
      const startInMinutes = startH * 60 + startM;
      const liveTiem = game.liveTime ? game.liveTime : 10;

      // Show games whose startTime is within the calculated window
      return (
        startInMinutes + liveTiem >= nowInMinutes &&
        startInMinutes <= windowEndInMinutes
      );
    });

    const end_records = allGames.filter((game) => {
      if (!game.endTime) return false;

      // Determine the window in minutes
      const windowMinutes = 15;
      const windowEndInMinutes = nowInMinutes + windowMinutes;

      const [startH, startM] = game.endTime.split(":").map(Number);
      const startInMinutes = startH * 60 + startM;
      const liveTiem = game.liveTime ? game.liveTime : 10;

      // Show games whose startTime is within the calculated window
      return (
        startInMinutes + liveTiem >= nowInMinutes &&
        startInMinutes <= windowEndInMinutes
      );
    });

    const combinedData = records.concat(end_records);

    // Sort by startTime ascending (soonest first)
    const sortedRecords = combinedData.sort((a, b) => {
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
//   try {
//     // 🕒 Get current IST time
//     const nowUTC = new Date();
//     const nowIST = new Date(nowUTC.getTime() + 5.5 * 60 * 60 * 1000); // UTC → IST
//     const nowInMinutes = nowIST.getHours() * 60 + nowIST.getMinutes();

//     // 🎮 Fetch all games
//     const allGames = await AllGames.find({});

//     const records = allGames.filter((game) => {
//       if (!game.startTime) return false;

//       // ⏰ Convert startTime to total minutes
//       const [startH, startM] = game.startTime.split(":").map(Number);
//       const startInMinutes = startH * 60 + startM;

//       // 🕓 Convert endTime (if present)
//       let endInMinutes = null;
//       if (game.endTime) {
//         const [endH, endM] = game.endTime.split(":").map(Number);
//         endInMinutes = endH * 60 + endM;
//       }

//       // ⏳ liveTime in minutes (default 15)
//       const liveTime = Number(game.liveTime) || 15;

//       // 🧩 1️⃣ Start-based window
//       const startShowStart = startInMinutes - 15;
//       const startShowEnd = startInMinutes + liveTime;

//       console.log(endInMinutes,nowInMinutes,startShowStart,startShowEnd);
//       // 🧩 2️⃣ End-based window (only if endTime exists)
//       let endShowStart = null;
//       let endShowEnd = null;
//       if (endInMinutes !== null) {
//         endShowStart = endInMinutes - 15;
//         endShowEnd = endInMinutes + liveTime;
//       }

//       // 🕕 Handle midnight wrap (if window crosses 00:00)
//       const adjustForMidnight = (time) => (time < 0 ? time + 1440 : time % 1440);
//       const nowAdj = nowInMinutes;
//       const sStart = adjustForMidnight(startShowStart);
//       const sEnd = adjustForMidnight(startShowEnd);
//       const eStart = endShowStart !== null ? adjustForMidnight(endShowStart) : null;
//       const eEnd = endShowEnd !== null ? adjustForMidnight(endShowEnd) : null;

//       // ✅ Check if now is within either window
//       const inStartWindow =
//         (sStart <= sEnd && nowAdj >= sStart && nowAdj <= sEnd) ||
//         (sStart > sEnd && (nowAdj >= sStart || nowAdj <= sEnd)); // for midnight wrap

//       const inEndWindow =
//         eStart !== null &&
//         ((eStart <= eEnd && nowAdj >= eStart && nowAdj <= eEnd) ||
//           (eStart > eEnd && (nowAdj >= eStart || nowAdj <= eEnd)));

//       return inStartWindow || inEndWindow;
//     });

//     // 🔢 Sort by startTime ascending
//     const sortedRecords = records.sort((a, b) => {
//       const [aH, aM] = a.startTime.split(":").map(Number);
//       const [bH, bM] = b.startTime.split(":").map(Number);
//       return aH * 60 + aM - (bH * 60 + bM);
//     });
//     console.log({message: sortedRecords.length ? "There is data" : "Data is not present",
//       hasData: sortedRecords.length > 0,
//       data: sortedRecords,});

//     // 📦 Respond with data
//     res.status(200).json({
//       message: sortedRecords.length ? "There is data" : "Data is not present",
//       hasData: sortedRecords.length > 0,
//       data: sortedRecords,
//     });
//   } catch (error) {
//     console.error("Error fetching records:", error);
//     res.status(500).json({ error: "Failed to fetch records" });
//   }
// });

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

//       console.log(nowInMinutes , startInMinutes, nowInMinutes , startInMinutes,  liveDuration);
//       console.log(nowInMinutes >= startInMinutes && nowInMinutes <= startInMinutes + liveDuration);

//       // Game is live if current time is within [startTime, startTime + liveTime]
//       return nowInMinutes >= startInMinutes && nowInMinutes <= startInMinutes + liveDuration;
//     });

//     console.log(live);

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
      return res
        .status(404)
        .json({ success: false, message: "Game not found" });
    }
    res.json({ success: true, data: game });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/api/getGameFormLink", async (req, res) => {
  const { url, userName, admin } = req.body;
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
          status: "skipped - not owner",
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

router.put("/updateFull/:id", async (req, res) => {
  try {
    const gameId = req.params.id;
    const {
      name,
      owner,
      startTime,
      endTime,
      resultNo,
      nameColor,
      resultColor,
      panelColor,
      notificationColor,
      status,
      liveTime,
      fontSize,
    } = req.body;

    // Find game
    const game = await AllGames.findById(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    // Update ONLY fields that came from frontend
    if (name) game.name = name;
    if (owner) game.owner = owner;
    if (startTime) game.startTime = startTime;
    if (endTime) game.endTime = endTime;
    if (nameColor) game.nameColor = nameColor;
    if (resultColor) game.resultColor = resultColor;
    if (panelColor) game.panelColor = panelColor;
    if (notificationColor) game.notificationColor = notificationColor;
    if (status) game.status = status;
    if (liveTime !== undefined) game.liveTime = Number(liveTime);
    if (fontSize !== undefined) game.fontSize = Number(fontSize);

    // OPTIONAL — update resultNo if provided
    if (resultNo) {
      game.resultNo = resultNo;
    }

    await game.save();

    res.json({
      success: true,
      message: "Game updated successfully!",
      data: game,
    });
  } catch (err) {
    console.error("Error updating game:", err);
    res.status(500).json({
      success: false,
      message: "Server error while updating game",
      error: err.message,
    });
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
      return res
        .status(400)
        .json({ success: false, message: "Font size is required" });
    }

    const updatedGame = await AllGames.findByIdAndUpdate(
      req.params.id,
      { fontSize },
      { new: true }
    );

    if (!updatedGame) {
      return res
        .status(404)
        .json({ success: false, message: "Game not found" });
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
      return res
        .status(404)
        .json({ success: false, message: "Game not found" });
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
    if (!game)
      return res
        .status(404)
        .json({ success: false, message: "Game not found" });

    // Update color fields if provided
    if (nameColor) game.nameColor = nameColor;
    if (resultColor) game.resultColor = resultColor;
    if (panelColor) game.panelColor = panelColor;
    if (notificationColor) game.notificationColor = notificationColor;

    await game.save();

    res.json({
      success: true,
      message: "Colors updated successfully",
      data: game,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---------------- MANUAL UPDATE ----------------
// router.put("/updateGame/:id", async (req, res) => {
//   // console.log(req.body);
//   console.log("called");
  
//   try {
//     const { resultNo } = req.body;

//     if (!Array.isArray(resultNo) || resultNo.length < 4) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid result format",
//       });
//     }

//     let updateField = {};

//     if (resultNo[3] === "Open") {
//       updateField = { $push: { openNo: resultNo } };
//     } else if (resultNo[3] === "Close") {
//       updateField = { $push: { closeNo: resultNo } };
//     } else {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid OpenOrClose value. Use 'Open' or 'Close'.",
//       });
//     }

//     const updatedGame = await AllGames.findByIdAndUpdate(
//       req.params.id,
//       updateField,
//       { new: true }
//     );

//     if (!updatedGame) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Game not found" });
//     }

//     res.json({
//       success: true,
//       message: `Game updated successfully with ${resultNo[3]} result`,
//       data: updatedGame,
//     });
//   } catch (err) {
//     console.error("Error updating game:", err);
//     res.status(500).json({
//       success: false,
//       message: "Failed to update game",
//       error: err.message,
//     });
//   }
// });

// ---------------- MANUAL UPDATE (replace existing handler) ----------------
// router.put("/updateGame/:id", async (req, res) => {
//   try {
//     const { resultNo } = req.body;

//     if (!Array.isArray(resultNo) || resultNo.length < 4) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid result format",
//       });
//     }

//     // expected structure:
//     // [ mainNumber, checkDigit, dateISOString, "Open"|"Close", dayName ]
//     const type = resultNo[3];
//     const dateIso = resultNo[2];
//     if (!dateIso) {
//       return res.status(400).json({
//         success: false,
//         message: "Date is required in resultNo[2]",
//       });
//     }

//     // normalize date key (YYYY-MM-DD)
//     const dateKey = new Date(dateIso).toISOString().split("T")[0];

//     // Find game
//     const game = await AllGames.findById(req.params.id);
//     if (!game) {
//       return res.status(404).json({ success: false, message: "Game not found" });
//     }

//     // choose the array to modify
//     let targetArrayName;
//     if (type === "Open") targetArrayName = "openNo";
//     else if (type === "Close") targetArrayName = "closeNo";
//     else {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid OpenOrClose value. Use 'Open' or 'Close'.",
//       });
//     }

//     // make sure arrays exist
//     if (!Array.isArray(game[targetArrayName])) game[targetArrayName] = [];

//     // find existing index by matching date portion of the stored ISO date (index 2)
//     const existingIndex = game[targetArrayName].findIndex((entry) => {
//       try {
//         return entry && entry[2] && entry[2].toString().split("T")[0] === dateKey;
//       } catch (err) {
//         return false;
//       }
//     });
//     console.log(existingIndex);
    

//     if (existingIndex >= 0) {
//       // override existing entry
//       game[targetArrayName][existingIndex] = resultNo;
//     } else {
//       // push new entry
//       game[targetArrayName].push(resultNo);
//     }

//     await game.save();

//     res.json({
//       success: true,
//       message: `Game ${existingIndex >= 0 ? "overwritten" : "updated"} successfully with ${type} result`,
//       data: game,
//     });
//   } catch (err) {
//     console.error("Error updating game:", err);
//     res.status(500).json({
//       success: false,
//       message: "Failed to update game",
//       error: err.message,
//     });
//   }
// });

router.put("/updateGame/:id", async (req, res) => {
  try {
    const { resultNo } = req.body;

    if (!Array.isArray(resultNo) || resultNo.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Invalid result format",
      });
    }

    const type = resultNo[3]; // "Open" or "Close"
    const isoDate = resultNo[2];
    const dateKey = new Date(isoDate).toISOString().split("T")[0];

    const game = await AllGames.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    let target = type === "Open" ? "openNo" : "closeNo";

    if (!Array.isArray(game[target])) game[target] = [];

    // 1️⃣ REMOVE Old Entry
    game[target] = game[target].filter((entry) => {
      if (!entry || !entry[2]) return true;
      return entry[2].split("T")[0] !== dateKey; // keep only entries NOT from same date
    });

    // 2️⃣ INSERT New Entry
    game[target].push(resultNo);

    await game.save();

    res.json({
      success: true,
      message: "Record replaced successfully",
      data: game,
    });
  } catch (err) {
    console.error("Error updating record:", err);
    res.status(500).json({
      success: false,
      message: "Update failed",
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
