const mqtt = require('mqtt');
const Device = require('../models/Device');
const SensorData = require('../models/SensorData');

class MQTTDataListener {
  constructor() {
    this.client = null;
    this.connected = false;
    this.broker = 'mqtt://test.mosquitto.org';
  }

  async start() {
    try {
      console.log('Starting MQTT Data Listener...');
      
      this.client = mqtt.connect(this.broker);

      this.client.on('connect', () => {
        console.log('✅ MQTT Data Listener connected to broker');
        this.connected = true;
        
        // Subscribe to all device data topics
        this.client.subscribe('rain_forecasting/+/data', (err) => {
          if (err) {
            console.error('❌ Error subscribing to device topics:', err);
          } else {
            console.log('📡 Subscribed to: rain_forecasting/+/data');
          }
        });
      });

      this.client.on('message', async (topic, message) => {
        try {
          console.log(`📨 Received message on topic: ${topic}`);
          
          const data = JSON.parse(message.toString());
          const deviceId = data.device_id;
          
          console.log(`📊 Data from device ${deviceId}:`, {
            temperature: data.temperature,
            humidity: data.humidity,
            pressure: data.pressure,
            rain_value: data.rain_value,
            rain_detected: data.rain_detected,
            forecast_rain: data.forecast_rain
          });

          // Update device's lastDataReceived timestamp and store sensor data
          await this.updateDeviceLastDataReceived(deviceId, data);
          await this.storeSensorData(deviceId, data);
          
        } catch (error) {
          console.error('❌ Error processing MQTT message:', error);
        }
      });

      this.client.on('error', (error) => {
        console.error('❌ MQTT Data Listener error:', error);
        this.connected = false;
      });

      this.client.on('offline', () => {
        console.log('📴 MQTT Data Listener offline');
        this.connected = false;
      });

      this.client.on('reconnect', () => {
        console.log('🔄 MQTT Data Listener reconnecting...');
      });

    } catch (error) {
      console.error('❌ Error starting MQTT Data Listener:', error);
    }
  }

  async updateDeviceLastDataReceived(deviceId, sensorData) {
    try {
      const device = await Device.findOneAndUpdate(
        { deviceId: deviceId },
        { 
          lastDataReceived: new Date(),
          // Store latest sensor data for quick access
          latestData: {
            temperature: sensorData.temperature,
            humidity: sensorData.humidity,
            pressure: sensorData.pressure,
            rainValue: sensorData.rain_value,
            rainDetected: sensorData.rain_detected === 'true',
            forecastRain: sensorData.forecast_rain === 'true',
            timestamp: new Date()
          }
        },
        { new: true }
      );

      if (device) {
        console.log(`✅ Updated device ${deviceId} lastDataReceived`);
      } else {
        console.log(`⚠️ Device ${deviceId} not found in database`);
      }
    } catch (error) {
      console.error(`❌ Error updating device ${deviceId}:`, error);
    }
  }

  async storeSensorData(deviceId, sensorData) {
    try {
      const sensorRecord = new SensorData({
        deviceId: deviceId,
        temperature: sensorData.temperature,
        humidity: sensorData.humidity,
        pressure: sensorData.pressure,
        rainValue: sensorData.rain_value,
        rainDetected: sensorData.rain_detected === 'true',
        forecastRain: sensorData.forecast_rain === 'true'
      });

      await sensorRecord.save();
      console.log(`💾 Stored sensor data for device ${deviceId}`);
    } catch (error) {
      console.error(`❌ Error storing sensor data for device ${deviceId}:`, error);
    }
  }

  stop() {
    if (this.client) {
      this.client.end();
      console.log('🛑 MQTT Data Listener stopped');
    }
  }
}

// Create singleton instance
const mqttDataListener = new MQTTDataListener();

module.exports = mqttDataListener;
