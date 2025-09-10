const mqtt = require('mqtt');

class MQTTService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.broker = 'mqtt://test.mosquitto.org';
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve(this.client);
        return;
      }

      this.client = mqtt.connect(this.broker);

      this.client.on('connect', () => {
        console.log('Connected to MQTT broker');
        this.connected = true;
        resolve(this.client);
      });

      this.client.on('error', (error) => {
        console.error('MQTT connection error:', error);
        this.connected = false;
        reject(error);
      });

      this.client.on('offline', () => {
        console.log('MQTT client offline');
        this.connected = false;
      });

      this.client.on('reconnect', () => {
        console.log('MQTT client reconnecting...');
      });
    });
  }

  async publish(topic, message) {
    try {
      if (!this.connected) {
        await this.connect();
      }

      return new Promise((resolve, reject) => {
        this.client.publish(topic, JSON.stringify(message), (error) => {
          if (error) {
            console.error('Error publishing to MQTT:', error);
            reject(error);
          } else {
            console.log(`Published to ${topic}:`, message);
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('Error in MQTT publish:', error);
      throw error;
    }
  }

  async configureDevice(deviceId) {
    try {
      // First, try to send to the placeholder topic (for new devices)
      const placeholderTopic = 'rain_forecasting/DEVICE_ID_PLACEHOLDER/config';
      const configMessage = {
        device_id: deviceId,
        action: 'configure',
        timestamp: new Date().toISOString()
      };

      await this.publish(placeholderTopic, configMessage);
      console.log(`Configuration sent to placeholder topic for device ${deviceId}`);

      // Also publish to the device's specific topic (in case it's already configured)
      const deviceTopic = `rain_forecasting/${deviceId}/config`;
      await this.publish(deviceTopic, configMessage);
      console.log(`Configuration sent to device topic for ${deviceId}`);

      return true;
    } catch (error) {
      console.error('Error configuring device via MQTT:', error);
      throw error;
    }
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.connected = false;
      console.log('Disconnected from MQTT broker');
    }
  }
}

// Create a singleton instance
const mqttService = new MQTTService();

module.exports = mqttService;
