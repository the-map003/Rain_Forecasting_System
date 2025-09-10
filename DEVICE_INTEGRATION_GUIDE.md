# Rain Forecasting System - Device Integration Guide

## How the ESP32 Device Works with the Dashboard

### 1. Device Architecture Overview

The ESP32 device (`rain_forecasting.ino`) is equipped with:
- **BME280 Sensor**: Measures temperature, humidity, and atmospheric pressure
- **Rain Sensor**: Analog sensor on pin 34 to detect rain
- **Buzzer**: Alert system on pin 26
- **Status LED**: System indicator on pin 23
- **WiFi Module**: Connects to network (SSID: "GIHANGA DYNAMICS")
- **MQTT Client**: Publishes data to `test.mosquitto.org` broker

### 2. Device ID Configuration System

#### Initial Setup
1. **EEPROM Storage**: Device ID is stored in EEPROM (addresses 0-15, 16 characters max)
2. **Default Placeholder**: If no ID is stored, device uses `DEVICE_ID_PLACEHOLDER`
3. **Automatic Configuration**: Device subscribes to its configuration topic to receive ID updates

#### How Device ID is Uploaded to the Controller

**Method 1: During Device Registration (Recommended)**
```javascript
// When you register a device in ManageDevices page:
1. Admin adds device with name and phone number
2. Backend generates unique 8-byte hex ID (e.g., "a1b2c3d4e5f6g7h8")
3. Backend publishes configuration to MQTT:
   - Topic: `rain_forecasting/DEVICE_ID_PLACEHOLDER/config`
   - Message: {"device_id": "a1b2c3d4e5f6g7h8", "action": "configure"}
4. ESP32 receives message and saves ID to EEPROM
5. Device restarts using new ID for all communications
```

**Method 2: Manual Configuration via Serial**
```cpp
// You can add this function to the Arduino code for manual setup:
void serialConfiguration() {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    if (command.startsWith("SET_ID:")) {
      String newId = command.substring(7);
      saveDeviceIdToEEPROM(newId);
      Serial.println("Device ID updated to: " + newId);
      ESP.restart(); // Restart to use new ID
    }
  }
}
```

### 3. MQTT Communication Flow

#### Topics Structure
- **Data Publishing**: `rain_forecasting/{deviceId}/data`
- **Configuration**: `rain_forecasting/{deviceId}/config`
- **Wildcard Subscription**: Frontend subscribes to `rain_forecasting/+/data` to receive all device data

#### Data Format
```json
{
  "device_id": "a1b2c3d4e5f6g7h8",
  "temperature": 28.5,
  "humidity": 65.2,
  "pressure": 1013.25,
  "rain_value": 2500,
  "rain_detected": false,
  "forecast_rain": false
}
```

### 4. How Device Appears in Dashboard

#### In Manage Devices Page
- Shows device name, ID, phone number
- Status indicator (Online/Offline based on last data received)
- Edit/Delete capabilities
- Registration date

#### In Device Data Page (Real-time Monitoring)
1. **Device Selection**: Dropdown shows all registered devices
2. **Live Data Display**:
   - Temperature gauge (°C)
   - Humidity percentage with progress bar
   - Pressure reading (hPa)
   - Rain sensor analog value
   - Rain status with emoji indicators:
     - 🌧️ Raining (rain_detected = true)
     - ☁️ Rain Forecast (forecast_rain = true)
     - ☀️ Clear (no rain)
3. **Connection Status**: 
   - Green dot = Online (data received < 5 minutes ago)
   - Red dot = Offline (no recent data)
4. **Auto-refresh**: Updates every time MQTT message is received

#### In Device Reports Page
- Historical data analysis
- Charts showing trends over time
- Export capabilities for data analysis

### 5. Rain Forecasting Logic

The device uses multiple parameters to forecast rain:

```cpp
// Current rain detection
if (rainValue < 2000) {
    rainDetected = true;  // It's currently raining
}

// Rain forecasting based on weather patterns
if ((humidity > 70% && pressure < 845 hPa) || 
    (temperature < (28°C - 5°C))) {
    forecastRain = true;  // High chance of rain
}
```

### 6. Setting Up a New Device

#### Step 1: Register Device in Dashboard
1. Go to Manage Devices page
2. Click "Add Device"
3. Enter device name and phone number
4. System generates unique device ID
5. Device appears in list with "Offline" status

#### Step 2: Configure ESP32
1. Upload the Arduino code to ESP32
2. Device boots with placeholder ID
3. Connects to WiFi and MQTT broker
4. Receives configuration message with new ID
5. Saves ID to EEPROM and restarts
6. Begins publishing data with assigned ID

#### Step 3: Verify Connection
1. Go to Device Data page
2. Select your device from dropdown
3. Should see real-time data updating every 2 seconds
4. Status changes to "Online"

### 7. Troubleshooting

#### Device Not Appearing Online
- Check WiFi credentials in Arduino code
- Verify MQTT broker is accessible (test.mosquitto.org:1883)
- Ensure device ID matches registered ID
- Check Serial Monitor for connection errors

#### No Real-time Data
- Verify MQTT WebSocket connection on port 8080
- Check browser console for MQTT errors
- Ensure frontend is subscribed to correct topics
- Verify data format matches expected JSON structure

#### Device ID Not Updating
- Check EEPROM is properly initialized
- Verify MQTT configuration topic subscription
- Ensure backend MQTT service is running
- Check device is subscribed to both placeholder and specific config topics

### 8. Data Flow Summary

```
ESP32 Device → MQTT Broker (test.mosquitto.org)
                     ↓
    Frontend (WebSocket:8080) ← Subscribe to topics
                     ↓
    Update UI with real-time data
                     ↓
    Backend API ← Update last data received timestamp
```

### 9. Security Considerations

- Device IDs are unique and hard to guess (8-byte hex)
- Consider adding authentication to MQTT broker in production
- Use TLS/SSL for MQTT connections in production
- Implement device authentication tokens
- Add rate limiting to prevent data flooding

### 10. Production Deployment

For production environment:
1. Use private MQTT broker (not public test.mosquitto.org)
2. Implement MQTT authentication
3. Use secure WebSocket (wss://) for frontend
4. Add device provisioning API
5. Implement OTA (Over-The-Air) updates for ESP32
6. Add data validation and sanitization
7. Implement device heartbeat monitoring
