import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/userContext';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { Thermometer, Droplets, Wind, CloudRain, Wifi, Clock, RefreshCw, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { API_BASE_URL, MQTT_CONFIG } from '../../utils/apiPaths';
import mqttDirectService from '../../utils/mqttDirectService'; // Changed to direct MQTT

const DeviceData = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceData, setDeviceData] = useState(() => {
    // Initialize with data from localStorage if available
    const savedData = localStorage.getItem('deviceData');
    return savedData ? JSON.parse(savedData) : {};
  });
  const [loading, setLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);
  const [mqttConnected, setMqttConnected] = useState(false);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Session expired. Please login again.');
      navigate('/login');
      return;
    }

    // Fetch devices and initialize MQTT
    fetchDevices();

    // Setup MQTT connection status listener
    mqttDirectService.onConnectionChange((connected, error) => {
      setMqttConnected(connected);
      if (connected) {
        console.log('MQTT connected successfully');
      } else if (error) {
        console.error('MQTT connection error:', error);
      }
    });

    // Periodically refresh backend device status every 30 seconds
    const interval = setInterval(() => {
      fetchAllDevicesLastData();
    }, 30000);

    return () => {
      clearInterval(interval);
      // Cleanup: unsubscribe from all topics
      devices.forEach(device => {
        mqttDirectService.unsubscribeFromDevice(device.deviceId);
      });
      // Save current data to localStorage before unmounting
      localStorage.setItem('deviceData', JSON.stringify(deviceData));
    };
  }, [navigate]);

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/devices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDevices(response.data.data);
      setBackendConnected(true);
      
      // Initialize MQTT for each device
      response.data.data.forEach(device => {
        initializeDeviceMQTT(device.deviceId);
      });
      
      // Fetch last known data for all devices from backend
      fetchAllDevicesLastData();
      
    } catch (error) {
      console.error('Error fetching devices:', error);
      setBackendConnected(false);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch last known data for all devices and merge with localStorage
  const fetchAllDevicesLastData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/devices/last-data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        // Merge with existing data from localStorage
        setDeviceData(prevData => {
          const merged = { ...response.data.data, ...prevData };
          localStorage.setItem('deviceData', JSON.stringify(merged));
          return merged;
        });
      }
    } catch (error) {
      console.error('Error fetching all devices last data:', error);
      // Not critical, so don't show error to user
    }
  };

  // fetchLastKnownData is now replaced by fetchAllDevicesLastData above.
  // (left empty for clarity or can be removed)
  const fetchLastKnownData = () => {};

  const initializeDeviceMQTT = (deviceId) => {
    console.log(`🔧 Initializing MQTT for device: ${deviceId}`);
    
    mqttDirectService.subscribeToDevice(deviceId, (message, topic, receivedDeviceId) => {
      console.log(`🎯 MQTT callback triggered for device ${receivedDeviceId}:`, message);
      // Update device data with timestamp
      const now = new Date().toISOString();
      const newData = {
        ...message,
        lastUpdate: now,
        timestamp: now,
        _fromMqtt: true // Add a flag for UI badge
      };
      
      setDeviceData(prevData => {
        const updatedData = {
          ...prevData,
          [receivedDeviceId]: newData
        };
        localStorage.setItem('deviceData', JSON.stringify(updatedData));
        return updatedData;
      });
      
      // Update device last data received on server
      updateDeviceLastDataReceived(receivedDeviceId);
    });
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

  // Determine if device is online based on lastUpdate or timestamp
  const isDeviceOnline = (data) => {
    if (!data) return false;
    const last = data.lastUpdate || data.timestamp;
    if (!last) return false;
    const lastUpdate = new Date(last);
    const now = new Date();
    const diffSeconds = (now - lastUpdate) / 1000;
    return diffSeconds < 30;
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
        {/* Connection Status Badge */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-100">Device Data Monitor</h1>
            <p className="text-blue-300">Real-time monitoring of IoT device data and status.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              mqttConnected 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              MQTT: {mqttConnected ? 'Connected' : 'Disconnected'}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              backendConnected 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              API: {backendConnected ? 'Connected' : 'Disconnected'}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
        

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
              const isOnline = isDeviceOnline(data);
              const rainStatus = data ? getRainStatus(data.rainDetected || data.rain_detected, data.forecastRain || data.forecast_rain) : null;
              
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
                        <>
                          <span className="text-gray-400" title="Offline">
                            <Wifi className="h-5 w-5" />
                          </span>
                          <span className="ml-2 px-2 py-1 rounded-full bg-red-700/30 text-red-300 text-xs font-bold">Offline</span>
                        </>
                      )}
                    </div>
                  </div>

                  {data && isOnline ? (
                    <>
                      {/* MQTT Badge */}
                      {data._fromMqtt && (
                        <div className="mb-2 px-3 py-1 rounded-full bg-green-700/30 text-green-300 text-xs font-bold inline-block">
                          LIVE FROM MQTT
                        </div>
                      )}
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
                      <p className="mb-2 text-white/70">Device is offline. No sensor data available.</p>
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
