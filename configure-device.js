const mqtt = require('mqtt');

// Configuration
const BROKER_URL = 'mqtt://test.mosquitto.org';
const DEVICE_ID_TO_CONFIGURE = '025dfe862f858c4d'; // The ID from your database

// Connect to MQTT broker
const client = mqtt.connect(BROKER_URL);

client.on('connect', () => {
    console.log('✅ Connected to MQTT broker');
    console.log('📡 Sending configuration to ESP32 device...');
    console.log('-----------------------------------');
    
    // Configuration message
    const configMessage = {
        device_id: DEVICE_ID_TO_CONFIGURE,
        action: 'configure',
        timestamp: new Date().toISOString()
    };
    
    // Send to placeholder topic (for unconfigured devices)
    const placeholderTopic = 'rain_forecasting/DEVICE_ID_PLACEHOLDER/config';
    client.publish(placeholderTopic, JSON.stringify(configMessage), (err) => {
        if (err) {
            console.error('❌ Error sending to placeholder topic:', err);
        } else {
            console.log(`✅ Configuration sent to placeholder topic`);
            console.log(`   Topic: ${placeholderTopic}`);
            console.log(`   Device ID: ${DEVICE_ID_TO_CONFIGURE}`);
        }
    });
    
    // Also send to the device's specific topic (in case it's already partially configured)
    const deviceTopic = `rain_forecasting/${DEVICE_ID_TO_CONFIGURE}/config`;
    client.publish(deviceTopic, JSON.stringify(configMessage), (err) => {
        if (err) {
            console.error('❌ Error sending to device topic:', err);
        } else {
            console.log(`✅ Configuration also sent to device topic`);
            console.log(`   Topic: ${deviceTopic}`);
        }
    });
    
    console.log('\n📝 Instructions:');
    console.log('1. Make sure your ESP32 is powered on and connected to WiFi');
    console.log('2. The ESP32 should receive this configuration and save the ID to EEPROM');
    console.log('3. After configuration, the ESP32 will publish to:');
    console.log(`   rain_forecasting/${DEVICE_ID_TO_CONFIGURE}/data`);
    console.log('\n⏳ Waiting 5 seconds before disconnecting...');
    
    // Keep connection open for a bit to ensure message is sent
    setTimeout(() => {
        console.log('👋 Configuration complete. Disconnecting...');
        client.end();
        process.exit(0);
    }, 5000);
});

client.on('error', (error) => {
    console.error('❌ MQTT Error:', error);
});

console.log('🚀 ESP32 Device Configuration Tool');
console.log('📡 Connecting to MQTT broker...');
