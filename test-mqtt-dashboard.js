const mqtt = require('mqtt');

// Configuration
const BROKER_URL = 'mqtt://test.mosquitto.org';
const DEVICE_ID = '025dfe862f858c4d'; // Your registered device ID

console.log('🚀 Starting MQTT Dashboard Test');
console.log('================================');
console.log(`📡 Broker: ${BROKER_URL}`);
console.log(`🔧 Device ID: ${DEVICE_ID}`);
console.log(`📋 Topic: rain_forecasting/${DEVICE_ID}/data`);
console.log('================================\n');

// Connect to MQTT broker
const client = mqtt.connect(BROKER_URL);

// Simulation parameters
let temperature = 28.5;
let humidity = 65.0;
let pressure = 1013.25;
let rainValue = 3000;
let messageCount = 0;

client.on('connect', () => {
    console.log('✅ Connected to MQTT broker');
    console.log('📡 Publishing test data every 2 seconds...\n');
    
    // Publish data every 2 seconds (matching Arduino delay)
    setInterval(() => {
        messageCount++;
        
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
                console.log(`📨 Message #${messageCount} published to: ${topic}`);
                console.log(`📊 Payload:`, JSON.stringify(payload, null, 2));
                console.log('----------------------------------------');
            }
        });
        
    }, 2000); // 2 second interval
});

client.on('error', (err) => {
    console.error('❌ MQTT Error:', err);
});

client.on('offline', () => {
    console.log('📴 MQTT Client offline');
});

client.on('reconnect', () => {
    console.log('🔄 MQTT Client reconnecting...');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down MQTT test...');
    client.end();
    process.exit(0);
});

console.log('💡 Press Ctrl+C to stop the test');
console.log('🌐 Open your dashboard to see the MQTT data in real-time\n');
