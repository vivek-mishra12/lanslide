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

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Define the schema for our sensor readings
const sensorDataSchema = new mongoose.Schema({
    temperature: Number,
    humidity: Number,
    accelX: Number,
    accelY: Number,
    accelZ: Number,
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

// Endpoint to receive new sensor data (simulated sensor POST request)
app.post('/api/data', async (req, res) => {
    try {
        // Extract all 7 new fields from the request body
        const { temperature, humidity, accelX, accelY, accelZ, raindrop, soilMoisture } = req.body;
        
        // Note: The 'api_key' sent by the ESP32 is automatically ignored here
        // as it is not part of the Mongoose schema.
        
        const newReading = new SensorReading({ 
            temperature, 
            humidity, 
            accelX, 
            accelY, 
            accelZ, 
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
        // The data will be averaged on the frontend to keep the backend simple.
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
