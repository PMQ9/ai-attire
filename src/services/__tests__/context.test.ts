/**
 * Unit tests for Module 3: Context Parser
 */

import { ContextParser } from "../context";
import { ClaudeAPIService } from "../../types";

describe("ContextParser", () => {
  let parser: ContextParser;

  beforeEach(() => {
    // Create parser without Claude service (uses keyword-based parsing)
    parser = new ContextParser();
  });

  describe("parseOccasion (keyword-based fallback)", () => {
    describe("Occasion extraction", () => {
      it("should extract 'wedding' from input", async () => {
        const context = await parser.parseOccasion("wedding in Japan");
        expect(context.occasion).toBe("wedding");
      });

      it("should extract 'business' from business meeting", async () => {
        const context = await parser.parseOccasion("business meeting in Thailand");
        expect(context.occasion).toBe("business");
      });

      it("should extract 'workout' from casual workout", async () => {
        const context = await parser.parseOccasion("casual workout");
        expect(context.occasion).toBe("workout");
      });

      it("should extract 'party' from party input", async () => {
        const context = await parser.parseOccasion("going to a party tonight");
        expect(context.occasion).toBe("party");
      });

      it("should extract 'interview' from job interview", async () => {
        const context = await parser.parseOccasion("job interview tomorrow");
        expect(context.occasion).toBe("interview");
      });

      it("should return 'general' for unknown occasion", async () => {
        const context = await parser.parseOccasion("just walking around");
        expect(context.occasion).toBe("general");
      });
    });

    describe("Location extraction", () => {
      it("should extract 'Japan' from input", async () => {
        const context = await parser.parseOccasion("wedding in Japan");
        expect(context.location).toBe("Japan");
      });

      it("should extract 'Thailand' from input", async () => {
        const context = await parser.parseOccasion("business meeting in Thailand");
        expect(context.location).toBe("Thailand");
      });

      it("should extract 'New York' from input", async () => {
        const context = await parser.parseOccasion("party in new york");
        expect(context.location).toBe("New York");
      });

      it("should extract 'Paris' from input", async () => {
        const context = await parser.parseOccasion("romantic date in paris");
        expect(context.location).toBe("Paris");
      });

      it("should return undefined when no location mentioned", async () => {
        const context = await parser.parseOccasion("casual workout");
        expect(context.location).toBeUndefined();
      });
    });

    describe("Formality determination", () => {
      it("should set formality to 'formal' for wedding", async () => {
        const context = await parser.parseOccasion("wedding in Japan");
        expect(context.formality).toBe("formal");
      });

      it("should set formality to 'business-casual' for business meeting", async () => {
        const context = await parser.parseOccasion("business meeting");
        expect(context.formality).toBe("business-casual");
      });

      it("should set formality to 'athletic' for workout", async () => {
        const context = await parser.parseOccasion("gym workout");
        expect(context.formality).toBe("athletic");
      });

      it("should set formality to 'casual' for party", async () => {
        const context = await parser.parseOccasion("birthday party");
        expect(context.formality).toBe("casual");
      });

      it("should set formality to 'formal' for funeral", async () => {
        const context = await parser.parseOccasion("attending a funeral");
        expect(context.formality).toBe("formal");
      });

      it("should set formality to 'formal' for interview", async () => {
        const context = await parser.parseOccasion("job interview");
        expect(context.formality).toBe("formal");
      });
    });

    describe("Tone extraction", () => {
      it("should extract 'elegant' tone", async () => {
        const context = await parser.parseOccasion("formal event, need elegant look");
        expect(context.tone).toContain("elegant");
      });

      it("should extract 'comfortable' tone", async () => {
        const context = await parser.parseOccasion("wedding but need to be comfortable");
        expect(context.tone).toContain("comfortable");
      });

      it("should extract multiple tones", async () => {
        const context = await parser.parseOccasion("business meeting, professional and comfortable");
        expect(context.tone).toContain("professional");
        expect(context.tone).toContain("comfortable");
      });

      it("should extract 'minimalist' tone", async () => {
        const context = await parser.parseOccasion("date night, minimalist style");
        expect(context.tone).toContain("minimalist");
      });

      it("should return empty array when no tones mentioned", async () => {
        const context = await parser.parseOccasion("wedding in Japan");
        expect(context.tone).toEqual([]);
      });
    });

    describe("Weather consideration extraction", () => {
      it("should extract 'hot' weather", async () => {
        const context = await parser.parseOccasion("wedding in hot summer weather");
        expect(context.weatherConsideration).toBe("hot");
      });

      it("should extract 'cold' weather", async () => {
        const context = await parser.parseOccasion("business meeting in cold winter");
        expect(context.weatherConsideration).toBe("cold");
      });

      it("should extract 'rainy' weather", async () => {
        const context = await parser.parseOccasion("outdoor party, might be rainy");
        expect(context.weatherConsideration).toBe("rainy");
      });

      it("should extract 'humid' weather", async () => {
        const context = await parser.parseOccasion("tropical location, very humid");
        expect(context.weatherConsideration).toBe("humid");
      });

      it("should return undefined when no weather mentioned", async () => {
        const context = await parser.parseOccasion("business meeting");
        expect(context.weatherConsideration).toBeUndefined();
      });
    });

    describe("Preferences extraction", () => {
      it("should extract 'breathable' preference", async () => {
        const context = await parser.parseOccasion("business meeting, need breathable clothes");
        expect(context.preferences).toContain("breathable");
      });

      it("should extract 'lightweight' preference", async () => {
        const context = await parser.parseOccasion("traveling, prefer lightweight clothing");
        expect(context.preferences).toContain("lightweight");
      });

      it("should extract multiple preferences", async () => {
        const context = await parser.parseOccasion("wedding, want elegant and comfortable outfit");
        expect(context.preferences).toContain("elegant");
        expect(context.preferences).toContain("comfortable");
      });

      it("should extract 'minimalist' preference", async () => {
        const context = await parser.parseOccasion("prefer minimalist style");
        expect(context.preferences).toContain("minimalist");
      });

      it("should return empty array when no preferences mentioned", async () => {
        const context = await parser.parseOccasion("casual party");
        expect(context.preferences).toEqual([]);
      });
    });

    describe("Cultural notes extraction", () => {
      it("should add cultural notes for Japan", async () => {
        const context = await parser.parseOccasion("wedding in Japan");
        expect(context.culturalNotes).toBeDefined();
        expect(context.culturalNotes).toContain("modest");
      });

      it("should add cultural notes for Thailand", async () => {
        const context = await parser.parseOccasion("business meeting in Thailand");
        expect(context.culturalNotes).toBeDefined();
        expect(context.culturalNotes).toContain("modest");
      });

      it("should add cultural notes for Dubai", async () => {
        const context = await parser.parseOccasion("conference in Dubai");
        expect(context.culturalNotes).toBeDefined();
        expect(context.culturalNotes).toContain("Conservative");
      });

      it("should add cultural notes for religious sites", async () => {
        const context = await parser.parseOccasion("visiting a temple");
        expect(context.culturalNotes).toBe("Religious site - modest, respectful attire required");
      });

      it("should return undefined when no cultural considerations", async () => {
        const context = await parser.parseOccasion("party in new york");
        expect(context.culturalNotes).toBeUndefined();
      });
    });

    describe("Raw input preservation", () => {
      it("should preserve the original input", async () => {
        const input = "Wedding in Japan, Elegant but Comfortable";
        const context = await parser.parseOccasion(input);
        expect(context.rawInput).toBe(input);
      });
    });

    describe("Complex scenarios", () => {
      it("should parse comprehensive wedding input", async () => {
        const context = await parser.parseOccasion(
          "wedding in Japan, elegant but comfortable, hot summer weather"
        );

        expect(context.occasion).toBe("wedding");
        expect(context.location).toBe("Japan");
        expect(context.formality).toBe("formal");
        expect(context.tone).toContain("elegant");
        expect(context.tone).toContain("comfortable");
        expect(context.weatherConsideration).toBe("hot");
        expect(context.preferences).toContain("elegant");
        expect(context.preferences).toContain("comfortable");
        expect(context.culturalNotes).toBeDefined();
      });

      it("should parse business meeting with preferences", async () => {
        const context = await parser.parseOccasion(
          "business meeting in Thailand, need breathable professional clothes, humid weather"
        );

        expect(context.occasion).toBe("business");
        expect(context.location).toBe("Thailand");
        expect(context.formality).toBe("business-casual");
        expect(context.tone).toContain("professional");
        expect(context.tone).toContain("breathable");
        expect(context.weatherConsideration).toBe("humid");
        expect(context.preferences).toContain("breathable");
        expect(context.preferences).toContain("professional");
      });

      it("should parse workout scenario", async () => {
        const context = await parser.parseOccasion("gym workout, comfortable and breathable");

        expect(context.occasion).toBe("workout");
        expect(context.formality).toBe("athletic");
        expect(context.tone).toContain("comfortable");
        expect(context.tone).toContain("breathable");
        expect(context.preferences).toContain("comfortable");
        expect(context.preferences).toContain("breathable");
      });

      it("should handle minimal input gracefully", async () => {
        const context = await parser.parseOccasion("party");

        expect(context.occasion).toBe("party");
        expect(context.formality).toBe("casual");
        expect(context.tone).toEqual([]);
        expect(context.preferences).toEqual([]);
        expect(context.location).toBeUndefined();
        expect(context.rawInput).toBe("party");
      });

      it("should handle empty or vague input", async () => {
        const context = await parser.parseOccasion("going out");

        expect(context.occasion).toBe("general");
        expect(context.formality).toBe("casual");
        expect(context.rawInput).toBe("going out");
      });
    });

    describe("Case insensitivity", () => {
      it("should handle uppercase input", async () => {
        const context = await parser.parseOccasion("WEDDING IN JAPAN");
        expect(context.occasion).toBe("wedding");
        expect(context.location).toBe("Japan");
      });

      it("should handle mixed case input", async () => {
        const context = await parser.parseOccasion("Business Meeting in New York");
        expect(context.occasion).toBe("business");
        expect(context.location).toBe("New York");
      });
    });
  });

  describe("Integration with types", () => {
    it("should return a valid OccasionContext object", async () => {
      const context = await parser.parseOccasion("wedding in Japan");

      // Check all required fields
      expect(context).toHaveProperty("occasion");
      expect(context).toHaveProperty("formality");
      expect(context).toHaveProperty("tone");
      expect(context).toHaveProperty("rawInput");

      // Check types
      expect(typeof context.occasion).toBe("string");
      expect(["casual", "business-casual", "formal", "athletic"]).toContain(context.formality);
      expect(Array.isArray(context.tone)).toBe(true);
      expect(typeof context.rawInput).toBe("string");
    });

    it("should have correct formality enum values", async () => {
      const contexts = [
        await parser.parseOccasion("wedding"),
        await parser.parseOccasion("business meeting"),
        await parser.parseOccasion("workout"),
        await parser.parseOccasion("casual party"),
      ];

      contexts.forEach(context => {
        expect(["casual", "business-casual", "formal", "athletic"]).toContain(context.formality);
      });
    });
  });

  describe("AI-powered parsing", () => {
    let mockClaudeService: jest.Mocked<ClaudeAPIService>;
    let aiParser: ContextParser;

    beforeEach(() => {
      // Create mock Claude service
      mockClaudeService = {
        callClaude: jest.fn(),
        callClaudeVision: jest.fn(),
      };

      // Create parser with Claude service (enables AI parsing)
      aiParser = new ContextParser(mockClaudeService);
    });

    it("should use AI parsing when Claude service is available", async () => {
      const mockResponse = JSON.stringify({
        occasion: "wedding",
        location: "Japan",
        formality: "formal",
        tone: ["elegant", "traditional"],
        weatherConsideration: "hot",
        culturalNotes: "Consider modest dress codes; remove shoes indoors",
        preferences: ["comfortable", "breathable"]
      });

      mockClaudeService.callClaude.mockResolvedValue(mockResponse);

      const context = await aiParser.parseOccasion("wedding in Japan, want elegant and comfortable, hot weather");

      expect(mockClaudeService.callClaude).toHaveBeenCalledTimes(1);
      expect(context.occasion).toBe("wedding");
      expect(context.location).toBe("Japan");
      expect(context.formality).toBe("formal");
      expect(context.tone).toEqual(["elegant", "traditional"]);
      expect(context.weatherConsideration).toBe("hot");
      expect(context.culturalNotes).toContain("modest");
      expect(context.preferences).toEqual(["comfortable", "breathable"]);
    });

    it("should handle AI responses with extra text around JSON", async () => {
      const mockResponse = `Here's the parsed context:
      ${JSON.stringify({
        occasion: "business",
        location: "New York",
        formality: "business-casual",
        tone: ["professional"],
        weatherConsideration: null,
        culturalNotes: null,
        preferences: []
      })}
      Hope this helps!`;

      mockClaudeService.callClaude.mockResolvedValue(mockResponse);

      const context = await aiParser.parseOccasion("business meeting in New York");

      expect(context.occasion).toBe("business");
      expect(context.location).toBe("New York");
      expect(context.formality).toBe("business-casual");
    });

    it("should fallback to keyword-based parsing if AI parsing fails", async () => {
      // Mock Claude service to throw an error
      mockClaudeService.callClaude.mockRejectedValue(new Error("API error"));

      const context = await aiParser.parseOccasion("wedding in Japan");

      // Should still get results from keyword-based fallback
      expect(context.occasion).toBe("wedding");
      expect(context.location).toBe("Japan");
      expect(context.formality).toBe("formal");
    });

    it("should fallback if AI returns invalid JSON", async () => {
      mockClaudeService.callClaude.mockResolvedValue("This is not valid JSON at all");

      const context = await aiParser.parseOccasion("party tonight");

      // Should fallback to keyword-based parsing
      expect(context.occasion).toBe("party");
      expect(context.formality).toBe("casual");
    });

    it("should validate formality values from AI response", async () => {
      const mockResponse = JSON.stringify({
        occasion: "wedding",
        location: null,
        formality: "super-formal", // Invalid formality
        tone: [],
        weatherConsideration: null,
        culturalNotes: null,
        preferences: []
      });

      mockClaudeService.callClaude.mockResolvedValue(mockResponse);

      const context = await aiParser.parseOccasion("wedding");

      // Should default to "casual" for invalid formality
      expect(context.formality).toBe("casual");
    });

    it("should handle negations better with AI", async () => {
      const mockResponse = JSON.stringify({
        occasion: "party",
        location: null,
        formality: "casual", // AI understands "NOT formal" means casual
        tone: ["relaxed"],
        weatherConsideration: null,
        culturalNotes: null,
        preferences: []
      });

      mockClaudeService.callClaude.mockResolvedValue(mockResponse);

      const context = await aiParser.parseOccasion("party tonight, but NOT formal");

      expect(context.occasion).toBe("party");
      expect(context.formality).toBe("casual");
    });

    it("should extract unrecognized locations with AI", async () => {
      const mockResponse = JSON.stringify({
        occasion: "business",
        location: "Stockholm", // Location not in keyword list
        formality: "business-casual",
        tone: ["professional"],
        weatherConsideration: "cold",
        culturalNotes: null,
        preferences: []
      });

      mockClaudeService.callClaude.mockResolvedValue(mockResponse);

      const context = await aiParser.parseOccasion("business trip to Stockholm in winter");

      expect(context.location).toBe("Stockholm");
      expect(context.weatherConsideration).toBe("cold");
    });

    it("should preserve rawInput regardless of parsing method", async () => {
      const input = "Test input for AI parsing";
      const mockResponse = JSON.stringify({
        occasion: "general",
        location: null,
        formality: "casual",
        tone: [],
        weatherConsideration: null,
        culturalNotes: null,
        preferences: []
      });

      mockClaudeService.callClaude.mockResolvedValue(mockResponse);

      const context = await aiParser.parseOccasion(input);

      expect(context.rawInput).toBe(input);
    });
  });
});
