const mongoose = require('mongoose');
const allGamesSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: String, required: true },
  resultNo: { type: Array, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true }
}, { timestamps: true });

const AllGame = mongoose.model('AllGame', allGamesSchema);

// Your PanelData
const PanelData = [
  { name: "MILAN MORNING", owner: "Ravi Sharma", resultNo: ["112", "45", "348"], startTime: "10:30 AM", endTime: "11:30 AM" },
  { name: "SRIDEVI", owner: "Priya Mehta", resultNo: ["270", "15", "230"], startTime: "11:45 AM", endTime: "12:45 PM" },
  { name: "MAIN BAZAR MORNING", owner: "Amit Verma", resultNo: ["770", "15", "230"], startTime: "11:15 AM", endTime: "12:15 PM" },
  { name: "KALYAN MORNING", owner: "Sunita Rao", resultNo: ["130", "40", "389"], startTime: "11:00 AM", endTime: "12:02 PM" },
  { name: "PADMAVATHI", owner: "Manish Gupta", resultNo: ["460", "15", "230"], startTime: "11:40 AM", endTime: "12:40 PM" },
  { name: "MADHURI", owner: "Neha Singh", resultNo: ["249", "15", "230"], startTime: "11:45 AM", endTime: "12:45 PM" }
];

// Connect and insert
mongoose.connect('mongodb://localhost:27017/SattaMatka', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log("MongoDB connected");

  await AllGame.insertMany(PanelData);
  console.log("Data inserted!");

  mongoose.connection.close();
}).catch((err) => {
  console.error("Connection error:", err);
});
