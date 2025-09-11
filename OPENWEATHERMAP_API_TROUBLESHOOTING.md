# OpenWeatherMap API Key Troubleshooting Guide

## Issue Summary

You were experiencing a `401 Unauthorized` error when trying to fetch weather data from the OpenWeatherMap API. This error occurred because the API key you were using (`a8594d70d3e2fd6cf408a75767baec54` - named "MY api") was not working properly, while your other API key (`c0364703a9c30404a0fe103de43ee1cc` - named "Default") was working correctly.

## Solution Applied

We've updated your `.env` file to use the working API key (Default) instead of the non-working one (MY api).

```
VITE_OPENWEATHER_API_KEY=c0364703a9c30404a0fe103de43ee1cc
```

## Common Causes for 401 Unauthorized Errors with OpenWeatherMap

1. **API Key Activation Time**: New API keys can take up to 2 hours to activate after generation. This is the most likely reason your new key wasn't working.

2. **Invalid API Key**: The API key might be incorrect or improperly formatted.

3. **Subscription Limitations**: You might be trying to access features that aren't available in your subscription plan.

4. **API Key Not Specified**: The API key might not be included in the request.

## How to Verify API Key Status

You can test if your API key is working by making a direct request in your browser or using a tool like Postman:

```
https://api.openweathermap.org/data/2.5/weather?lat=-1.9441&lon=30.0619&units=metric&appid=YOUR_API_KEY
```

Replace `YOUR_API_KEY` with the API key you want to test.

## Troubleshooting Steps

1. **Wait for Activation**: If you've just created a new API key, wait at least 2 hours for it to activate.

2. **Check for Typos**: Ensure there are no typos or extra characters in your API key.

3. **Verify Environment Variables**: Make sure your environment variables are properly loaded and accessible to your application.

4. **Check API Limits**: Verify that you haven't exceeded your API call limits for your subscription plan.

5. **Try a Different API Key**: If you have multiple API keys, try using a different one to see if it works.

## Next Steps

If you still want to use your new API key ("MY api"), you can try the following:

1. Wait a few more hours for the key to activate.
2. Delete the key and create a new one.
3. Check your OpenWeatherMap account for any issues with your subscription.

Once your new key is working, you can update the `.env` file again to use it:

```
VITE_OPENWEATHER_API_KEY=your_new_working_api_key
```

## Additional Resources

- [OpenWeatherMap FAQ on 401 Errors](https://openweathermap.org/faq#error401)
- [OpenWeatherMap API Documentation](https://openweathermap.org/api)