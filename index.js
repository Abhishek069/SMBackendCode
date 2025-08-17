// Library Imports
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

// File Imports (these must exist and use ES module exports)
import myMiddleware from "./Middlware.js";
import userRoutes from "./routes/userRoutes.js";
import AllGames from "./routes/getAllGames.js";

const app = express();

// --- Config ---
const PORT = process.env.PORT || 5000;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/SattaMatka";

// --- Middleware ---
app.use(express.json());
app.use(
  cors({
    origin: function (origin, cb) {
      if (!origin || ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(myMiddleware);

// --- MongoDB Connection ---
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log(`✅ MongoDB connected: ${MONGO_URI}`))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// --- Health Check ---
app.get("/api/health", (req, res) =>
  res.json({ ok: true, time: new Date().toISOString() })
);

// --- Example Todo Model + Routes ---
const TodoSchema = new mongoose.Schema(
  { text: String, done: Boolean },
  { timestamps: true }
);
const Todo = mongoose.model("Todo", TodoSchema);

  
// --- Custom Routes ---
app.use("/user", userRoutes);
app.use("/AllGames", AllGames);

// --- Start Server ---
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
