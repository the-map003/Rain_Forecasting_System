# Rain Forecasting System - Device Registration

## Overview

This document explains how to register and manage devices in the Rain Forecasting System. The system allows for registering devices with unique IDs and associating them with phone numbers for notifications.

## Device Registration Process

### 1. Register a Device via API

To register a new device, make a POST request to the device registration endpoint:

```
POST /api/v1/devices
```

Required fields:
- `name`: Name of the device
- `phoneNumber`: Phone number associated with the device

Optional fields:
- `location`: Physical location of the device

Example request:

```json
{
  "name": "Rain Sensor 1",
  "phoneNumber": "+1234567890",
  "location": "Backyard"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "deviceId": "a1b2c3d4e5f6g7h8",
    "name": "Rain Sensor 1",
    "phoneNumber": "+1234567890",
    "location": "Backyard",
    "isActive": true,
    "lastDataReceived": null,
    "createdAt": "2023-06-22T15:30:22.123Z",
    "updatedAt": "2023-06-22T15:30:22.123Z"
  }
}
```

### 2. Configure the Hardware Device

After registering the device, you need to configure the hardware with the assigned `deviceId`. The system supports two methods:

#### Method 1: Manual Configuration

1. Open the `rain_forecasting.ino` file
2. Replace the placeholder device ID with your assigned ID:
   ```c
   String deviceId = "a1b2c3d4e5f6g7h8"; // Replace with your device ID
   ```
3. Upload the code to your ESP32 device

#### Method 2: Remote Configuration

The device can be configured remotely via MQTT:

1. Publish a configuration message to the device's config topic:
   ```
   Topic: rain_forecasting/DEVICE_ID_PLACEHOLDER/config
   Payload: {"device_id": "a1b2c3d4e5f6g7h8"}
   ```
2. The device will automatically update its ID and store it in EEPROM

## MQTT Topic Structure

Devices publish data to MQTT using the following topic structure:

```
rain_forecasting/{deviceId}/data
```

The frontend application uses the same MQTT topic structure, which is defined in `frontend/rain_forecasting_system/src/utils/apiPaths.js` as part of the `MQTT_CONFIG` object:

```javascript
export const MQTT_CONFIG = {
    BROKER_URL: "test.mosquitto.org",
    PORT: 1883,
    TOPIC_PREFIX: "rain_forecasting",
    // Function to generate device-specific topic
    getDeviceTopic: (deviceId) => `rain_forecasting/${deviceId}/data`,
    getDeviceConfigTopic: (deviceId) => `rain_forecasting/${deviceId}/config`
};
```

The frontend also includes an MQTT service (`mqttService.js`) that handles communication with devices using this configuration.

Example payload:

```json
{
  "device_id": "a1b2c3d4e5f6g7h8",
  "temperature": 25.5,
  "humidity": 65.2,
  "pressure": 1013.25,
  "rain_value": 2500,
  "rain_detected": false,
  "forecast_rain": true
}
```

## Device Management API Endpoints

### Get All Devices

```
GET /api/v1/devices
```

### Get Device by ID

```
GET /api/v1/devices/:id
```

### Get Device by Device ID

```
GET /api/v1/devices/deviceId/:deviceId
```

### Update Device

```
PUT /api/v1/devices/:id
```

### Delete Device

```
DELETE /api/v1/devices/:id
```

### Check Device Status

```
GET /api/v1/devices/:deviceId/status
```

## Testing the Device Registration Flow

A test script is provided to demonstrate the complete device registration flow:

```
node test-device-flow.js
```

This script:
1. Logs in to get an authentication token
2. Registers a new device
3. Simulates sending data from the device via MQTT
4. Checks the device status

## Troubleshooting

### Device Not Connecting

- Verify WiFi credentials in the device code
- Check that the MQTT broker is accessible
- Ensure the device ID is correctly configured

### Data Not Being Received

- Verify the device is publishing to the correct topic
- Check that the payload format is correct
- Ensure the device ID in the topic matches the registered ID