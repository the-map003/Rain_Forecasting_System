const mqtt = require('mqtt');

// Your existing device details from database
const DEVICE_ID = '025dfe862f858c4d';
const BROKER_URL = 'mqtt://test.mosquitto.org';

console.log('🔧 Sending Device Configuration');
console.log('===============================');
console.log(`Target Device ID: ${DEVICE_ID}`);
console.log(`MQTT Broker: ${BROKER_URL}`);

const client = mqtt.connect(BROKER_URL);

client.on('connect', () => {
    console.log('✅ Connected to MQTT broker');
    
    // Configuration message
    const configMessage = {
        device_id: DEVICE_ID,
        action: 'configure',
        timestamp: new Date().toISOString()
    };
    
    // Send to placeholder topic (for devices using DEVICE_ID_PLACEHOLDER)
    const placeholderTopic = 'rain_forecasting/DEVICE_ID_PLACEHOLDER/config';
    
    client.publish(placeholderTopic, JSON.stringify(configMessage), (err) => {
        if (!err) {
            console.log('📤 Configuration message sent successfully!');
            console.log(`   Topic: ${placeholderTopic}`);
            console.log(`   Message: ${JSON.stringify(configMessage)}`);
            console.log('');
            console.log('📋 Next Steps:');
            console.log('1. Your ESP32 should receive this message');
            console.log('2. It will save the device ID to EEPROM');
            console.log('3. Device will restart automatically');
            console.log('4. Check Serial Monitor for confirmation');
            console.log('');
            console.log('Expected Serial Output:');
            console.log('  "Message arrived on topic: rain_forecasting/DEVICE_ID_PLACEHOLDER/config"');
            console.log('  "Saving new device ID to EEPROM: 025dfe862f858c4d"');
            console.log('  Device should restart and use new ID');
        } else {
            console.error('❌ Error sending configuration:', err);
        }
        
        // Disconnect after 3 seconds
        setTimeout(() => {
            console.log('👋 Disconnecting...');
            client.end();
        }, 3000);
    });
});

client.on('error', (error) => {
    console.error('❌ MQTT Error:', error);
});

console.log('📡 Connecting to MQTT broker...');
