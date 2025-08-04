import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useUserAuth } from '../../hooks/useUserAuth';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { CloudRain, Droplets, Thermometer, Wind, CloudLightning, Sun } from 'lucide-react';

const Home = () => {
  useUserAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await axiosInstance.get(`${API_PATHS.DASHBOARD}`);
      if (response.data) {
        setDashboardData(response.data);
      } 
    } catch(error) {
      console.log("Something went wrong. Please try again.", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    return () => {};
  }, []);

  // Mock data for demonstration
  const weatherStats = [
    { id: 'rainfall', label: 'Rainfall', value: '32mm', icon: CloudRain, color: 'blue' },
    { id: 'humidity', label: 'Humidity', value: '72%', icon: Droplets, color: 'cyan' },
    { id: 'temperature', label: 'Temperature', value: '24°C', icon: Thermometer, color: 'red' },
    { id: 'wind', label: 'Wind Speed', value: '15km/h', icon: Wind, color: 'gray' },
  ];

  const forecastData = [
    { day: 'Mon', temp: 24, rain: 70, icon: CloudRain },
    { day: 'Tue', temp: 26, rain: 30, icon: CloudLightning },
    { day: 'Wed', temp: 28, rain: 10, icon: Sun },
    { day: 'Thu', temp: 25, rain: 60, icon: CloudRain },
    { day: 'Fri', temp: 23, rain: 80, icon: CloudRain },
  ];

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-100">Weather Dashboard</h1>
          <p className="text-blue-300">Current weather conditions and forecasts</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-300"></div>
          </div>
        ) : (
          <>
            {/* Weather Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {weatherStats.map((stat) => (
                <div key={stat.id} className="bg-slate-800 bg-opacity-50 rounded-lg shadow-md p-4 border border-blue-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-300">{stat.label}</p>
                      <p className="text-2xl font-bold text-blue-100">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full bg-blue-900 bg-opacity-50 border border-blue-700`}>
                      <stat.icon className={`h-6 w-6 text-blue-300`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 5-Day Forecast */}
            <div className="bg-slate-800 bg-opacity-50 rounded-lg shadow-md p-4 border border-blue-800">
              <h2 className="text-lg font-semibold text-blue-100 mb-4">5-Day Forecast</h2>
              <div className="grid grid-cols-5 gap-2">
                {forecastData.map((day, index) => (
                  <div key={index} className="text-center p-3 rounded-lg bg-slate-900 bg-opacity-50 border border-blue-900">
                    <p className="font-medium text-blue-200">{day.day}</p>
                    <day.icon className="h-8 w-8 mx-auto my-2 text-blue-300" />
                    <p className="text-lg font-bold text-blue-100">{day.temp}°C</p>
                    <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full" 
                        style={{ width: `${day.rain}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-blue-400 mt-1">{day.rain}% rain</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Rainfall Map Placeholder */}
            <div className="bg-slate-800 bg-opacity-50 rounded-lg shadow-md p-4 border border-blue-800">
              <h2 className="text-lg font-semibold text-blue-100 mb-4">Rainfall Map</h2>
              <div className="bg-slate-900 bg-opacity-50 rounded-lg h-64 flex items-center justify-center border border-blue-900">
                <p className="text-blue-300">Interactive rainfall map will be displayed here</p>
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="bg-slate-800 bg-opacity-50 rounded-lg shadow-md p-4 border border-blue-800">
              <h2 className="text-lg font-semibold text-blue-100 mb-4">Recent Alerts</h2>
              <div className="space-y-3">
                <div className="p-3 bg-yellow-900 bg-opacity-30 border-l-4 border-yellow-500 rounded">
                  <div className="flex items-center">
                    <CloudLightning className="h-5 w-5 text-yellow-400 mr-2" />
                    <p className="font-medium text-yellow-300">Thunderstorm Warning</p>
                  </div>
                  <p className="text-sm text-yellow-200 mt-1">Possible thunderstorms expected in the evening</p>
                </div>
                <div className="p-3 bg-blue-900 bg-opacity-30 border-l-4 border-blue-500 rounded">
                  <div className="flex items-center">
                    <CloudRain className="h-5 w-5 text-blue-400 mr-2" />
                    <p className="font-medium text-blue-300">Heavy Rain Alert</p>
                  </div>
                  <p className="text-sm text-blue-200 mt-1">Heavy rainfall expected in the next 24 hours</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Home;