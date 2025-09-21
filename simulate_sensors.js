// simulate_sensors.js - A script to simulate sensor data and send it to the backend

const axios = require('axios'); // We need to install axios: npm install axios
const API_URL = 'https://lanslide.onrender.com/api/data';

// --- Sensor Thresholds ---
// These values can be adjusted based on your requirements.
const THRESHOLDS = {
    rain: 95, // High rain value
    soilMoisture: 80, // High moisture
    tilt: 50, // Significant tilt
    vibration: 75 // High vibration
};

// Function to generate a random number within a range
const randomValue = (min, max) => Math.random() * (max - min) + min;

// Function to generate realistic-ish random sensor data
const generateSensorData = () => {
    return {
        rain: randomValue(0, 100), // e.g., 0-100%
        soilMoisture: randomValue(0, 100), // e.g., 0-100%
        tilt: randomValue(0, 90), // e.g., 0-90 degrees
        vibration: randomValue(0, 100) // e.g., 0-100 units
    };
};

// Function to send data to the API endpoint
const sendData = async () => {
    const data = generateSensorData();

    // Check if any sensor value has crossed its threshold
    if (data.rain > THRESHOLDS.rain ||
        data.soilMoisture > THRESHOLDS.soilMoisture ||
        data.tilt > THRESHOLDS.tilt ||
        data.vibration > THRESHOLDS.vibration) {

        console.log("-----------------------------------------");
        console.log("🚨 WARNING: A sensor reading has exceeded its threshold!");
        console.log("Continuing data transmission.");
        console.log("-----------------------------------------");
        
        // No clearInterval here, so the simulation continues
    }

    try {
        await axios.post(API_URL, data);
        console.log('Sent new sensor data:', data);
    } catch (error) {
        console.error('Failed to send data:', error.message);
    }
};

// Start the data sending loop
setInterval(sendData, 1000);

console.log('Sensor simulator started. Sending data to the server every second...');
