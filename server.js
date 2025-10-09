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

// NEW: Import http and socket.io for WebSocket functionality
const http = require('http'); 
const { Server } = require("socket.io"); 

const app = express();
const port = process.env.PORT || 3000; 

// NEW: 1. Create HTTP server and attach Socket.IO
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all origins for the socket connection
        methods: ["GET", "POST"]
    }
});

// Middleware setup
app.use(cors()); // Enable CORS for cross-origin requests
app.use(bodyParser.json()); // Parse JSON bodies from incoming requests
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' directory

// --- MongoDB Connection and Schema ---
const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Define the NEW schema for your sensor readings (Updated for 11 fields, snake_case)
const sensorDataSchema = new mongoose.Schema({
    temperature: Number,
    humidity: Number,
    soil_moisture: Number, // CHANGED from soilMoisture (now percentage)
    rain_status: Number,   // CHANGED from raindrop (now digital 0/1)
    vibration: Number,     // NEW field (digital 0/1)
    accel_x: Number,       // CHANGED from accelX
    accel_y: Number,       // CHANGED from accelY
    accel_z: Number,       // CHANGED from accelZ
    gyro_x: Number,        // CHANGED from gyroX
    gyro_y: Number,        // CHANGED from gyroY
    gyro_z: Number,        // CHANGED from gyroZ
    timestamp: {
        type: Date,
        default: Date.now,
        expires: '1h' // Automatically delete documents older than 1 hour
    }
});

const SensorReading = mongoose.model('SensorReading', sensorDataSchema);

// NEW: 2. Socket.IO connection handling (logging)
io.on('connection', (socket) => {
    console.log('A user connected via WebSocket');
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// --- API Endpoints ---

// Endpoint to receive new sensor data (Base Station POST request)
app.post('/api/data', async (req, res) => {
    try {
        // Updated destructuring for the new 11 fields (snake_case)
        const { 
            temperature, 
            humidity, 
            soil_moisture, 
            rain_status, 
            vibration,
            accel_x, 
            accel_y, 
            accel_z, 
            gyro_x, 
            gyro_y, 
            gyro_z 
        } = req.body;
        
        const newReading = new SensorReading({ 
            temperature, 
            humidity, 
            soil_moisture, 
            rain_status, 
            vibration,
            accel_x, 
            accel_y, 
            accel_z, 
            gyro_x, 
            gyro_y, 
            gyro_z 
        });
        await newReading.save();

        // NEW: 3. Broadcast the new reading to all connected clients
        io.emit('sensor_update', newReading); 

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
        res.json(history);
    } catch (err) {
        console.error('Error fetching historical data:', err);
        res.status(500).json({ error: 'Failed to fetch historical data' });
    }
});

// Cron job to clean up old data
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

// NEW: 4. Start the server using the httpServer instance
httpServer.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
    console.log(`WebSocket server running on port ${port}`);
});