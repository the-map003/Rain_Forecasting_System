import axios from 'axios';

// OpenWeatherMap API configuration
const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || 'a8594d70d3e2fd6cf408a75767baec54'; // Use environment variable

// Check if API key is set and valid
const isApiKeyConfigured = OPENWEATHER_API_KEY && OPENWEATHER_API_KEY !== 'your_new_api_key_here';
const KIGALI_COORDINATES = {
  lat: -1.9441,
  lon: 30.0619,
  city: 'Kigali',
  country: 'Rwanda'
};

/**
 * Weather Service for fetching real-time weather data for Kigali, Rwanda
 * using the OpenWeatherMap API
 */
const weatherService = {
  /**
   * Get current weather for Kigali, Rwanda
   * @returns {Promise} Promise that resolves to weather data
   */
  getCurrentWeather: async () => {
    // Check if API key is configured
    if (!isApiKeyConfigured) {
      throw new Error('OpenWeatherMap API key is not configured. Please add a valid API key to your .env file.');
    }
    
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${KIGALI_COORDINATES.lat}&lon=${KIGALI_COORDINATES.lon}&units=metric&appid=${OPENWEATHER_API_KEY}`
      );
      
      return {
        temperature: response.data.main.temp,
        humidity: response.data.main.humidity,
        pressure: response.data.main.pressure,
        windSpeed: response.data.wind.speed,
        description: response.data.weather[0].description,
        icon: response.data.weather[0].icon,
        city: KIGALI_COORDINATES.city,
        country: KIGALI_COORDINATES.country,
        timestamp: new Date().toISOString(),
        rainAmount: response.data.rain ? response.data.rain['1h'] || 0 : 0,
      };
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error('Error fetching current weather: Invalid API key');
        throw new Error('Invalid OpenWeatherMap API key. Please check your API key in the .env file.');
      }
      console.error('Error fetching current weather:', error);
      throw error;
    }
  },

  /**
   * Get 5-day weather forecast for Kigali, Rwanda
   * @returns {Promise} Promise that resolves to forecast data
   */
  getForecast: async () => {
    // Check if API key is configured
    if (!isApiKeyConfigured) {
      throw new Error('OpenWeatherMap API key is not configured. Please add a valid API key to your .env file.');
    }
    
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${KIGALI_COORDINATES.lat}&lon=${KIGALI_COORDINATES.lon}&units=metric&appid=${OPENWEATHER_API_KEY}`
      );
      
      // Process the forecast data to get daily forecasts
      const forecastData = response.data.list.map(item => ({
        timestamp: item.dt * 1000, // Convert to milliseconds
        temperature: item.main.temp,
        humidity: item.main.humidity,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        rainProbability: item.pop * 100, // Probability of precipitation (0-1) to percentage
        rainAmount: item.rain ? item.rain['3h'] || 0 : 0,
      }));
      
      return forecastData;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error('Error fetching weather forecast: Invalid API key');
        throw new Error('Invalid OpenWeatherMap API key. Please check your API key in the .env file.');
      }
      console.error('Error fetching weather forecast:', error);
      throw error;
    }
  },

  /**
   * Get weather icon URL from icon code
   * @param {string} iconCode - The icon code from OpenWeatherMap API
   * @returns {string} URL to the weather icon
   */
  getWeatherIconUrl: (iconCode) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  },

  /**
   * Format a timestamp to a readable date string
   * @param {number} timestamp - Timestamp in milliseconds
   * @returns {string} Formatted date string
   */
  formatDate: (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  },

  /**
   * Determine if it's currently raining based on weather data
   * @param {Object} weatherData - Current weather data
   * @returns {boolean} True if it's raining, false otherwise
   */
  isRaining: (weatherData) => {
    // Check if the weather description contains rain-related terms
    const rainTerms = ['rain', 'drizzle', 'shower'];
    return rainTerms.some(term => 
      weatherData.description.toLowerCase().includes(term)
    ) || weatherData.rainAmount > 0;
  },

  /**
   * Calculate rain forecast probability based on forecast data
   * @param {Array} forecastData - Weather forecast data
   * @returns {number} Percentage chance of rain (0-100)
   */
  calculateRainProbability: (forecastData) => {
    if (!forecastData || forecastData.length === 0) return 0;
    
    // Calculate average rain probability from forecast data
    const totalProbability = forecastData.reduce(
      (sum, item) => sum + item.rainProbability, 
      0
    );
    
    return Math.round(totalProbability / forecastData.length);
  }
};

export default weatherService;