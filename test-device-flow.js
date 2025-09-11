// Test script for device registration flow
const axios = require('axios');
const mqtt = require('mqtt');

// Configuration - use your actual device ID from database
const BROKER_URL = 'mqtt://test.mosquitto.org';
const DEVICE_ID = '025dfe862f858c4d'; // Your registered device ID

console.log(' MQTT Device Flow Tester');
console.log('==========================');
console.log(`Device ID: ${DEVICE_ID}`);
console.log(`Broker: ${BROKER_URL}`);
console.log('');

// Connect to broker
const client = mqtt.connect(BROKER_URL);

client.on('connect', () => {
    console.log(' Connected to MQTT broker');
    
    // Subscribe to the device's data topic to verify messages
    const dataTopic = `rain_forecasting/${DEVICE_ID}/data`;
    client.subscribe(dataTopic, (err) => {
        if (!err) {
            console.log(` Subscribed to: ${dataTopic}`);
            console.log('Listening for messages...');
            console.log('');
        }
    });
    
    // Send a test message
    console.log(' Sending test data...');
    const testData = {
        device_id: DEVICE_ID,
        temperature: 28.5,
        humidity: 65.0,
        pressure: 1013.25,
        rain_value: 2500,
        rain_detected: "false",
        forecast_rain: "false"
    };
    
    client.publish(dataTopic, JSON.stringify(testData), (err) => {
        if (!err) {
            console.log(' Test data published successfully!');
            console.log('Data sent:', JSON.stringify(testData, null, 2));
        } else {
            console.error(' Error publishing:', err);
        }
    });
});

client.on('message', (topic, message) => {
    console.log('\n Message received!');
    console.log(`Topic: ${topic}`);
    try {
        const data = JSON.parse(message.toString());
        console.log('Data:', JSON.stringify(data, null, 2));
        
        // Check data format
        console.log('\n Data validation:');
        console.log(`  - Device ID: ${data.device_id === DEVICE_ID ? ' Matches' : ' Mismatch'}`);
        console.log(`  - Temperature: ${data.temperature ? '' : ''} ${data.temperature}°C`);
        console.log(`  - Humidity: ${data.humidity ? '' : ''} ${data.humidity}%`);
        console.log(`  - Pressure: ${data.pressure ? '' : ''} ${data.pressure} hPa`);
        console.log(`  - Rain Value: ${data.rain_value !== undefined ? '' : ''} ${data.rain_value}`);
        console.log(`  - Rain Detected: ${data.rain_detected !== undefined ? '' : ''} ${data.rain_detected}`);
        console.log(`  - Forecast Rain: ${data.forecast_rain !== undefined ? '' : ''} ${data.forecast_rain}`);
    } catch (error) {
        console.error(' Error parsing message:', error);
    }
});

client.on('error', (error) => {
    console.error(' MQTT Error:', error);
});

console.log('Press Ctrl+C to exit\n');

// Configuration - using the same configuration as in frontend/apiPaths.js
const API_URL = 'https://rain-forecasting-system.onrender.com/api/v1';
const MQTT_BROKER = 'test.mosquitto.org';
const MQTT_PORT = 1883;
const MQTT_TOPIC_PREFIX = 'rain_forecasting';

// Helper functions to generate MQTT topics (matching frontend MQTT_CONFIG)
const getDeviceTopic = (deviceId) => `${MQTT_TOPIC_PREFIX}/${deviceId}/data`;
const getDeviceConfigTopic = (deviceId) => `${MQTT_TOPIC_PREFIX}/${deviceId}/config`;

// Test user credentials (replace with valid credentials)
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

// Test device data
const testDevice = {
  name: 'Test Rain Sensor',
  phoneNumber: '+1234567890',
  location: 'Test Location'
};

// Global variables
let authToken;
let deviceId;

// Login and get auth token
async function login() {
  try {
    console.log('Logging in...');
    const response = await axios.post(`${API_URL}/auth/login`, testUser);
    authToken = response.data.token;
    console.log('Login successful ✅');
    return true;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    return false;
  }
}

