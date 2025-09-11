import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/userContext';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { Download, Calendar, BarChart3, RefreshCw, FileText, TrendingUp, CloudRain, Thermometer, Droplets } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/apiPaths';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

import { useRef } from 'react';

const DeviceReports = () => {
  const backendDeviceMapRef = useRef({});
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('summary');

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
    
    fetchDevices();
  }, [navigate]);

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/devices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDevices(response.data.data);
    } catch (error) {
      console.error('Error fetching devices:', error);
      if (error.response && error.response.status === 401) {
        toast.error('Session expired or unauthorized. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        toast.error('Failed to fetch devices');
      }
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Prepare query parameters for historical data API
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };
      
      // Add device filter if not 'all'
      if (selectedDevice !== 'all') {
        params.deviceId = selectedDevice;
      }
      
      // Fetch historical sensor data from backend
      const response = await axios.get(`${API_BASE_URL}/devices/historical-data`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      if (!response.data.success) {
        throw new Error('Failed to fetch historical data');
      }
      
      const { records, stats, deviceMap } = response.data.data;
      
      // Process the data for reporting
      let devicesArr = [];
      
      // Group records by device for detailed view
      const deviceRecords = {};
      records.forEach(record => {
        if (!deviceRecords[record.deviceId]) {
          deviceRecords[record.deviceId] = [];
        }
        deviceRecords[record.deviceId].push(record);
      });
      
      // Create device array with latest data for each device
      Object.keys(deviceRecords).forEach(deviceId => {
        const deviceData = deviceRecords[deviceId];
        if (deviceData.length > 0) {
          // Sort by timestamp descending to get latest record
          deviceData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          const latestRecord = deviceData[0];
          
          // Add device info
          const deviceInfo = deviceMap[deviceId] || { name: deviceId, deviceId: deviceId };
          
          // Store device info in backendDeviceMapRef for later use
          backendDeviceMapRef.current[deviceId] = deviceInfo;
          
          devicesArr.push({
            deviceId: deviceId,
            name: deviceInfo.name,
            _id: deviceInfo._id,
            temperature: latestRecord.temperature,
            humidity: latestRecord.humidity,
            pressure: latestRecord.pressure,
            rain_value: latestRecord.rainValue,
            rainDetected: latestRecord.rainDetected,
            forecastRain: latestRecord.forecastRain,
            timestamp: latestRecord.timestamp,
            allRecords: deviceData // Keep all records for detailed view
          });
        }
      });
      
      // Merge with real-time MQTT data if available
      const localDataRaw = localStorage.getItem('deviceData');
      let localData = {};
      if (localDataRaw) {
        try {
          localData = JSON.parse(localDataRaw);
          
          // Update devices with real-time data
          devicesArr = devicesArr.map(device => {
            const liveData = localData[device.deviceId];
            if (liveData && liveData._fromMqtt) {
              return { ...device, ...liveData, hasLiveData: true };
            }
            return device;
          });
        } catch {}
      }
      
      // Calculate stats
      const now = new Date();
      const activeDevices = devicesArr.filter(d => {
        const last = d.lastUpdate || d.timestamp;
        if (!last) return false;
        const lastUpdate = new Date(last);
        return d.hasLiveData && (now - lastUpdate) / 1000 < 300;
      });
      
      // Prepare chart data
      const chartLabels = devicesArr.map(d => d.name || d.deviceId || '-');
      const temperatureData = devicesArr.map(d => d.temperature !== undefined ? d.temperature : null);
      const humidityData = devicesArr.map(d => d.humidity !== undefined ? d.humidity : null);
      const pressureData = devicesArr.map(d => d.pressure !== undefined ? d.pressure : null);
      const rainEvents = devicesArr.map(d => d.rainDetected ? 1 : 0);
      
      // Prepare time series data for charts
      const timeSeriesData = {};
      if (devicesArr.length > 0 && devicesArr[0].allRecords) {
        // Get all timestamps sorted chronologically
        const allTimestamps = [];
        devicesArr.forEach(device => {
          device.allRecords.forEach(record => {
            const timestamp = new Date(record.timestamp).toISOString().split('T')[0];
            if (!allTimestamps.includes(timestamp)) {
              allTimestamps.push(timestamp);
            }
          });
        });
        allTimestamps.sort();
        
        // Use raw timestamps from database records without any aggregation
        // First, collect all records from all devices
        const allRecords = [];
        devicesArr.forEach(device => {
          if (device.allRecords && device.allRecords.length > 0) {
            allRecords.push(...device.allRecords);
          }
        });
        
        // Sort all records by timestamp
        allRecords.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // Extract timestamps and data points directly from sorted records
        const exactTimestamps = allRecords.map(record => {
          const date = new Date(record.timestamp);
          return date.toLocaleString();
        });
        
        const temperaturePoints = allRecords.map(record => record.temperature);
        const humidityPoints = allRecords.map(record => record.humidity);
        const pressurePoints = allRecords.map(record => record.pressure);
        const rainPoints = allRecords.map(record => record.rainDetected ? 1 : 0);
        
        // Set time series data with exact points
        timeSeriesData.labels = exactTimestamps;
        timeSeriesData.temperature = temperaturePoints;
        timeSeriesData.humidity = humidityPoints;
        timeSeriesData.pressure = pressurePoints;
        timeSeriesData.rainEvents = rainPoints;
      }
      
      setReportData({
        summary: {
          totalDevices: devicesArr.length,
          activeDevices: activeDevices.length,
          totalRainEvents: stats.rainEvents,
          avgTemperature: stats.avgTemperature,
          avgHumidity: stats.avgHumidity,
          avgPressure: stats.avgPressure,
          totalRecords: stats.totalRecords,
          dateRange: `${dateRange.startDate} to ${dateRange.endDate}`
        },
        devices: devicesArr,
        chartData: {
          labels: chartLabels,
          temperatureData,
          humidityData,
          pressureData,
          rainEvents
        },
        timeSeriesData,
        deviceMap
      });
      
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      if (error.response && error.response.status === 401) {
        toast.error('Session expired or unauthorized. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        toast.error('Failed to generate report: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const generateMockReportData = () => {
    const days = Math.ceil((new Date(dateRange.endDate) - new Date(dateRange.startDate)) / (1000 * 60 * 60 * 24));
    const labels = [];
    const temperatureData = [];
    const humidityData = [];
    const rainEvents = [];
    
    for (let i = 0; i <= days; i++) {
      const date = new Date(dateRange.startDate);
      date.setDate(date.getDate() + i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      // Generate realistic weather data
      temperatureData.push(20 + Math.random() * 15);
      humidityData.push(40 + Math.random() * 40);
      rainEvents.push(Math.random() > 0.7 ? 1 : 0);
    }
    
    return {
      summary: {
        totalDevices: selectedDevice === 'all' ? devices.length : 1,
        activeDevices: devices.filter(d => d.isActive).length,
        totalRainEvents: rainEvents.reduce((a, b) => a + b, 0),
        avgTemperature: (temperatureData.reduce((a, b) => a + b, 0) / temperatureData.length).toFixed(1),
        avgHumidity: (humidityData.reduce((a, b) => a + b, 0) / humidityData.length).toFixed(1),
        dateRange: `${dateRange.startDate} to ${dateRange.endDate}`
      },
      chartData: {
        labels,
        temperatureData,
        humidityData,
        rainEvents
      }
    };
  };

  const downloadReport = () => {
    if (!reportData) {
      toast.error('Please generate a report first');
      return;
    }
    
    // Create CSV content
    const csvContent = generateCSVContent(reportData);
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `device-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Report downloaded successfully');
  };

  const generateCSVContent = (data) => {
    let csv = 'Device Report\n';
    csv += `Date Range,${data.summary.dateRange}\n`;
    csv += `Total Devices,${data.summary.totalDevices}\n`;
    csv += `Active Devices,${data.summary.activeDevices}\n`;
    csv += `Total Rain Events,${data.summary.totalRainEvents}\n`;
    csv += `Average Temperature,${data.summary.avgTemperature}°C\n`;
    csv += `Average Humidity,${data.summary.avgHumidity}%\n\n`;
    
    csv += 'Daily Data\n';
    csv += 'Date,Temperature (°C),Humidity (%),Rain Event\n';
    
    data.chartData.labels.forEach((label, index) => {
      csv += `${label},${data.chartData.temperatureData[index].toFixed(1)},`;
      csv += `${data.chartData.humidityData[index].toFixed(1)},`;
      csv += `${data.chartData.rainEvents[index] ? 'Yes' : 'No'}\n`;
    });
    
    return csv;
  };

  const temperatureChartData = reportData && reportData.timeSeriesData && reportData.timeSeriesData.labels && reportData.timeSeriesData.temperature ? {
    labels: reportData.timeSeriesData.labels,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: reportData.timeSeriesData.temperature,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 5
      }
    ]
  } : null;

  const humidityChartData = reportData && reportData.timeSeriesData && reportData.timeSeriesData.labels && reportData.timeSeriesData.humidity ? {
    labels: reportData.timeSeriesData.labels,
    datasets: [
      {
        label: 'Humidity (%)',
        data: reportData.timeSeriesData.humidity,
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 5
      }
    ]
  } : null;

  const rainChartData = reportData && reportData.timeSeriesData && reportData.timeSeriesData.labels && reportData.timeSeriesData.rainEvents ? {
    labels: reportData.timeSeriesData.labels,
    datasets: [
      {
        label: 'Rain Events',
        data: reportData.timeSeriesData.rainEvents,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1
      }
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false
      },
      tooltip: {
        callbacks: {
          title: function(tooltipItems) {
            return tooltipItems[0].label;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 20
        }
      },
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <DashboardLayout activeMenu="DeviceManagement">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-100">Device Reports</h1>
<p className="text-blue-300">Generate comprehensive historical reports and analytics for your IoT devices. Data shown below is live and based on the latest device transmissions.</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
        
        {/* Report Configuration */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Report Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">
                Device
              </label>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 hover:bg-white/15"
              >
                <option value="all" className="bg-slate-800 text-white">All Devices</option>
                {devices.map(device => (
                  <option key={device._id} value={device.deviceId} className="bg-slate-800 text-white">
                    {device.name || device.deviceId}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 hover:bg-white/15"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 hover:bg-white/15"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 hover:bg-white/15"
              >
                <option value="summary" className="bg-slate-800 text-white">Summary</option>
                <option value="detailed" className="bg-slate-800 text-white">Detailed</option>
                <option value="charts" className="bg-slate-800 text-white">Charts Only</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-4 mt-6">
            <button
              onClick={generateReport}
              disabled={loading}
              className={`flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 hover:from-blue-700 hover:via-sky-700 hover:to-cyan-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-blue-500/25 transform hover:-translate-y-1 ${loading ? 'opacity-70 cursor-not-allowed transform-none' : ''}`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
            
            {reportData && (
              <button
                onClick={downloadReport}
                className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-green-500/25 transform hover:-translate-y-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </button>
            )}
          </div>
        </div>

        {/* Report Results */}
        {reportData && (
  <>
    {/* Summary Cards */}
    {(reportType === 'summary' || reportType === 'detailed') && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300">
          <div className="text-white/70 text-sm mb-2">Total Devices</div>
          <div className="text-2xl font-bold text-white">
            {reportData.summary.totalDevices}
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300">
          <div className="text-white/70 text-sm mb-2">Active Devices</div>
          <div className="text-2xl font-bold text-green-400">
            {reportData.summary.activeDevices}
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300">
          <div className="text-white/70 text-sm mb-2 flex items-center gap-2">Rain Events
            <span title="Number of times rain was detected by any device in the selected period. Based on rain sensor value < 2000.">
              <CloudRain className="inline h-4 w-4 text-blue-400" />
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {reportData.summary.totalRainEvents}
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300">
          <div className="text-white/70 text-sm mb-2 flex items-center gap-2">Avg Temperature
            <span title="Average temperature recorded by devices during the selected period.">
              <Thermometer className="inline h-4 w-4 text-orange-400" />
            </span>
          </div>
          <div className="text-2xl font-bold text-orange-400">
            {reportData.summary.avgTemperature}°C
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300">
          <div className="text-white/70 text-sm mb-2 flex items-center gap-2">Avg Humidity
            <span title="Average humidity recorded by devices during the selected period.">
              <Droplets className="inline h-4 w-4 text-cyan-400" />
            </span>
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            {reportData.summary.avgHumidity}%
          </div>
        </div>
      </div>
    )}
    {/* Per-device live data table */}
    {reportData.devices && reportData.devices.length > 0 && (
      <div className="overflow-x-auto rounded-xl shadow border border-white/10 mb-8">
        <table className="min-w-full bg-white/5 text-white/90">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Device Name</th>
              <th className="px-4 py-2 text-left">Device ID</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Temperature (°C)</th>
              <th className="px-4 py-2 text-left">Humidity (%)</th>
              <th className="px-4 py-2 text-left">Pressure (hPa)</th>
              <th className="px-4 py-2 text-left">Rain Sensor</th>
              <th className="px-4 py-2 text-left">Rain/Forecast</th>
              <th className="px-4 py-2 text-left">MQTT</th>
              <th className="px-4 py-2 text-left">Last Update</th>
            </tr>
          </thead>
          <tbody>
            {reportData.devices.map((device, idx) => {
              // Always use backendDeviceMapRef for name and deviceId
              const backendDevice = backendDeviceMapRef.current[device.deviceId] || {};
              const deviceName = backendDevice.name || '-';
              const deviceId = backendDevice.deviceId || '-';
              const last = device.lastUpdate || device.timestamp;
              const now = new Date();
              const isOnline = last && (now - new Date(last)) / 1000 < 300;
              let rainStatus = 'Clear', rainColor = 'text-green-400', rainIcon = '☀️';
              if (device.rainDetected || device.rain_detected) {
                rainStatus = 'Raining'; rainColor = 'text-blue-400'; rainIcon = '🌧️';
              } else if (device.forecastRain || device.forecast_rain) {
                rainStatus = 'Rain Forecast'; rainColor = 'text-yellow-400'; rainIcon = '☁️';
              }
              return (
                <tr key={deviceId || idx} className="border-t border-white/10">
                  <td className="px-4 py-2 font-semibold">{device.name || deviceName}</td>
                  <td className="px-4 py-2 font-mono">{device.deviceId || deviceId}</td>
                  <td className="px-4 py-2">
                    {isOnline ? <span className="px-2 py-1 rounded-full bg-green-700/30 text-green-300 text-xs font-bold">Online</span>
                      : <span className="px-2 py-1 rounded-full bg-red-700/30 text-red-300 text-xs font-bold">Offline</span>}
                  </td>
                  <td className="px-4 py-2">{device.temperature !== undefined ? device.temperature.toFixed(1) : '-'}</td>
                  <td className="px-4 py-2">{device.humidity !== undefined ? device.humidity.toFixed(1) : '-'}</td>
                  <td className="px-4 py-2">{device.pressure !== undefined ? device.pressure.toFixed(1) : '-'}</td>
                  <td className="px-4 py-2">{device.rain_value !== undefined ? device.rain_value : '-'}</td>
                  <td className={`px-4 py-2 font-semibold ${rainColor}`}>{rainIcon} {rainStatus}</td>
                  <td className="px-4 py-2">
  {device._fromMqtt ? (
    <span className="mb-2 px-3 py-1 rounded-full bg-green-700/30 text-green-300 text-xs font-bold inline-block">LIVE FROM MQTT</span>
  ) : (
    <span className="px-3 py-1 rounded-full bg-gray-700/30 text-gray-300 text-xs font-bold inline-block">No MQTT</span>
  )}
</td>
<td className="px-4 py-2 text-xs">{last ? new Date(last).toLocaleString() : 'Never'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}


            {/* Charts */}
            {(reportType === 'charts' || reportType === 'detailed') && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300">
  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
    <TrendingUp className="h-5 w-5 text-orange-400" />
    Temperature Trend
    <span className="text-xs text-white/60" title="Shows exact temperature readings (°C) at each timestamp for selected devices.">(?)</span>
  </h3>
  {temperatureChartData && (
    <Line data={temperatureChartData} options={chartOptions} />
  )}
</div>
                
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300">
  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
    <TrendingUp className="h-5 w-5 text-blue-400" />
    Humidity Trend
    <span className="text-xs text-white/60" title="Shows exact humidity readings (%) at each timestamp for selected devices.">(?)</span>
  </h3>
  {humidityChartData && (
    <Line data={humidityChartData} options={chartOptions} />
  )}
</div>
                
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 lg:col-span-2 hover:bg-white/10 transition-all duration-300">
  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
    <BarChart3 className="h-5 w-5 text-purple-400" />
    Rain Events
    <span className="text-xs text-white/60" title="Shows rain events detected by rain sensors (rain value < 2000) at each exact timestamp.">(?)</span>
  </h3>
  {rainChartData && (
    <Bar data={rainChartData} options={chartOptions} />
  )}
</div>
              </div>
            )}
          </>
        )}

        {!reportData && !loading && (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 text-center">
            <FileText className="h-16 w-16 text-white/40 mx-auto mb-4" />
            <p className="text-white/70 mb-2">No report generated yet</p>
            <p className="text-sm text-white/50">Configure the parameters above and click Generate Report</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DeviceReports;
