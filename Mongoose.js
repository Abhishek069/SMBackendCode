const mongoose = require("mongoose");

const DataBaseConnect = async () => {
  try {
    // Get connection string from environment variables
    const uri = process.env.MONGO_URI;

    if (!uri) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to MongoDB Atlas");
  } catch (error) {
    console.error("❌ Something went wrong while connecting to DB:", error);
    process.exit(1); // Exit process if DB connection fails
  }
};

module.exports = DataBaseConnect;
