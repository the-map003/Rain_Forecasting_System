const WebSocket = require('ws');
const mqtt = require('mqtt');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.mqttClient = null;
    this.connectedClients = new Set();
    this.isConnected = false;
  }

  // Start WebSocket server
  start(server) {
    this.wss = new WebSocket.Server({ server });
    
    this.wss.on('connection', (ws) => {
      console.log('📱 Frontend WebSocket client connected');
      this.connectedClients.add(ws);
      
      // Send current connection status
      ws.send(JSON.stringify({
        type: 'connection_status',
        connected: this.isConnected,
        timestamp: new Date().toISOString()
      }));

      ws.on('close', () => {
        console.log('📱 Frontend WebSocket client disconnected');
        this.connectedClients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('📱 WebSocket error:', error);
        this.connectedClients.delete(ws);
      });
    });

    // Connect to MQTT broker
    this.connectToMQTT();
  }

  // Connect to MQTT broker
  connectToMQTT() {
    const mqttUrl = 'mqtt://test.mosquitto.org:1883';
    
    this.mqttClient = mqtt.connect(mqttUrl, {
      clientId: `backend_websocket_${Math.random().toString(16).substring(2, 10)}`,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    });

    this.mqttClient.on('connect', () => {
      console.log('🔌 WebSocket Service connected to MQTT broker');
      this.isConnected = true;
      
      // Subscribe to all device topics
      this.mqttClient.subscribe('rain_forecasting/+/data', (err) => {
        if (err) {
          console.error('❌ Error subscribing to MQTT topics:', err);
        } else {
          console.log('📡 WebSocket Service subscribed to: rain_forecasting/+/data');
        }
      });

      // Notify all connected clients
      this.broadcast({
        type: 'mqtt_connected',
        timestamp: new Date().toISOString()
      });
    });

    this.mqttClient.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        const deviceId = data.device_id;
        
        console.log(`📨 WebSocket Service received MQTT message for device ${deviceId}`);
        
        // Broadcast to all connected frontend clients
        this.broadcast({
          type: 'mqtt_message',
          topic: topic,
          deviceId: deviceId,
          data: data,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('❌ Error processing MQTT message in WebSocket service:', error);
      }
    });

    this.mqttClient.on('error', (error) => {
      console.error('❌ MQTT connection error in WebSocket service:', error);
      this.isConnected = false;
      
      this.broadcast({
        type: 'mqtt_error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    });

    this.mqttClient.on('offline', () => {
      console.log('📴 MQTT client offline in WebSocket service');
      this.isConnected = false;
      
      this.broadcast({
        type: 'mqtt_disconnected',
        timestamp: new Date().toISOString()
      });
    });
  }

  // Broadcast message to all connected clients
  broadcast(message) {
    const messageStr = JSON.stringify(message);
    this.connectedClients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  // Get connection status
  getStatus() {
    return {
      mqttConnected: this.isConnected,
      clientsConnected: this.connectedClients.size
    };
  }

  // Cleanup
  stop() {
    if (this.mqttClient) {
      this.mqttClient.end();
    }
    if (this.wss) {
      this.wss.close();
    }
  }
}

module.exports = new WebSocketService();
