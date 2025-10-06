import mongoose from "mongoose";

// --- SCHEMAS ---

const userSchema = new mongoose.Schema(
  {
    role: { type: String, required: true },
    name: { type: String, required: true, unique: true },
    mobile: { type: String, required: true },
    password: { type: String, required: true },
    address: { type: String, required: true },
  },
  { timestamps: true }
);

const allGamesSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    owner: { type: String, required: true },
    resultNo: { type: Array },
    openNo: { type: Array },
    closeNo: { type: Array },
    startTime: { type: String, required: true },
    liveTime: { type: Number, default: null },
    endTime: { type: String, required: true },
    fontSize: { type: String },
    Notification_Message: { type: Array },
    nameColor: { type: String }, // default black
    resultColor: { type: String }, // default black
    panelColor: { type: String }, // default white
    notificationColor: { type: String },
    valid_date: {type: Date}, // Corrected 'require' to 'required'
    amount :{type: String}, // Corrected 'require' to 'required'
    method: {type: String}, // Corrected 'require' to 'required'
    status:{type: String} // Corrected 'require' to 'required'
  },
  { timestamps: true }
);

const liveResultSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    owner: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { timestamps: true }
);

const AgentListSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Corrected 'require' to 'required'
  owner: { type: String, required: true }, // Corrected 'require' to 'required'
});

const payMentBalanceRateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    owner: { type: String, required: true },
    TotalAmout: { type: String, required: true },
    TotalDay: { type: String, required: true },
    startTime: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { timestamps: true }
);

const NotificationSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  index: { 
    type: String, 
    required: true 
  }
}, {
  timestamps: true 
});

// --- MODELS ---
const User = mongoose.model("User", userSchema);
const AllGames = mongoose.model("AllGames", allGamesSchema);
const LiveResult = mongoose.model("LiveResult", liveResultSchema);
const Notification = mongoose.model('Notification', NotificationSchema);
const PayMentBalanceRate = mongoose.model(
  "PayMentBalanceRate",
  payMentBalanceRateSchema
);
// ⚠️ ADDED: Model for AgentListSchema
const AgentList = mongoose.model("AgentList", AgentListSchema);


// Export them (ESM way)
export { User, AllGames, LiveResult, PayMentBalanceRate, Notification, AgentList };