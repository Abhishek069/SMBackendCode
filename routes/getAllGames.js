import express from "express";
import fetch from "node-fetch";
import jwt from "jsonwebtoken";
import { AllGames } from "../Module.js";
import dayjs from "dayjs";

// import { JWT_SECRET } from "../config.js"

const router = express.Router();

// ---------------- UPDATE GAME DATA FROM FRONTEND JSON ----------------
// router.post("/updateGamesData", async (req, res) => {
//   console.log("hello I hitted", req);

//   try {
//     const records = req.body; // The frontend will send JSON array here

//     if (!Array.isArray(records) || records.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Invalid or empty data received. Expected an array of records.",
//       });
//     }

//     const getDayFromDate = (dateStr) => dayjs(dateStr).format("dddd");

//     let updatedGames = 0;
//     let newGames = 0;

//     for (const record of records) {
//       const { category_name, date, open_pana, open_close, close_pana } = record;

//       if (!category_name || !open_pana || !close_pana || !open_close || !date)
//         continue;

//       const openDigit = open_close[0];
//       const closeDigit = open_close[1];
//       const day = getDayFromDate(date);
//       const dateTime = new Date(date).toISOString();

//       // Prepare entries
//       const openEntry = [open_pana, openDigit, dateTime, "Open", day];
//       const closeEntry = [close_pana, closeDigit, dateTime, "Close", day];

//       console.log(category_name);

//       // Find existing game
//       let game = await AllGames.findOne({ name: category_name });
//       console.log(game);

//       if (!game) {
//         game = new AllGames({
//           name: category_name,
//           owner: "System",
//           resultNo: [],
//           openNo: [],
//           closeNo: [],
//           startTime: "00:00",
//           liveTime: 0,
//           endTime: "01:00",
//           Notification_Message: [],
//           nameColor: "#000000",
//           resultColor: "#000000",
//           panelColor: "#66ff00",
//           notificationColor: "#ff0000",
//           status: "Active",
//           fontSize: "18",
//         });
//         newGames++;
//       } else {
//         updatedGames++;
//       }

//       // Append new data
//       game.openNo.push(openEntry);
//       game.closeNo.push(closeEntry);

//       await game.save();
//       console.log(newGames,updatedGames, "games update and added successfully");

//     }

//     res.json({
//       success: true,
//       message: "✅ Game data updated successfully from frontend JSON",
//       stats: { updatedGames, newGames },
//     });
//   } catch (err) {
//     console.error("❌ Error updating games:", err);
//     res.status(500).json({
//       success: false,
//       message: "Failed to update games",
//       error: err.message,
//     });
//   }
// });

