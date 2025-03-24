import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, CloudSun, Wind, Snowflake, ThermometerSun, ThermometerSnowflake, Umbrella, MapPin, Calendar } from 'lucide-react';

const WeatherForecast = ({ farmId }) => {
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState("Ghana");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get user's location when component mounts
  useEffect(() => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setLocation(coords);
          
          // Get location name from coordinates
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m&timezone=auto&forecast_days=1`)
            .then(res => res.json())
            .then(data => {
              if (data.timezone_abbreviation) {
                setLocationName(data.timezone.split('/')[1].replace('_', ' '));
              }
            })
            .catch(() => {
              // Fallback to Ghana if reverse geocoding fails
              setLocationName("Ghana");
            });
          
          setLoading(false);
        },
        (err) => {
          // Default to central Ghana coordinates if user denies location
          setLocation({
            latitude: 7.9465,  // Central Ghana coordinates
            longitude: -1.0232
          });
          setLocationName("Ghana");
          setLoading(false);
        }
      );
    } else {
      // Default to central Ghana coordinates if geolocation not supported
      setLocation({
        latitude: 7.9465,
        longitude: -1.0232
      });
      setLocationName("Ghana");
      setLoading(false);
    }
  }, []);
  
  // Fetch weather data when location is available
  useEffect(() => {
    if (location) {
      fetchWeatherData();
    }
  }, [location]);
  
  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,uv_index_max&current_weather=true&timezone=auto`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch weather data");
      }
      
      const data = await response.json();
      setWeather(data);
      setLoading(false);
    } catch (err) {
      setError("Error fetching weather data. Please try again later.");
      setLoading(false);
    }
  };
  
  // Helper function to get weather icon based on weather code
  const getWeatherIcon = (code) => {
    // Weather codes from Open-Meteo API
    if (code === 0) return <Sun size={24} className="text-yellow-500" />; // Clear sky
    if (code <= 3) return <CloudSun size={24} className="text-gray-500" />; // Partly cloudy
    if (code <= 49) return <Cloud size={24} className="text-gray-500" />; // Foggy/cloudy
    if (code <= 69) return <CloudRain size={24} className="text-blue-500" />; // Rainy
    if (code <= 79) return <Snowflake size={24} className="text-blue-300" />; // Snowy
    if (code <= 99) return <Umbrella size={24} className="text-purple-500" />; // Thunderstorm
    return <Cloud size={24} className="text-gray-500" />; // Default
  };
  
  // Get weather condition text based on weather code
  const getWeatherCondition = (code) => {
    if (code === 0) return "Clear sky";
    if (code <= 3) return "Partly cloudy";
    if (code <= 49) return "Foggy/cloudy";
    if (code <= 69) return "Rainy";
    if (code <= 79) return "Snowy";
    if (code <= 99) return "Thunderstorm";
    return "Unknown";
  };
  
  // Format date to day of week
  const formatDay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };
  
  // Format date for header
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };
  
  if (loading && !weather) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading weather forecast...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }
  
  if (!weather) return null;
  
  return (
    <div className="p-6">
      <div className="flex items-center space-x-2 mb-6">
        <MapPin className="text-green-600" size={20} />
        <h3 className="text-lg font-medium text-gray-800">{locationName} Weather Forecast</h3>
      </div>
      
      {/* Current Weather Card */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 mb-6 border border-green-200">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center">
              <Calendar size={16} className="text-green-700 mr-2" />
              <p className="text-sm text-gray-600">{weather.daily && formatDate(weather.daily.time[0])}</p>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mt-2">Current Weather</h2>
            <p className="text-green-700 font-medium mt-1">
              {getWeatherCondition(weather.current_weather.weathercode)}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end">
              {getWeatherIcon(weather.current_weather.weathercode)}
              <span className="text-3xl ml-2 font-bold text-gray-800">{Math.round(weather.current_weather.temperature)}°C</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Wind: {weather.current_weather.windspeed} km/h</p>
          </div>
        </div>
      </div>
      
      {/* Farming Tip */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-700">Farming Tip</h3>
            <div className="mt-2 text-sm text-yellow-600">
              {weather.daily.precipitation_sum[0] > 5 ? 
                "Heavy rain expected. Consider postponing field activities that might be affected by wet conditions." : 
                weather.daily.precipitation_sum[0] > 0 ?
                "Light rain expected. Good conditions for planting if soil moisture was previously low." :
                "Dry conditions expected. Consider irrigation for young plants if needed."}
            </div>
          </div>
        </div>
      </div>
      
      {/* 7-Day Forecast */}
      <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
        <span className="mr-2">7-Day Forecast</span>
        <span className="text-xs text-gray-500 font-normal">(Plan your farm activities)</span>
      </h3>
      
      <div className="grid grid-cols-7 gap-2 overflow-x-auto pb-2">
        {weather.daily.time.map((day, index) => (
          <div key={day} className="bg-white rounded-lg border border-gray-100 shadow-sm p-3 text-center min-w-max">
            <p className="font-medium text-green-700">{formatDay(day)}</p>
            <div className="my-2">
              {getWeatherIcon(weather.daily.weathercode[index])}
            </div>
            <div className="flex justify-center items-center space-x-1">
              <ThermometerSun size={12} className="text-red-500" />
              <span className="text-xs text-gray-700">{Math.round(weather.daily.temperature_2m_max[index])}°</span>
            </div>
            <div className="flex justify-center items-center space-x-1">
              <ThermometerSnowflake size={12} className="text-blue-500" />
              <span className="text-xs text-gray-700">{Math.round(weather.daily.temperature_2m_min[index])}°</span>
            </div>
            <div className="flex justify-center items-center space-x-1 mt-1">
              <CloudRain size={12} className="text-blue-400" />
              <span className="text-xs text-gray-700">{weather.daily.precipitation_sum[index]} mm</span>
            </div>
            <div className="flex justify-center items-center space-x-1">
              <Wind size={12} className="text-gray-500" />
              <span className="text-xs text-gray-700">{Math.round(weather.daily.windspeed_10m_max[index])} km/h</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-xs text-gray-500 text-center">
        Data provided by Open-Meteo API • Updated {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default WeatherForecast;