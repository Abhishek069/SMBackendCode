// Library Imports
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// File Imports (assuming these files exist and use 'export default' or 'export const')
import myMiddleware from './Middlware.js';
import userRoutes from './routes/userRoutes.js';
import AllGames from './routes/getAllGames.js';

dotenv.config();
const app = express();

const PORT = process.env.PORT || 4000;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);

// Middleware
app.use(express.json());
app.use(cors({
  origin: function (origin, cb) {
    if (!origin || ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(myMiddleware);

// --- Mongo ---
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("Missing MONGO_URI");
  process.exit(1);
}
mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => { console.error(err); process.exit(1); });

// --- Routes ---
// The original routes from your first code
app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
const TodoSchema = new mongoose.Schema({ text: String, done: Boolean }, { timestamps: true });
const Todo = mongoose.model("Todo", TodoSchema);
app.get("/api/todos", async (_req, res) => res.json(await Todo.find().lean()));
app.post("/api/todos", async (req, res) => {
  const todo = await Todo.create({ text: req.body.text, done: false });
  res.status(201).json(todo);
});

// Routes from the second code
app.use('/user', userRoutes);
app.use('/AllGames', AllGames);

app.listen(PORT, () => console.log(`Server on :${PORT}`));