  const mongoose = require('mongoose');

  const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true }
  }, { timestamps: true });

  const allGamesSchema = new mongoose.Schema({
    name: { type: String, required: true },
    owner: { type: String, required: true },
    resultNo:{type: Array},
    startTime: { type: String, required: true },
    endTime: { type: String, required: true }
  }, { timestamps: true });

  const liveResultSchema = new mongoose.Schema({
    name: { type: String, required: true },
    owner: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true }
  }, { timestamps: true });

  const payMentBalanceRate = new mongoose.Schema({
    name: { type: String, required: true },
    owner: { type: String, required: true },
    TotalAmout: {type: String, required: true},
    TotalDay:{type: String, required: true},
    startTime: { type: String, required: true },
    endTime: { type: String, required: true }
  }, { timestamps: true });




  const User = mongoose.model('User', userSchema);
  const AllGames = mongoose.model('AllGames', allGamesSchema);
  const LiveResult = mongoose.model('LiveResult', liveResultSchema);

  module.exports = { User, AllGames, LiveResult };
