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

interface WeatherAPICurrentResponse {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: {
    temp_c: number;
    humidity: number;
    condition: {
      text: string;
    };
    wind_kph: number;
    pressure_mb: number;
  };
}

interface WeatherAPIForecastResponse {
  forecast: {
    forecastday: Array<{
      date: string;
      day: {
        maxtemp_c: number;
        mintemp_c: number;
        avghumidity: number;
        daily_chance_of_rain: number;
        condition: {
          text: string;
        };
      };
    }>;
  };
}

export async function fetchWeatherData(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  const apiKey = process.env.WEATHER_API_KEY;

  if (!apiKey) {
    throw new Error('WeatherAPI key not configured');
  }

  try {
    // Fetch forecast data (includes current weather)
    const response = await fetch(
      `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${latitude},${longitude}&days=5&aqi=no`
    );

    if (!response.ok) {
      throw new Error(`WeatherAPI error: ${response.status}`);
    }

    const data = await response.json();

    // Process current weather
    const current = {
      temperature: Math.round(data.current.temp_c),
      humidity: data.current.humidity,
      description: data.current.condition.text,
      windSpeed: Math.round(data.current.wind_kph),
      pressure: Math.round(data.current.pressure_mb),
    };

    // Process forecast
    const forecast: WeatherData['forecast'] = data.forecast.forecastday.map((day: WeatherAPIForecastResponse['forecast']['forecastday'][0]) => ({
      date: day.date,
      maxTemp: Math.round(day.day.maxtemp_c),
      minTemp: Math.round(day.day.mintemp_c),
      description: day.day.condition.text,
      humidity: Math.round(day.day.avghumidity),
      precipitation: day.day.daily_chance_of_rain,
    }));

    return {
      current,
      forecast,
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw new Error('Failed to fetch weather data from WeatherAPI');
  }
}

// Function to get coordinates from location name (for demo purposes)
export async function getCoordinatesFromLocation(location: string): Promise<{ lat: number; lon: number }> {
  const apiKey = process.env.WEATHER_API_KEY;

  if (!apiKey) {
    throw new Error('WeatherAPI key not configured');
  }

  try {
    const response = await fetch(
      `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(location)}`
    );

    if (!response.ok) {
      throw new Error(`WeatherAPI geocoding error: ${response.status}`);
    }

    const data = await response.json();

    return {
      lat: data.location.lat,
      lon: data.location.lon,
    };
  } catch (error) {
    console.error('Error getting coordinates:', error);
    throw new Error('Failed to get coordinates for location');
  }
}