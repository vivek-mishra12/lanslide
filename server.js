// server.js - The main backend file for our dashboard

// Load environment variables from .env file
require('dotenv').config();

// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cron = require('node-cron');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000; // Use port from .env or default to 3000

// Middleware setup
app.use(cors()); // Enable CORS for cross-origin requests
app.use(bodyParser.json()); // Parse JSON bodies from incoming requests
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' directory

// --- MongoDB Connection and Schema ---
// Use the MongoDB URI from the environment variables
const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// vivek-mishra12/lanslide/lanslide-d45f67ee13f3293b99def2aab88deb9cf06c6ec3/server.js

// ... (imports and middleware setup remain the same)

// Define the NEW schema for your sensor readings
const sensorDataSchema = new mongoose.Schema({
    temperature: Number,
    humidity: Number,
    accelX: Number,
    accelY: Number,
    accelZ: Number,
    // --- Added Gyroscope Readings ---
    gyroX: Number,
    gyroY: Number,
    gyroZ: Number,
    // --------------------------------
    raindrop: Number,
    soilMoisture: Number,
    timestamp: {
        type: Date,
        default: Date.now,
        expires: '1h' // Automatically delete documents older than 1 hour
    }
});

const SensorReading = mongoose.model('SensorReading', sensorDataSchema);

// --- API Endpoints ---

// Endpoint to receive new sensor data (Base Station POST request)
app.post('/api/data', async (req, res) => {
    try {
        // Updated destructuring to include gyroX, gyroY, gyroZ
        const { temperature, humidity, accelX, accelY, accelZ, gyroX, gyroY, gyroZ, raindrop, soilMoisture } = req.body;
        
        const newReading = new SensorReading({ 
            temperature, 
            humidity, 
            accelX, 
            accelY, 
            accelZ, 
            gyroX, // New field included
            gyroY, // New field included
            gyroZ, // New field included
            raindrop, 
            soilMoisture 
        });
        await newReading.save();
        res.status(201).json({ message: 'Data saved successfully!' });
    } catch (err) {
        console.error('Error saving data:', err);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// ... (remaining API endpoints and cron job remain the same)

// Endpoint to get the latest sensor reading
app.get('/api/latest', async (req, res) => {
    try {
        const latestReading = await SensorReading.findOne().sort({ timestamp: -1 });
        res.json(latestReading);
    } catch (err) {
        console.error('Error fetching latest data:', err);
        res.status(500).json({ error: 'Failed to fetch latest data' });
    }
    
});

// Endpoint to get historical sensor data for the past hour
app.get('/api/history', async (req, res) => {
    try {
        const history = await SensorReading.find().sort({ timestamp: 1 });
        res.json(history);
    } catch (err) {
        console.error('Error fetching historical data:', err);
        res.status(500).json({ error: 'Failed to fetch historical data' });
    }
});

// Cron job to clean up old data (though Mongoose expires is set, this is a fallback)
cron.schedule('0 * * * *', async () => {
    console.log('Running data cleanup task...');
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    try {
        await SensorReading.deleteMany({ timestamp: { $lt: oneHourAgo } });
        console.log('Old data removed successfully.');
    } catch (err) {
        console.error('Error during data cleanup:', err);
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
