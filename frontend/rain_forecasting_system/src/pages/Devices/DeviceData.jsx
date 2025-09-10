import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/userContext';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { Thermometer, Droplets, Wind, CloudRain, Wifi, Clock, RefreshCw, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { API_BASE_URL, MQTT_CONFIG } from '../../utils/apiPaths';
import mqttService from '../../utils/mqttService';
import MQTTDebugPanel from '../../components/MQTTDebugPanel';

const DeviceData = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceData, setDeviceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [mqttClient, setMqttClient] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({});
  const [backendConnected, setBackendConnected] = useState(false);
  const [mqttInitialized, setMqttInitialized] = useState(false);

  useEffect(() => {
    // Check authentication on component mount
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      toast.error('Session expired. Please login again.');
      navigate('/login');
      return;
    }
    
    // Parse and validate user data
    try {
      JSON.parse(storedUser);
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
      return;
    }
    
    // Fetch devices - MQTT will be initialized after devices are fetched
    fetchDevices();
    
    return () => {
      // Clear any polling interval if it exists
      if (mqttClient && mqttClient.interval) {
        clearInterval(mqttClient.interval);
      }
      
      // Unsubscribe and disconnect from MQTT if using direct MQTT
      if (mqttClient && mqttClient.service) {
        // Unsubscribe from all device topics
        if (mqttClient.subscriptions) {
          Object.keys(mqttClient.subscriptions).forEach(deviceId => {
            mqttClient.service.unsubscribeFromDevice(deviceId);
          });
        }
        
        // Disconnect from MQTT broker
        mqttClient.service.disconnect();
      }
      
      // Reset MQTT initialization state
      setMqttInitialized(false);
    };
  }, [navigate, mqttClient]);

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Check if token exists
      if (!token) {
        toast.error('Authentication token missing. Please login again.');
        navigate('/login');
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/devices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDevices(response.data.data);
      setLoading(false);
      setBackendConnected(true);
      
      // Initialize connection status for all devices
      const status = {};
      response.data.data.forEach(device => {
        status[device.deviceId] = isDeviceOnline(device.lastDataReceived);
      });
      setConnectionStatus(status);
      
      // If we have devices, initialize MQTT
      if (response.data.data.length > 0 && !mqttInitialized) {
        initializeMQTT();
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      setBackendConnected(false);
      
      // Handle 401 Unauthorized errors
      if (error.response && error.response.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        toast.error('Failed to fetch devices - Backend not available');
      }
      
      setLoading(false);
    }
  };

  const fetchRealtimeData = async () => {
    try {
      // First check if we have devices and backend connection
      if (devices.length === 0 || !backendConnected) return;
      
      const token = localStorage.getItem('token');
      
      // Check if token exists
      if (!token) {
        console.error('Authentication token missing');
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/devices/realtime-data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setDeviceData(response.data.data);
        
        // Update connection status based on last update time
        const status = {};
        Object.keys(response.data.data).forEach(deviceId => {
          const data = response.data.data[deviceId];
          status[deviceId] = data.lastUpdate ? isDeviceOnline(data.lastUpdate) : false;
        });
        setConnectionStatus(status);
      }
    } catch (error) {
      // Only log the error once, don't spam the console
      if (!error.logged) {
        console.error('Error fetching realtime data:', error);
        error.logged = true;
      }
      
      // Handle 401 Unauthorized errors
      if (error.response && error.response.status === 401) {
        // Only redirect to login if not already polling
        if (!mqttClient || !mqttClient.interval) {
          toast.error('Session expired. Please login again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
      } 
      // Don't show toast for network errors to avoid spamming
      else if (error.message !== 'Network Error' && error.code !== 'ERR_NETWORK') {
        toast.error('Error fetching real-time data');
      }
    }
  };

  const initializeMQTT = () => {
    try {
      if (mqttInitialized) return; // Prevent multiple initializations
      
      console.log('Starting MQTT connection...');
      setMqttInitialized(true);
      
      // Connect to MQTT broker
      mqttService.connect();
      
      // Subscribe to each device's MQTT topic
      const deviceSubscriptions = {};
      
      devices.forEach(device => {
        const topic = mqttService.subscribeToDevice(device.deviceId, (message) => {
          // Handle incoming MQTT message
          console.log(`Received MQTT data for device ${device.deviceId}:`, message);
          
          // Update device data in state
          setDeviceData(prevData => ({
            ...prevData,
            [device.deviceId]: {
              name: device.name,
              temperature: message.temperature,
              humidity: message.humidity,
              pressure: message.pressure,
              rainValue: message.rain_value,
              rainDetected: message.rain_detected === 'true' || message.rain_detected === true,
              forecastRain: message.forecast_rain === 'true' || message.forecast_rain === true,
              lastUpdate: new Date().toISOString()
            }
          }));
          
          // Update connection status
          setConnectionStatus(prevStatus => ({
            ...prevStatus,
            [device.deviceId]: true
          }));
          
          // Update device last data received on server
          mqttService.updateDeviceDataReceived(device.deviceId)
            .catch(err => console.error('Error updating device data received:', err));
        });
        
        deviceSubscriptions[device.deviceId] = topic;
      });
      
      // Store MQTT client and subscriptions for cleanup
      setMqttClient({
        service: mqttService,
        subscriptions: deviceSubscriptions
      });
      
      // Also fetch initial data from API to populate the UI faster
      fetchRealtimeData();
      
      // Only show success message once
      if (!mqttClient) {
        toast.success('MQTT real-time monitoring started');
      }
    } catch (error) {
      console.error('Error initializing MQTT monitoring:', error);
      toast.error('Failed to start MQTT monitoring');
      
      // Fallback to HTTP polling if MQTT fails (only if backend is connected)
      if (backendConnected) {
        console.log('Falling back to HTTP polling...');
        const interval = setInterval(fetchRealtimeData, 5000);
        setMqttClient({ interval });
      } else {
        console.log('Backend not connected, skipping HTTP polling fallback');
      }
    }
  };

  const updateDeviceLastDataReceived = async (deviceId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/devices/${deviceId}/data-received`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error updating device last data received:', error);
    }
  };

  const isDeviceOnline = (lastDataReceived) => {
    if (!lastDataReceived) return false;
    const lastUpdate = new Date(lastDataReceived);
    const now = new Date();
    const diffMinutes = (now - lastUpdate) / (1000 * 60);
    return diffMinutes < 5;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  const getRainStatus = (rainDetected, forecastRain) => {
    if (rainDetected) {
      return { text: 'Raining', color: 'text-blue-600', icon: '🌧️' };
    } else if (forecastRain) {
      return { text: 'Rain Forecast', color: 'text-yellow-600', icon: '☁️' };
    } else {
      return { text: 'Clear', color: 'text-green-600', icon: '☀️' };
    }
  };

  return (
    <DashboardLayout activeMenu="DeviceManagement">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-100">Device Data Monitor</h1>
            <p className="text-blue-300">Real-time monitoring of IoT device data and status.</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
        
        {/* MQTT Debug Panel */}
        <MQTTDebugPanel 
          mqttClient={mqttClient} 
          devices={devices} 
          deviceData={deviceData}
          backendConnected={backendConnected}
        />

        {/* Device Selector */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
          <label className="block text-sm font-medium text-white/90 mb-3">
            Select Device to Monitor
          </label>
          <select
            value={selectedDevice?.deviceId || ''}
            onChange={(e) => {
              const device = devices.find(d => d.deviceId === e.target.value);
              setSelectedDevice(device);
            }}
            className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 hover:bg-white/15"
          >
            <option value="" className="bg-slate-800 text-white">All Devices</option>
            {devices.map(device => (
              <option key={device.deviceId} value={device.deviceId} className="bg-slate-800 text-white">
                {device.name} ({device.deviceId})
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-300"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(selectedDevice ? [selectedDevice] : devices).map(device => {
              const data = deviceData[device.deviceId];
              const isOnline = connectionStatus[device.deviceId];
              const rainStatus = data ? getRainStatus(data.rain_detected === 'true', data.forecast_rain === 'true') : null;
              
              return (
                <div key={device.deviceId} className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{device.name}</h3>
                      <p className="text-sm text-blue-300 font-mono">{device.deviceId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOnline ? (
                        <span className="text-green-400 animate-pulse" title="Online">
                          <Wifi className="h-5 w-5" />
                        </span>
                      ) : (
                        <span className="text-gray-400" title="Offline">
                          <Wifi className="h-5 w-5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {data ? (
                    <>
                      {/* Rain Status */}
                      <div className="mb-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white/90">Rain Status</span>
                          <div className={`flex items-center gap-2 ${rainStatus.color}`}>
                            <span className="text-2xl">{rainStatus.icon}</span>
                            <span className="font-semibold">{rainStatus.text}</span>
                          </div>
                        </div>
                      </div>

                      {/* Sensor Data */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-3 text-white/80">
                            <Thermometer className="h-5 w-5 text-orange-400" />
                            <span className="text-sm font-medium">Temperature</span>
                          </div>
                          <span className="font-semibold text-white">{data.temperature?.toFixed(1)}°C</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-3 text-white/80">
                            <Droplets className="h-5 w-5 text-blue-400" />
                            <span className="text-sm font-medium">Humidity</span>
                          </div>
                          <span className="font-semibold text-white">{data.humidity?.toFixed(1)}%</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-3 text-white/80">
                            <Wind className="h-5 w-5 text-cyan-400" />
                            <span className="text-sm font-medium">Pressure</span>
                          </div>
                          <span className="font-semibold text-white">{data.pressure?.toFixed(1)} hPa</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-3 text-white/80">
                            <CloudRain className="h-5 w-5 text-purple-400" />
                            <span className="text-sm font-medium">Rain Sensor</span>
                          </div>
                          <span className="font-semibold text-white">{data.rain_value}</span>
                        </div>
                      </div>

                      {/* Last Update */}
                      <div className="mt-6 pt-4 border-t border-white/20">
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <Clock className="h-4 w-4" />
                          <span>Last update: {formatTimestamp(data.timestamp)}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-white/60">
                      <Activity className="h-12 w-12 mx-auto mb-3 text-white/40" />
                      <p className="mb-2 text-white/70">No data received yet</p>
                      <p className="text-xs text-white/50">Waiting for device to transmit...</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {devices.length === 0 && !loading && (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 text-center">
            <Activity className="h-16 w-16 mx-auto mb-4 text-white/40" />
            <p className="text-white/70 mb-4">No devices registered yet.</p>
            <a href="/dashboard/admin/devices/manage" className="text-blue-400 hover:text-blue-300 underline transition-colors">
              Go to Device Management to add devices
            </a>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DeviceData;
