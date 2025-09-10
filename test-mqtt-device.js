const mqtt = require('mqtt');

// Configuration
const BROKER_URL = 'mqtt://test.mosquitto.org';
const DEVICE_ID = '025dfe862f858c4d'; // Your registered device ID from database

// Connect to MQTT broker
const client = mqtt.connect(BROKER_URL);

// Simulation parameters
let temperature = 28.5;
let humidity = 65.0;
let pressure = 1013.25;
let rainValue = 3000;

client.on('connect', () => {
    console.log('✅ Connected to MQTT broker');
    console.log(`📡 Publishing data for device: ${DEVICE_ID}`);
    console.log('-----------------------------------');
    
    // Publish data every 2 seconds (matching Arduino delay)
    setInterval(() => {
        // Simulate sensor value changes
        temperature += (Math.random() - 0.5) * 0.5;
        humidity += (Math.random() - 0.5) * 2;
        pressure += (Math.random() - 0.5) * 0.5;
        rainValue += Math.floor((Math.random() - 0.5) * 100);
        
        // Keep values in realistic ranges
        temperature = Math.max(20, Math.min(35, temperature));
        humidity = Math.max(30, Math.min(95, humidity));
        pressure = Math.max(1000, Math.min(1030, pressure));
        rainValue = Math.max(0, Math.min(4095, rainValue));
        
        // Determine rain status based on thresholds (matching Arduino logic)
        const rainDetected = rainValue < 2000;
        const forecastRain = (humidity > 70 && pressure < 1010) || temperature < 23;
        
        // Create payload matching Arduino format
        const payload = {
            device_id: DEVICE_ID,
            temperature: parseFloat(temperature.toFixed(2)),
            humidity: parseFloat(humidity.toFixed(2)),
            pressure: parseFloat(pressure.toFixed(2)),
            rain_value: rainValue,
            rain_detected: rainDetected ? "true" : "false",
            forecast_rain: forecastRain ? "true" : "false"
        };
        
        // Publish to device topic
        const topic = `rain_forecasting/${DEVICE_ID}/data`;
        client.publish(topic, JSON.stringify(payload), (err) => {
            if (err) {
                console.error('❌ Error publishing:', err);
            } else {
                const rainStatus = rainDetected ? '🌧️ RAINING' : 
                                 forecastRain ? '☁️ RAIN FORECAST' : '☀️ CLEAR';
                console.log(`📊 Published: Temp=${temperature.toFixed(1)}°C, Humidity=${humidity.toFixed(1)}%, Pressure=${pressure.toFixed(1)}hPa, Rain=${rainValue} [${rainStatus}]`);
            }
        });
    }, 2000);
    
    // Subscribe to configuration topic
    const configTopic = `rain_forecasting/${DEVICE_ID}/config`;
    client.subscribe(configTopic, (err) => {
        if (!err) {
            console.log(`📥 Subscribed to config topic: ${configTopic}`);
        }
    });
});

client.on('message', (topic, message) => {
    console.log(`📨 Received message on ${topic}:`, message.toString());
});

client.on('error', (error) => {
    console.error('❌ MQTT Error:', error);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down...');
    client.end();
    process.exit();
});

console.log('🚀 ESP32 Device Simulator Starting...');
console.log('📡 Connecting to MQTT broker...');
console.log('Press Ctrl+C to stop');
