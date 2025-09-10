import React, { useState, useEffect } from 'react';
import { Activity, Wifi, WifiOff, Eye, EyeOff, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const MQTTDebugPanel = ({ mqttClient, devices, deviceData, backendConnected }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mqttMessages, setMqttMessages] = useState([]);
  const [showRawPayload, setShowRawPayload] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    if (mqttClient && mqttClient.service) {
      // Listen for MQTT connection status
      mqttClient.service.onConnectionChange((connected, error) => {
        setConnectionStatus(connected ? 'connected' : 'disconnected');
        if (error) {
          console.error('MQTT connection error:', error);
        }
      });
    }
  }, [mqttClient]);

  // Simulate MQTT message logging (in real implementation, this would come from MQTT service)
  useEffect(() => {
    if (deviceData && Object.keys(deviceData).length > 0) {
      Object.entries(deviceData).forEach(([deviceId, data]) => {
        if (data.lastUpdate) {
          const message = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            topic: `rain_forecasting/${deviceId}/data`,
            deviceId: deviceId,
            payload: {
              device_id: deviceId,
              temperature: data.temperature,
              humidity: data.humidity,
              pressure: data.pressure,
              rain_value: data.rainValue,
              rain_detected: data.rainDetected,
              forecast_rain: data.forecastRain
            },
            rawPayload: JSON.stringify({
              device_id: deviceId,
              temperature: data.temperature,
              humidity: data.humidity,
              pressure: data.pressure,
              rain_value: data.rainValue,
              rain_detected: data.rainDetected,
              forecast_rain: data.forecastRain
            }, null, 2)
          };
          
          setMqttMessages(prev => [message, ...prev.slice(0, 49)]); // Keep last 50 messages
        }
      });
    }
  }, [deviceData]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400';
      case 'connecting': return 'text-yellow-400';
      case 'disconnected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="h-4 w-4" />;
      case 'connecting': return <Activity className="h-4 w-4 animate-pulse" />;
      case 'disconnected': return <WifiOff className="h-4 w-4" />;
      default: return <WifiOff className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">MQTT Debug Panel</h3>
          <div className={`flex items-center gap-2 ${getConnectionStatusColor()}`}>
            {getConnectionStatusIcon()}
            <span className="text-sm font-medium capitalize">{connectionStatus}</span>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
        >
          {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <span className="text-sm">{isExpanded ? 'Hide' : 'Show'} Debug</span>
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* MQTT Configuration Info */}
          <div className="bg-white/5 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-white/90 mb-3">MQTT Configuration</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-white/70">Backend:</span>
                <span className={`ml-2 ${backendConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {backendConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div>
                <span className="text-white/70">Connection:</span>
                <span className="text-white ml-2">Backend WebSocket → MQTT Broker</span>
              </div>
              <div>
                <span className="text-white/70">Topic Pattern:</span>
                <span className="text-white ml-2">rain_forecasting/+/data</span>
              </div>
              <div>
                <span className="text-white/70">Subscribed Topics:</span>
                <span className="text-white ml-2">{devices.length} device(s)</span>
              </div>
              <div>
                <span className="text-white/70">Messages Received:</span>
                <span className="text-white ml-2">{mqttMessages.length}</span>
              </div>
            </div>
          </div>

          {/* Device Topics */}
          <div className="bg-white/5 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-white/90 mb-3">Device Topics</h4>
            <div className="space-y-2">
              {devices.map(device => (
                <div key={device.deviceId} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <div>
                    <span className="text-white/70 text-sm">Device:</span>
                    <span className="text-white ml-2 font-mono text-sm">{device.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/70 text-sm">Topic:</span>
                    <code className="text-blue-300 text-xs bg-white/10 px-2 py-1 rounded">
                      rain_forecasting/{device.deviceId}/data
                    </code>
                    <button
                      onClick={() => copyToClipboard(`rain_forecasting/${device.deviceId}/data`)}
                      className="text-white/50 hover:text-white transition-colors"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent MQTT Messages */}
          <div className="bg-white/5 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-white/90 mb-3">Recent MQTT Messages</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {mqttMessages.length === 0 ? (
                <div className="text-center py-8 text-white/50">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-white/30" />
                  <p className="text-sm">No MQTT messages received yet</p>
                </div>
              ) : (
                mqttMessages.map((message) => (
                  <div key={message.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/70">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-xs text-blue-300 font-mono">
                          {message.topic}
                        </span>
                      </div>
                      <button
                        onClick={() => setShowRawPayload(prev => ({
                          ...prev,
                          [message.id]: !prev[message.id]
                        }))}
                        className="text-white/50 hover:text-white transition-colors"
                      >
                        {showRawPayload[message.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                    </div>
                    
                    {showRawPayload[message.id] ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/70">Raw JSON Payload:</span>
                          <button
                            onClick={() => copyToClipboard(message.rawPayload)}
                            className="text-white/50 hover:text-white transition-colors"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                        <pre className="text-xs text-green-300 bg-black/20 p-2 rounded overflow-x-auto">
                          {message.rawPayload}
                        </pre>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-white/70">Temp:</span>
                          <span className="text-white ml-1">{message.payload.temperature}°C</span>
                        </div>
                        <div>
                          <span className="text-white/70">Humidity:</span>
                          <span className="text-white ml-1">{message.payload.humidity}%</span>
                        </div>
                        <div>
                          <span className="text-white/70">Pressure:</span>
                          <span className="text-white ml-1">{message.payload.pressure} hPa</span>
                        </div>
                        <div>
                          <span className="text-white/70">Rain:</span>
                          <span className="text-white ml-1">
                            {message.payload.rain_detected ? '🌧️' : message.payload.forecast_rain ? '☁️' : '☀️'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* MQTT Payload Structure */}
          <div className="bg-white/5 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-white/90 mb-3">Expected Payload Structure</h4>
            <div className="space-y-2">
              <div className="text-xs text-white/70 mb-2">From ESP32 to MQTT Broker:</div>
              <pre className="text-xs text-green-300 bg-black/20 p-3 rounded overflow-x-auto">
{`{
  "device_id": "025dfe862f858c4d",
  "temperature": 28.5,
  "humidity": 65.2,
  "pressure": 1013.25,
  "rain_value": 2500,
  "rain_detected": false,
  "forecast_rain": true
}`}
              </pre>
              <div className="text-xs text-white/70 mt-2">
                <strong>Topic:</strong> rain_forecasting/{`{deviceId}`}/data<br/>
                <strong>Frequency:</strong> Every 2 seconds<br/>
                <strong>QoS:</strong> 0 (At most once)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MQTTDebugPanel;
