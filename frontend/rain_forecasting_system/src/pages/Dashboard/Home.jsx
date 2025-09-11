import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useUserAuth } from '../../hooks/useUserAuth';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { CloudRain, Droplets, Thermometer, Wind, CloudLightning, Sun, AlertTriangle, CloudOff } from 'lucide-react';
import weatherService from '../../utils/weatherService';

const Home = () => {
  useUserAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);

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
  
  const fetchWeatherData = async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    
    try {
      // Fetch current weather for Kigali
      const currentWeather = await weatherService.getCurrentWeather();
      setWeatherData(currentWeather);
      
      // Fetch 5-day forecast
      const forecast = await weatherService.getForecast();
      setForecastData(forecast);
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      // Display a more specific error message if it's an API key issue
      if (error.message && (error.message.includes('API key') || error.message.includes('401'))) {
        setWeatherError(error.message || 'Invalid API key. Please check your OpenWeatherMap API key in the .env file.');
      } else {
        setWeatherError('Unable to load weather data. Please try again later.');
      }
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchWeatherData();
    
    // Refresh weather data every 30 minutes
    const weatherInterval = setInterval(fetchWeatherData, 30 * 60 * 1000);
    
    return () => {
      clearInterval(weatherInterval);
    };
  }, []);

  // Generate weather stats from real data
  const getWeatherStats = () => {
    if (!weatherData) return [];
    
    return [
      { 
        id: 'rainfall', 
        label: 'Rainfall', 
        value: `${weatherData.rainAmount ? weatherData.rainAmount.toFixed(1) : '0'}mm`, 
        icon: CloudRain, 
        color: 'blue' 
      },
      { 
        id: 'humidity', 
        label: 'Humidity', 
        value: `${weatherData.humidity}%`, 
        icon: Droplets, 
        color: 'cyan' 
      },
      { 
        id: 'temperature', 
        label: 'Temperature', 
        value: `${weatherData.temperature.toFixed(1)}°C`, 
        icon: Thermometer, 
        color: 'red' 
      },
      { 
        id: 'wind', 
        label: 'Wind Speed', 
        value: `${weatherData.windSpeed.toFixed(1)}km/h`, 
        icon: Wind, 
        color: 'gray' 
      },
    ];
  };

  // Process forecast data
  const getProcessedForecastData = () => {
    if (!forecastData || forecastData.length === 0) return [];
    
    // Get the next 5 forecast periods (typically 3-hour intervals)
    const nextFivePeriods = forecastData.slice(0, 5);
    
    return nextFivePeriods.map(period => {
      const date = new Date(period.timestamp);
      const day = date.toLocaleDateString('en-US', { weekday: 'short' });
      const hour = date.toLocaleTimeString('en-US', { hour: '2-digit', hour12: true });
      
      // Determine icon based on weather description
      let icon = Sun;
      if (period.description.includes('rain') || period.description.includes('drizzle')) {
        icon = CloudRain;
      } else if (period.description.includes('thunderstorm')) {
        icon = CloudLightning;
      } else if (period.description.includes('cloud')) {
        icon = CloudRain; // Using CloudRain as a substitute for clouds
      }
      
      return {
        day: `${day} ${hour}`,
        temp: Math.round(period.temperature),
        rain: Math.round(period.rainProbability),
        icon,
        description: period.description
      };
    });
  };

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-100">Weather Dashboard</h1>
          <p className="text-blue-300">Current weather conditions and forecasts</p>
        </div>

        {loading || weatherLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-300"></div>
          </div>
        ) : weatherError ? (
          <div className="bg-red-900 bg-opacity-30 border-l-4 border-red-500 rounded p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              <p className="font-medium text-red-300">Weather Data Error</p>
            </div>
            <p className="text-sm text-red-200 mt-1">{weatherError}</p>
          </div>
        ) : (
          <>
            {/* Weather Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {getWeatherStats().map((stat) => (
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
              <h2 className="text-lg font-semibold text-blue-100 mb-4">Weather Forecast for Kigali, Rwanda</h2>
              <div className="grid grid-cols-5 gap-2">
                {getProcessedForecastData().map((day, index) => (
                  <div key={index} className="text-center p-3 rounded-lg bg-slate-900 bg-opacity-50 border border-blue-900">
                    <p className="font-medium text-blue-200">{day.day}</p>
                    <day.icon className="h-8 w-8 mx-auto my-2 text-blue-300" />
                    <p className="text-lg font-bold text-blue-100">{day.temp}°C</p>
                    <p className="text-xs text-blue-300 mt-1 truncate" title={day.description}>{day.description}</p>
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

            {/* Weather Information */}
            <div className="bg-slate-800 bg-opacity-50 rounded-lg shadow-md p-4 border border-blue-800">
              <h2 className="text-lg font-semibold text-blue-100 mb-4">Current Weather in Kigali, Rwanda</h2>
              <div className="bg-slate-900 bg-opacity-50 rounded-lg p-6 border border-blue-900">
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="flex items-center mb-4 md:mb-0">
                    {weatherData && weatherData.icon ? (
                      <img 
                        src={weatherService.getWeatherIconUrl(weatherData.icon)} 
                        alt="Weather icon" 
                        className="w-20 h-20 mr-4"
                      />
                    ) : (
                      <div className="w-20 h-20 mr-4 flex items-center justify-center">
                        <CloudOff className="h-10 w-10 text-blue-300/50" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-2xl font-bold text-blue-100">{weatherData ? weatherData.temperature.toFixed(1) : '--'}°C</h3>
                      <p className="text-blue-300 capitalize">{weatherData ? weatherData.description : 'Loading weather data...'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-blue-400">Humidity</p>
                      <p className="text-lg text-blue-200">{weatherData ? weatherData.humidity : '--'}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-400">Pressure</p>
                      <p className="text-lg text-blue-200">{weatherData ? weatherData.pressure : '--'} hPa</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-400">Wind Speed</p>
                      <p className="text-lg text-blue-200">{weatherData ? weatherData.windSpeed.toFixed(1) : '--'} km/h</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-400">Last Updated</p>
                      <p className="text-lg text-blue-200">{weatherData ? new Date(weatherData.timestamp).toLocaleTimeString() : '--'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="bg-slate-800 bg-opacity-50 rounded-lg shadow-md p-4 border border-blue-800">
              <h2 className="text-lg font-semibold text-blue-100 mb-4">Recent Alerts</h2>
              <div className="space-y-3">
                {weatherData && weatherService.isRaining(weatherData) && (
                  <div className="p-3 bg-blue-900 bg-opacity-30 border-l-4 border-blue-500 rounded">
                    <div className="flex items-center">
                      <CloudRain className="h-5 w-5 text-blue-400 mr-2" />
                      <p className="font-medium text-blue-300">Current Rain Alert</p>
                    </div>
                    <p className="text-sm text-blue-200 mt-1">It is currently raining in Kigali, Rwanda</p>
                  </div>
                )}
                {forecastData && forecastData.length > 0 && weatherService.calculateRainProbability(forecastData) > 50 && (
                  <div className="p-3 bg-yellow-900 bg-opacity-30 border-l-4 border-yellow-500 rounded">
                    <div className="flex items-center">
                      <CloudLightning className="h-5 w-5 text-yellow-400 mr-2" />
                      <p className="font-medium text-yellow-300">Rain Forecast Alert</p>
                    </div>
                    <p className="text-sm text-yellow-200 mt-1">High probability of rain in the next 24 hours</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Home;