// Library Imports
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// File Imports
const connectDB = require('./Mongoose');
const myMiddleware = require('./Middlware');
const userRoutes = require('./routes/userRoutes'); // Assumes routes are defined here
const AllGames = require('./routes/getAllGames'); // Assumes routes are defined here

// App Initialization
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(myMiddleware);

// Routes
app.use('/user', userRoutes); // All user-related routes handled in userRoutes.js
app.use('/AllGames', AllGames); // All user-related routes handled in userRoutes.js

// Connect to DB and Start Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
