const axios = require('axios'); // We need to install axios: npm install axios
const API_URL = 'https://lanslide.onrender.com/api/data';

// --- Sensor Thresholds ---
// These values can be adjusted based on your requirements.
// These are the same thresholds used in the dashboard's frontend.
const THRESHOLDS = {
    temperature: 40,  // High temperature warning (°C)
    humidity: 90,     // High humidity warning (%)
    accelX: 2.5,      // High acceleration/tilt value (absolute value, m/s²)
    accelY: 2.5,      // High acceleration/tilt value (absolute value, m/s²)
    accelZ: 12.0,     // Significant deviation from 9.81 m/s^2 (m/s²)
    raindrop: 100,    // Low ADC value (e.g., < 100) means HEAVY rain
    soilMoisture: 700 // Low ADC value (e.g., < 700) means HIGH moisture
};

// Function to generate a random number within a range
const randomValue = (min, max) => Math.random() * (max - min) + min;

// Function to generate realistic-ish random sensor data for the new data structure
const generateSensorData = () => {
    return {
        temperature: randomValue(15, 35),
        humidity: randomValue(40, 80),
        accelX: randomValue(-2, 2),
        accelY: randomValue(-2, 2),
        accelZ: randomValue(8, 11),
        raindrop: Math.floor(randomValue(0, 1024)), // ADC value (0-1023)
        soilMoisture: Math.floor(randomValue(0, 1024)) // ADC value (0-1023)
    };
};

// Function to send data to the API endpoint
const sendData = async () => {
    const data = generateSensorData();

    // Check if any sensor value has crossed its threshold (inverse logic for ADC sensors)
    const isWarning = data.temperature > THRESHOLDS.temperature ||
                      data.humidity > THRESHOLDS.humidity ||
                      Math.abs(data.accelX) > THRESHOLDS.accelX ||
                      Math.abs(data.accelY) > THRESHOLDS.accelY ||
                      Math.abs(data.accelZ) > THRESHOLDS.accelZ ||
                      data.raindrop < THRESHOLDS.raindrop ||
                      data.soilMoisture < THRESHOLDS.soilMoisture;

    if (isWarning) {
        console.log("-----------------------------------------");
        console.log("🚨 WARNING: A sensor reading has exceeded its threshold!");
        console.log("Continuing data transmission.");
        console.log("-----------------------------------------");
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
