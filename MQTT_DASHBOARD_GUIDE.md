# MQTT Dashboard Guide - Rain Forecasting System

## Overview

This guide explains how to use the MQTT Debug Panel in your Rain Forecasting System dashboard to monitor MQTT topics, payloads, and device communication in real-time.

## What You'll See in the Dashboard

### 1. MQTT Debug Panel
The dashboard now includes a comprehensive MQTT Debug Panel that shows:

- **Connection Status**: Real-time MQTT broker connection status
- **MQTT Configuration**: Broker details and topic patterns
- **Device Topics**: All registered device MQTT topics
- **Live Messages**: Real-time MQTT messages with payloads
- **Raw JSON**: Expandable raw JSON payloads for debugging

### 2. MQTT Topic Structure

Your ESP32 devices publish data using this topic pattern:
```
rain_forecasting/{deviceId}/data
```

**Example Topics:**
- `rain_forecasting/025dfe862f858c4d/data`
- `rain_forecasting/a1b2c3d4e5f6g7h8/data`

### 3. MQTT Payload Structure

Each message contains this JSON payload:
```json
{
  "device_id": "025dfe862f858c4d",
  "temperature": 28.5,
  "humidity": 65.2,
  "pressure": 1013.25,
  "rain_value": 2500,
  "rain_detected": false,
  "forecast_rain": true
}
```

## How to Use the Dashboard

### Step 1: Start the Backend Server
```bash
cd backend
# Create .env file with:
# MONGO_URI=mongodb://localhost:27017/rain_forecasting
# JWT_SECRET=your_jwt_secret_key_here
# PORT=5000
# CLIENT_URL=http://localhost:5173

node index.js
```

### Step 2: Start the Frontend
```bash
cd frontend/rain_forecasting_system
npm run dev
```

### Step 3: Test MQTT Data
Run the test script to simulate device data:
```bash
node test-mqtt-dashboard.js
```

### Step 4: View the Dashboard
1. Open http://localhost:5173
2. Login to your account
3. Go to "Device Data" page
4. Click "Show Debug" in the MQTT Debug Panel

## Dashboard Features

### MQTT Connection Status
- 🟢 **Connected**: MQTT broker is connected and receiving data
- 🟡 **Connecting**: Attempting to connect to MQTT broker
- 🔴 **Disconnected**: No connection to MQTT broker

### Device Topics Section
Shows all registered devices and their MQTT topics:
- Device name and ID
- Full MQTT topic path
- Copy button to copy topic to clipboard

### Recent MQTT Messages
Displays the last 50 MQTT messages received:
- Timestamp of each message
- MQTT topic
- Parsed sensor data (temperature, humidity, pressure, rain status)
- Expandable raw JSON payload
- Copy button for raw JSON

### Expected Payload Structure
Shows the exact JSON format your ESP32 should send:
- Device ID field
- Sensor readings (temperature, humidity, pressure)
- Rain detection values
- Forecast indicators

## Troubleshooting

### No MQTT Messages Appearing
1. **Check Backend**: Ensure backend server is running on port 5000
2. **Check MQTT Broker**: Verify connection to test.mosquitto.org
3. **Check Device Registration**: Ensure devices are registered in the system
4. **Check Device Code**: Verify ESP32 is publishing to correct topic

### MQTT Connection Issues
1. **Network**: Check internet connection
2. **Firewall**: Ensure port 1883 is not blocked
3. **Broker**: test.mosquitto.org might be temporarily unavailable

### Data Not Updating
1. **Refresh**: Click the refresh button in the dashboard
2. **Check Console**: Look for JavaScript errors in browser console
3. **Check Backend Logs**: Look for MQTT listener errors

## Testing Your ESP32 Device

### 1. Upload the Arduino Code
Make sure your `rain_forecasting.ino` is uploaded to your ESP32 with:
- Correct WiFi credentials
- Correct MQTT broker settings
- Valid device ID

### 2. Monitor Serial Output
Open Arduino Serial Monitor to see:
```
Published to MQTT topic: rain_forecasting/025dfe862f858c4d/data
Payload: {"device_id":"025dfe862f858c4d","temperature":28.5,...}
```

### 3. Check Dashboard
The MQTT Debug Panel should show:
- Connection status as "Connected"
- Device topic in the "Device Topics" section
- Live messages in the "Recent MQTT Messages" section

## MQTT Message Flow

```
ESP32 Device → MQTT Broker → Backend Listener → Database → Frontend Dashboard
     ↓              ↓              ↓              ↓           ↓
rain_forecasting/  test.mosquitto.org  mqttDataListener  MongoDB  MQTTDebugPanel
{deviceId}/data
```

## API Endpoints for MQTT Data

- `GET /api/v1/devices` - Get all registered devices
- `GET /api/v1/devices/realtime-data` - Get latest sensor data
- `PUT /api/v1/devices/:deviceId/data-received` - Update device timestamp

## Next Steps

1. **Register Devices**: Use the "Manage Devices" page to register your ESP32 devices
2. **Configure ESP32**: Set the device ID in your Arduino code
3. **Monitor Data**: Use the MQTT Debug Panel to verify data flow
4. **Analyze Trends**: Use the "Device Reports" page for historical data

## Support

If you encounter issues:
1. Check the browser console for JavaScript errors
2. Check the backend server logs
3. Verify your ESP32 Serial Monitor output
4. Ensure all services are running on correct ports

The MQTT Debug Panel provides comprehensive visibility into your IoT device communication, making it easy to troubleshoot and monitor your rain forecasting system in real-time.