router.post("/updateGamesData", async (req, res) => {
  try {
    const records = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Expected non-empty array" });
    }

    const getDayFromDate = (dateStr) => dayjs(dateStr).format("dddd");

    // 1) Normalize and group records by category_name
    const groups = new Map(); // name -> { openEntries: [], closeEntries: [] }

    for (const rec of records) {
      console.log("runing");

      let { category_name, date, open_pana, open_close, close_pana } = rec;

      if (!category_name || !open_pana || !close_pana || !open_close || !date)
        continue;

      // Normalize name
      const name = String(category_name).trim();

      // defensive: ensure open_close is string/array
      const openCloseStr = String(open_close);
      const openDigit = openCloseStr[0] ?? null;
      const closeDigit = openCloseStr[1] ?? null;

      const dateTime = new Date(date).toISOString();
      const day = getDayFromDate(date);

      const openEntry = [open_pana, openDigit, dateTime, "Open", day];
      const closeEntry = [close_pana, closeDigit, dateTime, "Close", day];

      if (!groups.has(name)) {
        groups.set(name, { openEntries: [], closeEntries: [] });
      }
      const g = groups.get(name);
      g.openEntries.push(openEntry);
      g.closeEntries.push(closeEntry);
    }

    if (groups.size === 0) {
      return res.json({
        success: true,
        message: "No valid records to process",
        stats: { updatedGames: 0, newGames: 0 },
      });
    }

    // 2) Build bulk operations (upserts)
    const bulkOps = [];
    for (const [name, { openEntries, closeEntries }] of groups.entries()) {
      // Use $setOnInsert to initialize defaults when creating a new game
      const op = {
        updateOne: {
          filter: { name },
          update: {
            $push: {
              openNo: { $each: openEntries },
              closeNo: { $each: closeEntries },
            },
            $setOnInsert: {
              owner: "System",
              resultNo: [],
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
            },
          },
          upsert: true,
        },
      };
      bulkOps.push(op);
    }

    // 3) Execute bulkWrite in manageable chunks (avoid too-large single bulk)
    const CHUNK_SIZE = 500;
    let updatedGames = 0;
    let newGames = 0;
    const opsChunks = [];
    for (let i = 0; i < bulkOps.length; i += CHUNK_SIZE) {
      opsChunks.push(bulkOps.slice(i, i + CHUNK_SIZE));
    }

    for (const chunk of opsChunks) {
      const resBulk = await AllGames.bulkWrite(chunk, { ordered: false });
      // bulkWrite response gives counts:
      // - upsertedCount => number of new documents created
      // - modifiedCount => number of modified documents
      newGames += resBulk.upsertedCount || 0;
      updatedGames += resBulk.modifiedCount || 0;
    }

    res.json({
      success: true,
      message: "Game data updated successfully (batched).",
      stats: { updatedGames, newGames, processedGameNames: groups.size },
    });
  } catch (err) {
    console.error("Error in updateGamesData:", err);
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
    // Only fetch metadata + last 5 results for fast load
    const games = await AllGames.find(
      {},
      {
        name: 1,
        owner: 1,
        startTime: 1,
        endTime: 1,
        status: 1,
        liveTime: 1,
        nameColor: 1,
        resultColor: 1,
        panelColor: 1,
        notificationColor: 1,
        fontSize: 1,
        // only send last few entries instead of all of them
        openNo: { $slice: -5 },
        closeNo: { $slice: -5 },
        resultNo: { $slice: -5 },
      }
    );

    res.status(200).json({
      success: true,
      message: "Fetched all game data successfully",
      data: games,
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
// router.get("/latest-updates", async (req, res) => {
//   try {
//     const now = new Date();

//     // Convert current UTC time to IST
//     let hours = now.getUTCHours() + 5;
//     let minutes = now.getUTCMinutes() + 30;

//     // Handle overflow
//     if (minutes >= 60) {
//       minutes -= 60;
//       hours += 1;
//     }
//     if (hours >= 24) {
//       hours -= 24;
//     }

//     const nowInMinutes = hours * 60 + minutes;

//     const allGames = await AllGames.find({});

//     const records = allGames.filter((game) => {
//       if (!game.startTime) return false;

//       // Determine the window in minutes
//       const windowMinutes = 15;
//       const windowEndInMinutes = nowInMinutes + windowMinutes;

//       const [startH, startM] = game.startTime.split(":").map(Number);
//       const startInMinutes = startH * 60 + startM;
//       const liveTiem = game.liveTime ? game.liveTime : 10;

//       // Show games whose startTime is within the calculated window
//       return (
//         startInMinutes + liveTiem >= nowInMinutes &&
//         startInMinutes <= windowEndInMinutes
//       );
//     });

//     const end_records = allGames.filter((game) => {
//       if (!game.endTime) return false;

//       // Determine the window in minutes
//       const windowMinutes = 15;
//       const windowEndInMinutes = nowInMinutes + windowMinutes;

//       const [startH, startM] = game.endTime.split(":").map(Number);
//       const startInMinutes = startH * 60 + startM;
//       const liveTiem = game.liveTime ? game.liveTime : 10;

//       // Show games whose startTime is within the calculated window
//       return (
//         startInMinutes + liveTiem >= nowInMinutes &&
//         startInMinutes <= windowEndInMinutes
//       );
//     });

//     const combinedData = records.concat(end_records);

//     // Sort by startTime ascending (soonest first)
//     const sortedRecords = combinedData.sort((a, b) => {
//       const [aH, aM] = a.startTime.split(":").map(Number);
//       const [bH, bM] = b.startTime.split(":").map(Number);
//       return aH * 60 + aM - (bH * 60 + bM);
//     });

//     const isDataPresent = sortedRecords.length > 0;

//     // ✅ Always send "data" as an array
//     res.status(200).json({
//       message: isDataPresent ? "There is data" : "Data is not present",
//       hasData: isDataPresent,
//       data: sortedRecords, // will be [] if no records
//     });
//   } catch (error) {
//     console.error("Error fetching records:", error);
//     res.status(500).json({ error: "Failed to fetch records" });
//   }
// });

router.get("/latest-updates", async (req, res) => {
  try {
    const now = new Date();

    // Convert server time to minutes since midnight (IST)
    const istHour =
      now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60);
    const istMinute = (now.getUTCMinutes() + 30) % 60;
    const nowMinutes = istHour * 60 + istMinute;

    const windowMinutes = 15;

    // Query Mongo directly
    const recordList = await AllGames.find({
      $expr: {
        $and: [
          {
            $gte: [
              {
                $add: [
                  {
                    $multiply: [
                      {
                        $toInt: {
                          $arrayElemAt: [{ $split: ["$startTime", ":"] }, 0],
                        },
                      },
                      60,
                    ],
                  },
                  {
                    $toInt: {
                      $arrayElemAt: [{ $split: ["$startTime", ":"] }, 1],
                    },
                  },
                ],
              },
              nowMinutes - 15,
            ],
          },
          {
            $lte: [
              {
                $add: [
                  {
                    $multiply: [
                      {
                        $toInt: {
                          $arrayElemAt: [{ $split: ["$startTime", ":"] }, 0],
                        },
                      },
                      60,
                    ],
                  },
                  {
                    $toInt: {
                      $arrayElemAt: [{ $split: ["$startTime", ":"] }, 1],
                    },
                  },
                ],
              },
              nowMinutes + 15,
            ],
          },
        ],
      },
    }).sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      hasData: recordList.length > 0,
      data: recordList,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch latest updates" });
  }
});

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
    const gameName = decodeURIComponent(req.params.name).trim();

    const deletedGame = await AllGames.findOneAndDelete({
      name: { $regex: `^${gameName}\\s*$` },
    });

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
      return res
        .status(404)
        .json({ success: false, message: "Game not found" });
    }

    let target = type === "Open" ? "openNo" : "closeNo";

    if (!Array.isArray(game[target])) game[target] = [];

    // 1️⃣ REMOVE Old Entry
    game[target] = game[target].filter((entry) => {
      if (!entry || !entry[2]) return true;
      return entry[2].split("T")[0] !== dateKey; // keep only entries NOT from same date
    });

    // 2️⃣ INSERT New Entry
    game[target].unshift(resultNo);

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
