require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const auth = require('./routes/auth');
const users = require('./routes/users');

const app = express();

// Middleware to handle CORS
app.use(
    cors({
        origin: process.env.CLIENT_URL || "*",
        methods: ['GET','POST','PUT','DELETE'],
        allowedHeaders: ['Content-Type','Authorization'],
    })
);

app.use(express.json());

connectDB();

app.use("/api/v1/auth", auth);
app.use("/api/v1/users", users);
// Serve static files from the React build
app.use(express.static(path.join(__dirname, "..", "frontend", "rain_forecasting_system", "dist")));

// Handle ALL other routes by serving the React app's index.html
// This must be placed AFTER all API routes
app.get("/*splat", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "rain_forecasting_system", "dist", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));