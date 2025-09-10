import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/userContext';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { Download, Calendar, BarChart3, RefreshCw, FileText, TrendingUp } from 'lucide-react';
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

const DeviceReports = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
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
      toast.error('Failed to fetch devices');
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // For now, we'll generate mock data since we don't have a dedicated reports endpoint
      // In production, this would call a real API endpoint
      const mockData = generateMockReportData();
      setReportData(mockData);
      
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
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

  const temperatureChartData = reportData ? {
    labels: reportData.chartData.labels,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: reportData.chartData.temperatureData,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4,
        fill: true
      }
    ]
  } : null;

  const humidityChartData = reportData ? {
    labels: reportData.chartData.labels,
    datasets: [
      {
        label: 'Humidity (%)',
        data: reportData.chartData.humidityData,
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4,
        fill: true
      }
    ]
  } : null;

  const rainChartData = reportData ? {
    labels: reportData.chartData.labels,
    datasets: [
      {
        label: 'Rain Events',
        data: reportData.chartData.rainEvents,
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
      }
    },
    scales: {
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
            <p className="text-blue-300">Generate comprehensive reports and analytics for your IoT devices.</p>
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
                  <option key={device._id} value={device._id} className="bg-slate-800 text-white">
                    {device.name}
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
                  <div className="text-white/70 text-sm mb-2">Rain Events</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {reportData.summary.totalRainEvents}
                  </div>
                </div>
                
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300">
                  <div className="text-white/70 text-sm mb-2">Avg Temperature</div>
                  <div className="text-2xl font-bold text-orange-400">
                    {reportData.summary.avgTemperature}°C
                  </div>
                </div>
                
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300">
                  <div className="text-white/70 text-sm mb-2">Avg Humidity</div>
                  <div className="text-2xl font-bold text-cyan-400">
                    {reportData.summary.avgHumidity}%
                  </div>
                </div>
              </div>
            )}

            {/* Charts */}
            {(reportType === 'charts' || reportType === 'detailed') && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-400" />
                    Temperature Trend
                  </h3>
                  {temperatureChartData && (
                    <Line data={temperatureChartData} options={chartOptions} />
                  )}
                </div>
                
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-400" />
                    Humidity Trend
                  </h3>
                  {humidityChartData && (
                    <Line data={humidityChartData} options={chartOptions} />
                  )}
                </div>
                
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 lg:col-span-2 hover:bg-white/10 transition-all duration-300">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-400" />
                    Rain Events
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
