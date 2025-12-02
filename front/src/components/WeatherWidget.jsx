import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  Thermometer, 
  Droplets, 
  Wind, 
  Eye,
  Sunrise,
  Sunset,
  RefreshCw
} from 'lucide-react';
import { API_BASE } from '../config';

const WeatherWidget = ({ city = null, className = '' }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Get weather icon based on OpenWeatherMap icon code
  const getWeatherIcon = (iconCode, size = 48) => {
    const iconMap = {
      '01d': Sun,        // clear sky day
      '01n': Sun,        // clear sky night
      '02d': Cloud,      // few clouds day
      '02n': Cloud,      // few clouds night
      '03d': Cloud,      // scattered clouds
      '03n': Cloud,      // scattered clouds
      '04d': Cloud,      // broken clouds
      '04n': Cloud,      // broken clouds
      '09d': CloudRain,  // shower rain
      '09n': CloudRain,  // shower rain
      '10d': CloudRain,  // rain day
      '10n': CloudRain,  // rain night
      '11d': CloudRain,  // thunderstorm
      '11n': CloudRain,  // thunderstorm
      '13d': Cloud,      // snow
      '13n': Cloud,      // snow
      '50d': Cloud,      // mist
      '50n': Cloud,      // mist
    };

    const IconComponent = iconMap[iconCode] || Cloud;
    return <IconComponent size={size} className="text-blue-600" />;
  };

  // Fetch weather data
  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const url = new URL(`${API_BASE}/api/weather/current`);
      if (city) {
        url.searchParams.append('city', city);
      }
      url.searchParams.append('units', 'metric');
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'success') {
        setWeather(data.weather);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch weather data');
      }
    } catch (err) {
      setError('Unable to connect to weather service');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and setup refresh interval
  useEffect(() => {
    fetchWeather();
    
    // Refresh weather every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [city]);

  // Loading state
  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-lg ${className}`}>
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="animate-spin text-blue-600" size={20} />
          <span className="text-blue-700 font-medium">Loading weather...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 shadow-lg ${className}`}>
        <div className="text-center">
          <Cloud className="mx-auto text-red-400 mb-2" size={32} />
          <h3 className="text-red-700 font-semibold mb-1">Weather Unavailable</h3>
          <p className="text-red-600 text-sm mb-3">{error}</p>
          <button
            onClick={fetchWeather}
            className="flex items-center space-x-1 mx-auto px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            <RefreshCw size={14} />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  // Main weather display
  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 shadow-lg border border-blue-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Weather</h3>
          <p className="text-sm text-gray-600">
            {weather.city}, {weather.country}
          </p>
        </div>
        <button
          onClick={fetchWeather}
          className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          title="Refresh weather"
        >
          <RefreshCw size={16} className="text-blue-600" />
        </button>
      </div>

      {/* Main weather info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getWeatherIcon(weather.weather.icon, 48)}
          <div>
            <div className="text-3xl font-bold text-gray-800">
              {weather.temperature.current}°C
            </div>
            <div className="text-sm text-gray-600 capitalize">
              {weather.weather.description}
            </div>
          </div>
        </div>
        <div className="text-right text-sm text-gray-600">
          <div>H: {weather.temperature.max}°</div>
          <div>L: {weather.temperature.min}°</div>
        </div>
      </div>

      {/* Weather details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <Droplets size={16} className="text-blue-500" />
          <span className="text-sm text-gray-700">
            {weather.humidity.value}%
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Wind size={16} className="text-blue-500" />
          <span className="text-sm text-gray-700">
            {weather.wind.speed} {weather.wind.unit}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Thermometer size={16} className="text-blue-500" />
          <span className="text-sm text-gray-700">
            {weather.pressure.value} {weather.pressure.unit}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Cloud size={16} className="text-blue-500" />
          <span className="text-sm text-gray-700">
            {weather.clouds.value}%
          </span>
        </div>
      </div>

      {/* Sun times */}
      <div className="flex items-center justify-between pt-3 border-t border-blue-200">
        <div className="flex items-center space-x-1">
          <Sunrise size={14} className="text-orange-500" />
          <span className="text-xs text-gray-600">
            {weather.sun.sunrise}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <Sunset size={14} className="text-orange-600" />
          <span className="text-xs text-gray-600">
            {weather.sun.sunset}
          </span>
        </div>
      </div>

      {/* Last updated */}
      {lastUpdated && (
        <div className="text-xs text-gray-500 text-center mt-2">
          Updated {lastUpdated.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;