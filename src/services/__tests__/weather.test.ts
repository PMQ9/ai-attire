/**
 * Tests for Weather Service
 */

import { WeatherService } from "../weather";
import { WeatherData } from "../../types";

describe("WeatherService", () => {
  let weatherService: WeatherService;

  beforeEach(() => {
    weatherService = new WeatherService();
  });

  describe("geocodeLocation", () => {
    it("should geocode a city name to coordinates", async () => {
      const result = await weatherService.geocodeLocation("Tokyo");

      expect(result).toBeDefined();
      expect(result.name).toBe("Tokyo");
      expect(result.latitude).toBeCloseTo(35.6762, 1); // Tokyo coordinates
      expect(result.longitude).toBeCloseTo(139.6503, 1);
      expect(result.country).toBeTruthy();
    });

    it("should geocode a city and country", async () => {
      const result = await weatherService.geocodeLocation("Paris, France");

      expect(result).toBeDefined();
      expect(result.name).toBe("Paris");
      expect(result.latitude).toBeCloseTo(48.8566, 1); // Paris coordinates
      expect(result.longitude).toBeCloseTo(2.3522, 1);
      expect(result.country).toBe("France");
    });

    it("should throw error for invalid location", async () => {
      await expect(
        weatherService.geocodeLocation("InvalidCityName123456789")
      ).rejects.toThrow("Location not found");
    });
  });

  describe("getCurrentWeather", () => {
    it("should fetch current weather for a location", async () => {
      const weather = await weatherService.getCurrentWeather("New York");

      expect(weather).toBeDefined();
      expect(weather.location).toContain("New York");
      expect(weather.coordinates).toBeDefined();
      expect(weather.coordinates.latitude).toBeCloseTo(40.7143, 1);
      expect(weather.coordinates.longitude).toBeCloseTo(-74.006, 1);

      // Current weather data
      expect(weather.current).toBeDefined();
      expect(typeof weather.current.temperature).toBe("number");
      expect(typeof weather.current.temperatureFahrenheit).toBe("number");
      expect(typeof weather.current.weatherCode).toBe("number");
      expect(typeof weather.current.weatherDescription).toBe("string");
      expect(typeof weather.current.windSpeed).toBe("number");
      expect(typeof weather.current.humidity).toBe("number");
      expect(typeof weather.current.precipitation).toBe("number");

      // Summary
      expect(weather.summary).toBeDefined();
      expect(typeof weather.summary).toBe("string");
      expect(weather.summary.length).toBeGreaterThan(0);
    });

    it("should fetch weather for different locations", async () => {
      const weather1 = await weatherService.getCurrentWeather("London");
      const weather2 = await weatherService.getCurrentWeather("Tokyo");

      expect(weather1.location).toContain("London");
      expect(weather2.location).toContain("Tokyo");

      // Different locations should have different coordinates
      expect(weather1.coordinates.latitude).not.toBe(weather2.coordinates.latitude);
      expect(weather1.coordinates.longitude).not.toBe(weather2.coordinates.longitude);
    });

    it("should handle weather data structure correctly", async () => {
      const weather = await weatherService.getCurrentWeather("San Francisco");

      // Validate WeatherData interface compliance
      const validateWeatherData = (data: WeatherData) => {
        expect(data.location).toBeDefined();
        expect(data.coordinates.latitude).toBeDefined();
        expect(data.coordinates.longitude).toBeDefined();
        expect(data.current.temperature).toBeDefined();
        expect(data.current.temperatureFahrenheit).toBeDefined();
        expect(data.current.weatherCode).toBeDefined();
        expect(data.current.weatherDescription).toBeDefined();
        expect(data.current.windSpeed).toBeDefined();
        expect(data.current.humidity).toBeDefined();
        expect(data.current.precipitation).toBeDefined();
        expect(data.summary).toBeDefined();
      };

      validateWeatherData(weather);
    });
  });

  describe("getWeatherDescription", () => {
    it("should convert weather codes to descriptions", async () => {
      // This tests the private method indirectly through getCurrentWeather
      const weather = await weatherService.getCurrentWeather("Los Angeles");

      expect(weather.current.weatherDescription).toBeTruthy();
      expect(typeof weather.current.weatherDescription).toBe("string");
    });
  });

  describe("generateWeatherSummary", () => {
    it("should generate meaningful weather summaries", async () => {
      const weather = await weatherService.getCurrentWeather("Chicago");

      // Summary should contain temperature info
      expect(weather.summary).toMatch(/°C/);
      expect(weather.summary).toMatch(/°F/);

      // Summary should describe weather conditions
      expect(weather.summary).toBeTruthy();
      expect(weather.summary.length).toBeGreaterThan(10);
    });
  });
});
