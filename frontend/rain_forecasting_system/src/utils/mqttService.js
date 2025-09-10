import { MQTT_CONFIG, BASE_URL } from './apiPaths';

class MQTTService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.messageCallbacks = new Map();
    this.connectionCallbacks = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // Connect to backend WebSocket service
  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    const wsUrl = `ws://localhost:8000`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('Connected to backend WebSocket service');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.connectionCallbacks.forEach(callback => callback(true));
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'mqtt_message') {
          // Handle MQTT message from backend
          const { topic, deviceId, data } = message;
          const callbacks = this.messageCallbacks.get(topic) || [];
          callbacks.forEach(callback => callback(data, topic));
        } else if (message.type === 'mqtt_connected') {
          console.log('Backend MQTT broker connected');
        } else if (message.type === 'mqtt_disconnected') {
          console.log('Backend MQTT broker disconnected');
          this.isConnected = false;
          this.connectionCallbacks.forEach(callback => callback(false));
        } else if (message.type === 'mqtt_error') {
          console.error('Backend MQTT error:', message.error);
          this.isConnected = false;
          this.connectionCallbacks.forEach(callback => callback(false, new Error(message.error)));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket connection closed');
      this.isConnected = false;
      this.connectionCallbacks.forEach(callback => callback(false));
      
      // Attempt to reconnect
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        setTimeout(() => this.connect(), 3000);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.isConnected = false;
      this.connectionCallbacks.forEach(callback => callback(false, error));
    };
  }

  // Disconnect from WebSocket service
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
      console.log('Disconnected from backend WebSocket service');
    }
  }

  // Subscribe to a device's data topic
  subscribeToDevice(deviceId, callback) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) this.connect();
    
    const topic = MQTT_CONFIG.getDeviceTopic(deviceId);
    
    // Store callback for this topic
    if (!this.messageCallbacks.has(topic)) {
      this.messageCallbacks.set(topic, []);
    }
    this.messageCallbacks.get(topic).push(callback);
    
    console.log(`Subscribed to ${topic} via WebSocket`);

    return topic;
  }

  // Unsubscribe from a device's data topic
  unsubscribeFromDevice(deviceId) {
    if (!this.ws) return;
    
    const topic = MQTT_CONFIG.getDeviceTopic(deviceId);
    this.messageCallbacks.delete(topic);
    console.log(`Unsubscribed from ${topic} via WebSocket`);
  }

  // Configure a device with a new device ID
  configureDevice(currentDeviceId, newDeviceId) {
    // This would need to be implemented via API call to backend
    // since we can't publish MQTT messages through WebSocket
    console.log(`Device configuration request for ${currentDeviceId} -> ${newDeviceId}`);
    return Promise.resolve(true);
  }

  // Update the server when data is received from a device
  updateDeviceDataReceived(deviceId) {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Authentication token missing');
      return Promise.reject(new Error('Authentication token missing'));
    }
    
    const url = `${BASE_URL}/api/v1/devices/${deviceId}/data-received`;
    
    return fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Authentication failed when updating device data');
        }
        throw new Error(`Server responded with ${response.status}`);
      }
      return response.json();
    })
    .catch(error => {
      console.error('Error updating device data received:', error);
      throw error;
    });
  }

  // Add connection status callback
  onConnectionChange(callback) {
    this.connectionCallbacks.push(callback);
    // If already connected, call with current status
    if (this.ws && this.isConnected) {
      callback(true);
    }
  }
}

// Create a singleton instance
const mqttService = new MQTTService();

export default mqttService;