// Register a new device
async function registerDevice() {
  try {
    console.log('Registering device...');
    const response = await axios.post(
      `${API_URL}/devices`,
      testDevice,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    deviceId = response.data.data.deviceId;
    console.log('Device registered successfully ✅');
    console.log('Device ID:', deviceId);
    return true;
  } catch (error) {
    console.error('Device registration failed:', error.response?.data || error.message);
    return false;
  }
}

// Simulate sending data from the device
async function simulateDeviceData() {
  return new Promise((resolve, reject) => {
    try {
      console.log('Connecting to MQTT broker...');
      const client = mqtt.connect(`mqtt://${MQTT_BROKER}:${MQTT_PORT}`);
      
      client.on('connect', () => {
        console.log('Connected to MQTT broker ✅');
        
        // Create sample data payload
        const payload = {
          device_id: deviceId,
          temperature: 25.5,
          humidity: 65.2,
          pressure: 1013.25,
          rain_value: 2500,
          rain_detected: false,
          forecast_rain: true
        };
        
        // Publish to device-specific topic - using the helper function
        const topic = getDeviceTopic(deviceId);
        console.log(`Publishing to topic: ${topic}`);
        client.publish(topic, JSON.stringify(payload));
        
        // Update last data received timestamp via API
        axios.put(
          `${API_URL}/devices/${deviceId}/data-received`,
          {},
          { headers: { Authorization: `Bearer ${authToken}` } }
        )
        .then(() => {
          console.log('Last data received timestamp updated ✅');
          client.end();
          resolve(true);
        })
        .catch(error => {
          console.error('Failed to update timestamp:', error.response?.data || error.message);
          client.end();
          resolve(false);
        });
      });
      
      client.on('error', (err) => {
        console.error('MQTT connection error:', err);
        reject(err);
      });
    } catch (error) {
      console.error('Error simulating device data:', error);
      reject(error);
    }
  });
}

// Check device status
async function checkDeviceStatus() {
  try {
    console.log('Checking device status...');
    const response = await axios.get(
      `${API_URL}/devices/${deviceId}/status`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('Device status:', response.data);
    return true;
  } catch (error) {
    console.error('Failed to check device status:', error.response?.data || error.message);
    return false;
  }
}

// Demonstrate device configuration via MQTT
async function configureDeviceViaMQTT(newDeviceId) {
  return new Promise((resolve, reject) => {
    try {
      console.log('Connecting to MQTT broker for device configuration...');
      const client = mqtt.connect(`mqtt://${MQTT_BROKER}:${MQTT_PORT}`);
      
      client.on('connect', () => {
        console.log('Connected to MQTT broker ✅');
        
        // Create configuration payload
        const payload = {
          device_id: newDeviceId || `new-${deviceId}`
        };
        
        // Publish to device configuration topic
        const topic = getDeviceConfigTopic(deviceId);
        console.log(`Publishing configuration to topic: ${topic}`);
        client.publish(topic, JSON.stringify(payload));
        
        console.log('Device configuration sent ✅');
        client.end();
        resolve(true);
      });
      
      client.on('error', (err) => {
        console.error('MQTT connection error:', err);
        reject(err);
      });
    } catch (error) {
      console.error('Error configuring device:', error);
      reject(error);
    }
  });
}

// Run the complete test flow
async function runTest() {
  console.log('=== STARTING DEVICE REGISTRATION FLOW TEST ===');
  
  // Step 1: Login
  if (!await login()) return;
  
  // Step 2: Register device
  if (!await registerDevice()) return;
  
  // Step 3: Simulate device data
  if (!await simulateDeviceData()) return;
  
  // Step 4: Check device status
  if (!await checkDeviceStatus()) return;
  
  // Step 5: Demonstrate device configuration via MQTT
  if (!await configureDeviceViaMQTT()) return;
  
  console.log('=== TEST COMPLETED SUCCESSFULLY ✅ ===');
}

// Run the test
runTest().catch(error => {
  console.error('Test failed with error:', error);
});