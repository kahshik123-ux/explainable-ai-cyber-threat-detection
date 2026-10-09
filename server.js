// server.js

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cyber-threat-detection';

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from public directory
app.use(express.static(__dirname + '/public'));

// Routes
app.use('/api/auth', authRoutes);

// Serve the threat monitoring dashboard
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/dashboard.html');
});

function startServer() {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// MongoDB Connection
mongoose.connect(mongoUri)
    .then(() => {
        console.log('MongoDB Connected');
        startServer();
    })
    .catch(err => {
        console.error('MongoDB connection failed. Starting server without database connectivity.', err.message);
        startServer();
    });
