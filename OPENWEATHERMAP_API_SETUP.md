# OpenWeatherMap API Setup Guide

## Issue: 401 Unauthorized Error

You're experiencing a `401 Unauthorized` error when trying to fetch weather data. This is because the OpenWeatherMap API key being used is invalid or has expired.

## How to Fix

### 1. Create a Free OpenWeatherMap Account

1. Go to [OpenWeatherMap](https://openweathermap.org/)
2. Click on "Sign Up" in the top right corner
3. Complete the registration process with your email
4. Verify your email address via the confirmation link sent to you

### 2. Get Your API Key

1. After verification, log in to your OpenWeatherMap account
2. Navigate to your account page
3. Go to the "API keys" tab
4. You should see a default API key generated for you, or you can create a new one
5. Copy this API key

### 3. Update Your Application

1. Open the `.env` file in the frontend project root directory:
   ```
   d:\Projects\Rain_Forecasting_System\frontend\rain_forecasting_system\.env
   ```

2. Replace the placeholder API key with your own:
   ```
   # OpenWeatherMap API Key
   VITE_OPENWEATHER_API_KEY=your_actual_api_key_here
   ```

3. Save the file and restart the development server if it's already running

### 4. Important Notes

- The free tier of OpenWeatherMap allows up to 1,000 API calls per day
- New API keys may take a few hours (up to 2 hours) to activate after registration
- If you continue to see 401 errors after updating the key, please wait a couple of hours and try again

## Troubleshooting

If you still encounter issues after following these steps:

1. Verify that your API key is correctly copied without any extra spaces
2. Check if your API key has been activated (it can take up to 2 hours)
3. Ensure the development server has been restarted after updating the .env file
4. Check the browser console for specific error messages

For more information, visit the [OpenWeatherMap API documentation](https://openweathermap.org/api).