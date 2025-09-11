import mqtt from 'mqtt';
import { MQTT_CONFIG } from './apiPaths';

class MQTTDirectService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.messageCallbacks = new Map();
    this.connectionCallbacks = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 10000;
    this.currentBrokerIndex = 0;
    this.connectionState = {
      isConnected: false,
      lastError: null,
      brokerUrl: null,
      lastConnectionAttempt: null
    };
  }

  connect() {
    if (this.client && this.client.connected) return;
    
    this.tryNextBroker();
  }

  tryNextBroker() {
    const allBrokers = [MQTT_CONFIG.BROKER_URL, ...MQTT_CONFIG.FALLBACK_BROKERS];
    
    if (this.currentBrokerIndex >= allBrokers.length) {
      console.error('❌ All MQTT brokers failed. Resetting to primary broker.');
      this.currentBrokerIndex = 0;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached. Stopping reconnection.');
        this.connectionCallbacks.forEach(callback => callback(false, new Error('All brokers failed')));
        return;
      }
      
      // Wait before trying again
      setTimeout(() => this.tryNextBroker(), this.reconnectDelay);
      return;
    }
    
    const brokerUrl = allBrokers[this.currentBrokerIndex];
    console.log(`🔄 Trying MQTT broker ${this.currentBrokerIndex + 1}/${allBrokers.length}: ${brokerUrl}`);
    this.connectToBroker(brokerUrl);
  }

  setupEventHandlers() {
    this.client.on('connect', () => {
      const allBrokers = [MQTT_CONFIG.BROKER_URL, ...MQTT_CONFIG.FALLBACK_BROKERS];
      const currentBroker = allBrokers[this.currentBrokerIndex];
      console.log(`✅ Connected to MQTT broker: ${currentBroker}`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.currentBrokerIndex = 0; // Reset to primary for next connection
      this.connectionState.isConnected = true;
      this.connectionState.lastError = null;
      this.connectionState.brokerUrl = currentBroker;
      this.connectionState.lastConnectionAttempt = new Date();
      this.connectionCallbacks.forEach(callback => callback(true));
    });

    this.client.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log(`📨 MQTT message received on ${topic}:`, data);
        
        const topicParts = topic.split('/');
        const deviceId = topicParts[1];
        
        console.log(`🔍 Looking for callbacks for topic: ${topic}`);
        console.log(`🔍 Available topics:`, Array.from(this.messageCallbacks.keys()));
        
        const callbacks = this.messageCallbacks.get(topic) || [];
        console.log(`🔍 Found ${callbacks.length} callbacks for ${topic}`);
        
        if (callbacks.length > 0) {
          callbacks.forEach((callback, index) => {
            console.log(`🚀 Executing callback ${index + 1} for device ${deviceId}`);
            callback(data, topic, deviceId);
          });
        } else {
          console.warn(`⚠️ No callbacks registered for topic: ${topic}`);
        }
        
      } catch (error) {
        console.error('❌ Error parsing MQTT message:', error, message.toString());
      }
    });

    this.client.on('error', (error) => {
      console.error('❌ MQTT connection error:', error);
      this.isConnected = false;
      this.connectionState.isConnected = false;
      this.connectionState.lastError = error;
      this.connectionCallbacks.forEach(callback => callback(false, error));
    });

    this.client.on('close', () => {
      console.log('📴 MQTT connection closed');
      this.isConnected = false;
      this.connectionState.isConnected = false;
      this.connectionCallbacks.forEach(callback => callback(false));
    });

    this.client.on('reconnect', () => {
      console.log(`🔄 MQTT reconnecting (attempt ${this.reconnectAttempts + 1})`);
    });

    this.client.on('offline', () => {
      console.log('📴 MQTT client went offline');
      this.isConnected = false;
      this.connectionState.isConnected = false;
    });

    this.client.on('end', () => {
      console.log('📴 MQTT connection ended');
      this.isConnected = false;
      this.connectionState.isConnected = false;
      
      // Try next broker if current one failed
      this.currentBrokerIndex++;
      setTimeout(() => this.tryNextBroker(), 2000);
    });
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.isConnected = false;
      console.log('Disconnected from MQTT broker');
    }
  }

  subscribeToDevice(deviceId, callback) {
    if (!this.client || !this.isConnected) {
      this.connect();
    }

    const topic = `rain_forecasting/${deviceId}/data`;
    
    // Store callback
    if (!this.messageCallbacks.has(topic)) {
      this.messageCallbacks.set(topic, []);
      
      // Subscribe to topic
      this.client.subscribe(topic, (err) => {
        if (err) {
          console.error(`Error subscribing to ${topic}:`, err);
        } else {
          console.log(`✅ Subscribed to ${topic}`);
        }
      });
    }
    
    this.messageCallbacks.get(topic).push(callback);
    return topic;
  }

  unsubscribeFromDevice(deviceId) {
    const topic = `rain_forecasting/${deviceId}/data`;
    
    if (this.messageCallbacks.has(topic)) {
      this.client.unsubscribe(topic);
      this.messageCallbacks.delete(topic);
      console.log(`Unsubscribed from ${topic}`);
    }
  }

  onConnectionChange(callback) {
    this.connectionCallbacks.push(callback);
    if (this.isConnected) {
      callback(true);
    }
  }

  connectToBroker(brokerUrl) {
    this.client = mqtt.connect(brokerUrl, {
      clientId: `frontend_${Math.random().toString(16).substr(2, 8)}`,
      clean: true,
      connectTimeout: 8000,
      reconnectPeriod: 2000,
      rejectUnauthorized: false
    });

    this.setupEventHandlers();
  }
}

// Singleton instance
const mqttDirectService = new MQTTDirectService();
export default mqttDirectService;