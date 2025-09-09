// import express from "express";
// import fetch from "node-fetch";
// import jwt from "jsonwebtoken";
// // import Game from "../models/Game.js";
// import { AllGames } from "../Module.js"; // make sure Module.js also uses ESM
// const router = express.Router();

// // Route: GET /
// router.get("/", async (req, res) => {
//   try {
//     const users = await AllGames.find();
//     res.status(200).json({
//       success: true,
//       message: "Fetched all user data successfully",
//       data: users,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch user data",
//       error: error.message,
//     });
//   }
// });

// // Route: GET /latest-updates
// router.get("/latest-updates", async (req, res) => {
//   try {
//     const records = await AllGames.find({})
//       .sort({ updatedAt: -1 })
//       .limit(6);
//     res.json(records);
//   } catch (error) {
//     console.error("Error fetching records:", error);
//     res.status(500).json({ error: "Failed to fetch records" });
//   }
// });

// // Route: GET /:id
// router.get("/:id", async (req, res) => {
//   try {
//     const game = await AllGames.findById(req.params.id);
//     if (!game) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Game not found" });
//     }
//     res.json({ success: true, data: game });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });


// // router.post("/api/getGameFormLink/", async (req, res) => {
// //   console.log(req.body);
// //   const { url } = req.body;

// //   try {
// //     const response = await fetch(url);
// //     const data = await response.json(); // parse JSON directly
// //     res.status(200).json({ data });
// //   } catch (err) {
// //     console.error(err);
// //     res.status(500).json({ error: "Failed to fetch results" });
// //   }
// // });
//  // adjust import path

// router.post("/api/getGameFormLink", async (req, res) => {
//   const { url } = req.body;
//   const token = req.headers.authorization?.split(" ")[1];

//   if (!token) {
//     return res.status(401).json({ error: "Unauthorized - No token provided" });
//   }

//   let decoded;
//   try {
//     decoded = jwt.verify(token, process.env.JWT_SECRET);
//   } catch (err) {
//     return res.status(403).json({ error: "Invalid token" });
//   }

//   const { username, role } = decoded;

//   try {
//     const response = await fetch(url);
//     const gamesFromApi = await response.json();

//     if (!Array.isArray(gamesFromApi)) {
//       return res.status(400).json({ error: "Invalid API response format" });
//     }

//     const today = new Date();
//     const dayName = today.toLocaleDateString("en-US", { weekday: "long" });

//     const results = [];

//     for (const game of gamesFromApi) {
//       const dbGame = await Game.findOne({ name: game.category_name });
//       if (!dbGame) continue;

//       // ✅ Ownership check
//       if (role !== "Admin" && dbGame.owner !== username) {
//         results.push({ 
//           game: game.category_name, 
//           status: "skipped - not owner" 
//         });
//         continue;
//       }

//       // ✅ Build result
//       const resultArray = [
//         game.value1,
//         game.value2,
//         game.value3,
//         today,
//         "Open",
//         dayName,
//       ];

//       // ✅ Validate before saving
//       if (!isValidResult(resultArray)) {
//         results.push({ game: game.category_name, status: "skipped - invalid result" });
//         continue;
//       }

//       // ✅ Update DB
//       await Game.findByIdAndUpdate(dbGame._id, {
//         $push: { resultNo: resultArray, openNo: resultArray },
//         updatedAt: new Date(),
//       });

//       results.push({ game: game.category_name, status: "updated" });
//     }

//     res.status(200).json({ success: true, results });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to fetch results" });
//   }
// });

// // helper validation
// function isValidResult(resultArray) {
//   const mainNumber = resultArray[0];
//   if (!/^\d+$/.test(mainNumber)) return false;

//   if (mainNumber.length >= 2) {
//     const first = parseInt(mainNumber[0], 10);
//     const second = parseInt(mainNumber[1], 10);
//     if (first >= second) return false;
//   }

