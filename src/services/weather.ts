/**
 * Weather Service
 * Fetches real-time weather data for locations using Open-Meteo API
 * Free API, no authentication required
 */

import { WeatherService as IWeatherService, WeatherData } from "../types";

export class WeatherService implements IWeatherService {
  private readonly GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search";
  private readonly WEATHER_API = "https://api.open-meteo.com/v1/forecast";

  /**
   * Get current weather for a location
   * @param location City name or "City, Country" format
   * @returns Current weather data
   */
  async getCurrentWeather(location: string): Promise<WeatherData> {
    // Step 1: Geocode the location to get coordinates
    const geoData = await this.geocodeLocation(location);

    // Step 2: Fetch weather data for the coordinates
    const weatherUrl = new URL(this.WEATHER_API);
    weatherUrl.searchParams.set("latitude", geoData.latitude.toString());
    weatherUrl.searchParams.set("longitude", geoData.longitude.toString());
    weatherUrl.searchParams.set("current", "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m");
    weatherUrl.searchParams.set("temperature_unit", "celsius");
    weatherUrl.searchParams.set("wind_speed_unit", "kmh");

    const weatherResponse = await fetch(weatherUrl.toString());
    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${weatherResponse.statusText}`);
    }

    const weatherJson = await weatherResponse.json() as any;

    // Step 3: Parse and structure the response
    const current = weatherJson.current;
    const temperatureCelsius = current.temperature_2m;
    const temperatureFahrenheit = (temperatureCelsius * 9/5) + 32;
    const weatherCode = current.weather_code;
    const weatherDescription = this.getWeatherDescription(weatherCode);

    const weatherData: WeatherData = {
      location: `${geoData.name}, ${geoData.country}`,
      coordinates: {
        latitude: geoData.latitude,
        longitude: geoData.longitude,
      },
      current: {
        temperature: Math.round(temperatureCelsius * 10) / 10,
        temperatureFahrenheit: Math.round(temperatureFahrenheit * 10) / 10,
        weatherCode: weatherCode,
        weatherDescription: weatherDescription,
        windSpeed: Math.round(current.wind_speed_10m * 10) / 10,
        humidity: current.relative_humidity_2m,
        precipitation: current.precipitation,
      },
      summary: this.generateWeatherSummary(
        temperatureCelsius,
        weatherDescription,
        current.wind_speed_10m,
        current.precipitation
      ),
    };

    return weatherData;
  }

  /**
   * Geocode a location to coordinates
   * @param location Location string (e.g., "Tokyo", "New York", "Paris, France")
   * @returns Coordinates and standardized location name
   */
  async geocodeLocation(location: string): Promise<{
    name: string;
    latitude: number;
    longitude: number;
    country: string;
  }> {
    // Normalize location name for better geocoding results
    const normalizedLocation = this.normalizeLocationName(location);

    const geoUrl = new URL(this.GEOCODING_API);
    geoUrl.searchParams.set("name", normalizedLocation);
    geoUrl.searchParams.set("count", "1");
    geoUrl.searchParams.set("language", "en");
    geoUrl.searchParams.set("format", "json");

    const response = await fetch(geoUrl.toString());
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.statusText}`);
    }

    const data = await response.json() as any;

    if (!data.results || data.results.length === 0) {
      throw new Error(`Location not found: ${location}`);
    }

    const result = data.results[0];
    return {
      name: result.name,
      latitude: result.latitude,
      longitude: result.longitude,
      country: result.country || "Unknown",
    };
  }

  /**
   * Normalize location names for better geocoding
   * Only handles punctuation and spacing - no hardcoded city mappings
   */
  private normalizeLocationName(location: string): string {
    // Remove periods and normalize spacing
    let normalized = location
      .replace(/\./g, '')           // Remove periods: "D.C." → "DC"
      .replace(/\s+/g, ' ')         // Normalize spaces: "New  York" → "New York"
      .trim();                      // Remove leading/trailing spaces

    // Strip "DC" suffix (handles "Washington DC" → "Washington")
    // This is a formatting fix, not a city-specific hardcode
    normalized = normalized.replace(/\s+DC$/i, '');

    return normalized;
  }

  /**
   * Convert WMO weather code to human-readable description
   * WMO Weather interpretation codes (WW)
   */
  private getWeatherDescription(code: number): string {
    const weatherCodes: Record<number, string> = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Foggy",
      48: "Depositing rime fog",
      51: "Light drizzle",
      53: "Moderate drizzle",
      55: "Dense drizzle",
      56: "Light freezing drizzle",
      57: "Dense freezing drizzle",
      61: "Slight rain",
      63: "Moderate rain",
      65: "Heavy rain",
      66: "Light freezing rain",
      67: "Heavy freezing rain",
      71: "Slight snow",
      73: "Moderate snow",
      75: "Heavy snow",
      77: "Snow grains",
      80: "Slight rain showers",
      81: "Moderate rain showers",
      82: "Violent rain showers",
      85: "Slight snow showers",
      86: "Heavy snow showers",
      95: "Thunderstorm",
      96: "Thunderstorm with slight hail",
      99: "Thunderstorm with heavy hail",
    };

    return weatherCodes[code] || "Unknown";
  }

  /**
   * Generate a human-readable weather summary
   */
  private generateWeatherSummary(
    temperature: number,
    description: string,
    windSpeed: number,
    precipitation: number
  ): string {
    const tempF = Math.round((temperature * 9/5) + 32);
    let summary = `${description}, ${Math.round(temperature)}°C (${tempF}°F)`;

    // Add wind info if significant
    if (windSpeed > 20) {
      summary += `, windy (${Math.round(windSpeed)} km/h)`;
    }

    // Add precipitation info
    if (precipitation > 0) {
      summary += `, ${precipitation}mm precipitation`;
    }

    // Add comfort level
    if (temperature < 5) {
      summary += " - Very cold, dress warmly";
    } else if (temperature < 15) {
      summary += " - Cool, consider layers";
    } else if (temperature > 30) {
      summary += " - Very hot, stay cool";
    } else if (temperature > 25) {
      summary += " - Warm, light clothing recommended";
    }

    return summary;
  }
}

/**
 * Factory function to create Weather Service instance
 */
export function createWeatherService(): IWeatherService {
  return new WeatherService();
}
