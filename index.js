import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();

const PORT = process.env.PORT || 4000; // Render will set PORT
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);

app.use(express.json());
app.use(cors({
  origin: function (origin, cb) {
    if (!origin || ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

// --- Mongo ---
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("Missing MONGO_URI");
  process.exit(1);
}
mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => { console.error(err); process.exit(1); });

// --- Sample routes ---
app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Example model
const TodoSchema = new mongoose.Schema({ text: String, done: Boolean }, { timestamps: true });
const Todo = mongoose.model("Todo", TodoSchema);

app.get("/api/todos", async (_req, res) => res.json(await Todo.find().lean()));
app.post("/api/todos", async (req, res) => {
  const todo = await Todo.create({ text: req.body.text, done: false });
  res.status(201).json(todo);
});

app.listen(PORT, () => console.log(`Server on :${PORT}`));
