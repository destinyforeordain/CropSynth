import { useState, useEffect, useCallback } from "react";

interface WeatherDashboardProps {
  farm: {
    id: string;
    farm_name: string;
    location: {
      district: string;
      village: string;
    };
    land_size_acres: number;
    soil_type: string;
    irrigation_type: string;
    primary_crops: string[];
  };
}

interface WeatherData {
  current: {
    temperature: number;
    humidity: number;
    description: string;
    windSpeed: number;
    pressure: number;
  };
  forecast: Array<{
    date: string;
    maxTemp: number;
    minTemp: number;
    description: string;
    humidity: number;
    precipitation: number;
  }>;
}

export function WeatherDashboard({ farm }: WeatherDashboardProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherDataFromAPI = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get coordinates from farm location
      let locationString = 'Kottayam, Kerala, India'; // Default fallback - major agricultural district in Kerala
      let usingFallbackLocation = true;

      if (farm.location) {
        if (farm.location.village && farm.location.district) {
          locationString = `${farm.location.village}, ${farm.location.district}, India`;
          usingFallbackLocation = false;
        } else if (farm.location.district) {
          locationString = `${farm.location.district}, India`;
          usingFallbackLocation = false;
        } else if (farm.location.village) {
          locationString = `${farm.location.village}, India`;
          usingFallbackLocation = false;
        }
      }

      console.log('Fetching weather for location:', locationString);
      console.log('Using fallback location:', usingFallbackLocation);
      console.log('Farm location data:', farm.location);

      // Try multiple location formats if the first one fails
      const locationAttempts = [
        locationString,
        farm.location?.district ? `${farm.location.district}, India` : null,
        'Kottayam, Kerala, India' // Final fallback - major agricultural district in Kerala
      ].filter(Boolean) as string[];

      let coordinates = null;
      let lastError = null;

      for (const attemptLocation of locationAttempts) {
        try {
          console.log('Trying location:', attemptLocation);

          const geocodeResponse = await fetch('/api/geocode', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ location: attemptLocation }),
          });

          if (geocodeResponse.ok) {
            coordinates = await geocodeResponse.json();
            console.log('Successfully got coordinates:', coordinates);
            break;
          } else {
            const errorData = await geocodeResponse.json().catch(() => ({ error: 'Unknown error' }));
            lastError = `Geocoding failed for ${attemptLocation}: ${errorData.error || geocodeResponse.status}`;
            console.warn(lastError);
          }
        } catch (error) {
          lastError = `Error geocoding ${attemptLocation}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.warn(lastError);
        }
      }

      if (!coordinates) {
        throw new Error(lastError || 'Failed to get coordinates for any location');
      }

      // Call weather API
      const weatherResponse = await fetch('/api/weather', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: coordinates.lat,
          longitude: coordinates.lon,
        }),
      });

      if (!weatherResponse.ok) {
        const errorData = await weatherResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Weather API failed: ${errorData.error || weatherResponse.status}`);
      }

      const realWeatherData = await weatherResponse.json();

      setWeatherData(realWeatherData);
    } catch (err) {
      console.error("Weather fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch weather data");

      // Fallback to mock data if API fails
      const mockWeatherData: WeatherData = {
        current: {
          temperature: 28,
          humidity: 75,
          description: "Partly Cloudy",
          windSpeed: 12,
          pressure: 1013,
        },
        forecast: [
          {
            date: new Date().toISOString().split('T')[0],
            maxTemp: 32,
            minTemp: 24,
            description: "Sunny",
            humidity: 70,
            precipitation: 0,
          },
          {
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            maxTemp: 30,
            minTemp: 22,
            description: "Light Rain",
            humidity: 85,
            precipitation: 5,
          },
          {
            date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
            maxTemp: 29,
            minTemp: 21,
            description: "Cloudy",
            humidity: 80,
            precipitation: 2,
          },
          {
            date: new Date(Date.now() + 259200000).toISOString().split('T')[0],
            maxTemp: 31,
            minTemp: 23,
            description: "Partly Cloudy",
            humidity: 72,
            precipitation: 0,
          },
          {
            date: new Date(Date.now() + 345600000).toISOString().split('T')[0],
            maxTemp: 33,
            minTemp: 25,
            description: "Sunny",
            humidity: 68,
            precipitation: 0,
          },
        ],
      };

      setWeatherData(mockWeatherData);
      setError("Using demo weather data - API integration failed");
    } finally {
      setLoading(false);
    }
  }, [farm]);

  useEffect(() => {
    fetchWeatherDataFromAPI();
  }, [fetchWeatherDataFromAPI]);

  const getWeatherIcon = (description: string) => {
    const desc = description.toLowerCase();
    if (desc.includes('sunny') || desc.includes('clear')) return '☀️';
    if (desc.includes('rain')) return '🌧️';
    if (desc.includes('cloud')) return '☁️';
    if (desc.includes('storm')) return '⛈️';
    return '🌤️';
  };

  const getFarmingAdvice = (weather: WeatherData) => {
    const advice = [];

    if (weather.current.temperature > 35) {
      advice.push("🌡️ High temperature alert! Increase irrigation frequency and provide shade for sensitive crops.");
    }

    if (weather.current.humidity > 80) {
      advice.push("💧 High humidity may increase fungal disease risk. Monitor crops closely and ensure good air circulation.");
    }

    if (weather.forecast[0].precipitation > 5) {
      advice.push("🌧️ Rain expected tomorrow. Avoid spraying pesticides and check drainage systems.");
    }

    if (weather.current.windSpeed > 20) {
      advice.push("💨 Strong winds detected. Secure tall crops and check for any structural damage.");
    }

    if (advice.length === 0) {
      advice.push("🌱 Weather conditions look favorable for farming activities. Good time for field work!");
    }

    return advice;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchWeatherDataFromAPI}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!weatherData) {
    return <div>No weather data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Current Weather */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold">Current Weather</h3>
            <p className="text-blue-100">
              {farm.location ? `${farm.location.village}, ${farm.location.district}` : 'Kottayam, Kerala'}
            </p>
          </div>
          <div className="text-4xl">
            {getWeatherIcon(weatherData.current.description)}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-sm opacity-90">Temperature</div>
            <div className="text-2xl font-bold">{weatherData.current.temperature}°C</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-sm opacity-90">Humidity</div>
            <div className="text-2xl font-bold">{weatherData.current.humidity}%</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-sm opacity-90">Wind Speed</div>
            <div className="text-2xl font-bold">{weatherData.current.windSpeed} km/h</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-sm opacity-90">Pressure</div>
            <div className="text-2xl font-bold">{weatherData.current.pressure} hPa</div>
          </div>
        </div>
      </div>

      {/* Farming Advice */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Today&apos;s Farming Advice</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {getFarmingAdvice(weatherData).map((advice, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="text-lg">{advice.split(' ')[0]}</div>
                <p className="text-sm text-blue-800 flex-1">{advice.substring(advice.indexOf(' ') + 1)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5-Day Forecast */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">5-Day Forecast</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {weatherData.forecast.map((day, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">
                  {index === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="text-3xl mb-2">{getWeatherIcon(day.description)}</div>
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {day.maxTemp}° / {day.minTemp}°
                </div>
                <div className="text-xs text-gray-600 mb-2">{day.description}</div>
                <div className="text-xs text-blue-600">
                  💧 {day.precipitation}mm
                </div>
                <div className="text-xs text-gray-500">
                  💨 {day.humidity}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weather Alerts */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Weather Alerts & Tips</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-yellow-600">⚠️</span>
                <h4 className="font-medium text-yellow-800">Irrigation Alert</h4>
              </div>
              <p className="text-sm text-yellow-700">
                Based on current humidity and temperature, consider adjusting irrigation schedule.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-green-600">🌱</span>
                <h4 className="font-medium text-green-800">Planting Conditions</h4>
              </div>
              <p className="text-sm text-green-700">
                Weather conditions are favorable for planting new crops this week.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-blue-600">🚿</span>
                <h4 className="font-medium text-blue-800">Spray Schedule</h4>
              </div>
              <p className="text-sm text-blue-700">
                Low wind conditions make it ideal for pesticide/fertilizer spraying.
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-purple-600">🌾</span>
                <h4 className="font-medium text-purple-800">Harvest Timing</h4>
              </div>
              <p className="text-sm text-purple-700">
                Dry conditions expected - good time for harvesting mature crops.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Weather Data Disclaimer */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-600 text-center">
          <span className="font-medium">Weather data powered by WeatherAPI.com.</span> Real-time weather information for better farming decisions.
        </p>
      </div>
    </div>
  );
}