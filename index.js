// Library Imports
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

// File Imports (these must exist and use ES module exports)
import myMiddleware from "./Middlware.js";
import userRoutes from "./routes/userRoutes.js";
import AllGames from "./routes/getAllGames.js";
import notiFection from './routes/notiFection.js'

const app = express();

// --- Config ---
const PORT = process.env.PORT || 5000;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ||
  "http://localhost:5173,https://satta-matka-frotend-code.vercel.app,https://satta-matka-frotend-code-gpqv7aox4-abhishek069s-projects.vercel.app")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);


const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/SattaMatka";

// --- Middleware ---
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(
  cors({
    origin: function (origin, cb) {
      // allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
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
app.use("/Notification", notiFection);

// --- Start Server ---
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
