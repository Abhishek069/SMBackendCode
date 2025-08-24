import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  mobile:{type: String, required: true},
  password: { type: String, required: true },
  address: { type: String, required: true }
}, { timestamps: true });

const allGamesSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: String, required: true },
  resultNo: { type: Array },
  openNo:{type:Array},
  closeNo:{type:Array},
  startTime: { type: String, required: true },
  endTime: { type: String, required: true }
}, { timestamps: true });

const liveResultSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true }
}, { timestamps: true });


const AgentListSchema = new mongoose.Schema({
  name:{type: String, require:true},
  owner:{type:String, require:true}
})

const payMentBalanceRateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: String, required: true },
  TotalAmout: { type: String, required: true },
  TotalDay: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true }
}, { timestamps: true });

// Models
const User = mongoose.model("User", userSchema);
const AllGames = mongoose.model("AllGames", allGamesSchema);
const LiveResult = mongoose.model("LiveResult", liveResultSchema);
const PayMentBalanceRate = mongoose.model("PayMentBalanceRate", payMentBalanceRateSchema);

// Export them (ESM way)
export { User, AllGames, LiveResult, PayMentBalanceRate };