//   if (mainNumber.length >= 3) {
//     const lastThree = mainNumber.slice(-3).split("").map(Number);
//     const sum = lastThree.reduce((a, b) => a + b, 0);
//     const expectedCheckDigit = sum % 10;
//     const providedCheck = parseInt(resultArray[1], 10);
//     if (!isNaN(providedCheck) && providedCheck !== expectedCheckDigit) {
//       return false;
//     }
//   }

//   return true;
// }



// // Route: POST /addGame
// router.post("/addGame", async (req, res) => {
//   try {
//     const newGameData = req.body;
//     const newGame = new AllGames(newGameData);
//     const savedGame = await newGame.save();

//     res
//       .status(201)
//       .json({ success: true, message: "Game added successfully!", data: savedGame });
//   } catch (err) {
//     console.error("Error adding new game:", err);
//     res
//       .status(500)
//       .json({ success: false, message: "Failed to add game.", error: err.message });
//   }
// });

// // Route: DELETE /deleteGame/:name
// router.delete("/deleteGame/:name", async (req, res) => {
//   try {
//     const gameName = req.params.name;
//     const deletedGame = await AllGames.findOneAndDelete({ name: gameName });

//     if (!deletedGame) {
//       return res.status(404).json({ success: false, message: "Game not found" });
//     }

//     res.json({
//       success: true,
//       message: "Game deleted successfully!",
//       data: deletedGame,
//     });
//   } catch (err) {
//     console.error("Error deleting game:", err);
//     res
//       .status(500)
//       .json({ success: false, message: "Failed to delete game.", error: err.message });
//   }
// });

// // Route: PUT /updateGame/:id
// router.put("/updateGame/:id", async (req, res) => {
//   try {
//     const { resultNo} = req.body; // Expect both from frontend
//     console.log("Update request:", req.body);

//     // if (!resultNo || !OpenOrclose) {
//     //   return res.status(400).json({
//     //     success: false,
//     //     message: "Both resultNo and OpenOrclose are required",
//     //   });
//     // }

//     let updateField = {};

//     if (resultNo[3] === "Open") {
//       updateField = { $push: { openNo: resultNo } };
//     } else if (resultNo[3] === "Close") {
//       updateField = { $push: { closeNo: resultNo } };
//     } else {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid OpenOrclose value. Use 'Open' or 'Close'.",
//       });
//     }

//     const updatedGame = await AllGames.findByIdAndUpdate(
//       req.params.id,
//       updateField,
//       { new: true }
//     );

//     if (!updatedGame) {
//       return res.status(404).json({
//         success: false,
//         message: "Game not found",
//       });
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



// export default router;


import express from "express";
import fetch from "node-fetch";
import jwt from "jsonwebtoken";
import { AllGames } from "../Module.js";
// import { JWT_SECRET } from "../config.js"

const router = express.Router();

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
  try {
    const { liveTime } = req.body;
    if (!liveTime) {
      return res.status(400).json({ success: false, message: "Live time is required" });
    }

    const updatedGame = await AllGames.findByIdAndUpdate(
      req.params.id,
      { liveTime: new Date(liveTime) },
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


// ---------------- LATEST UPDATES ----------------
router.get("/latest-updates", async (req, res) => {
  try {
    const now = new Date();

    const records = await AllGames.find({
      liveTime: { $lte: now }, // only live
      startTime: { $lte: now } // only if startTime has passed
    })
      .sort({ liveTime: -1 })
      .limit(6);

    res.json(records);
  } catch (error) {
    console.error("Error fetching records:", error);
    res.status(500).json({ error: "Failed to fetch records" });
  }
});


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
  const { url, username,role } = req.body;
  
  try {
    const response = await fetch(url);
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
      if (role !== "Admin" && dbGame.owner !== username) {
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

// ---------------- MANUAL UPDATE ----------------
router.put("/updateGame/:id", async (req, res) => {
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

export default router;
