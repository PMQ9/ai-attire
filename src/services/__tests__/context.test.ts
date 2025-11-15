/**
 * Unit tests for Module 3: Context Parser
 */

import { ContextParser } from "../context";

describe("ContextParser", () => {
  let parser: ContextParser;

  beforeEach(() => {
    parser = new ContextParser();
  });

  describe("parseOccasion", () => {
    describe("Occasion extraction", () => {
      it("should extract 'wedding' from input", () => {
        const context = parser.parseOccasion("wedding in Japan");
        expect(context.occasion).toBe("wedding");
      });

      it("should extract 'business' from business meeting", () => {
        const context = parser.parseOccasion("business meeting in Thailand");
        expect(context.occasion).toBe("business");
      });

      it("should extract 'workout' from casual workout", () => {
        const context = parser.parseOccasion("casual workout");
        expect(context.occasion).toBe("workout");
      });

      it("should extract 'party' from party input", () => {
        const context = parser.parseOccasion("going to a party tonight");
        expect(context.occasion).toBe("party");
      });

      it("should extract 'interview' from job interview", () => {
        const context = parser.parseOccasion("job interview tomorrow");
        expect(context.occasion).toBe("interview");
      });

      it("should return 'general' for unknown occasion", () => {
        const context = parser.parseOccasion("just walking around");
        expect(context.occasion).toBe("general");
      });
    });

    describe("Location extraction", () => {
      it("should extract 'Japan' from input", () => {
        const context = parser.parseOccasion("wedding in Japan");
        expect(context.location).toBe("Japan");
      });

      it("should extract 'Thailand' from input", () => {
        const context = parser.parseOccasion("business meeting in Thailand");
        expect(context.location).toBe("Thailand");
      });

      it("should extract 'New York' from input", () => {
        const context = parser.parseOccasion("party in new york");
        expect(context.location).toBe("New York");
      });

      it("should extract 'Paris' from input", () => {
        const context = parser.parseOccasion("romantic date in paris");
        expect(context.location).toBe("Paris");
      });

      it("should return undefined when no location mentioned", () => {
        const context = parser.parseOccasion("casual workout");
        expect(context.location).toBeUndefined();
      });
    });

    describe("Formality determination", () => {
      it("should set formality to 'formal' for wedding", () => {
        const context = parser.parseOccasion("wedding in Japan");
        expect(context.formality).toBe("formal");
      });

      it("should set formality to 'business-casual' for business meeting", () => {
        const context = parser.parseOccasion("business meeting");
        expect(context.formality).toBe("business-casual");
      });

      it("should set formality to 'athletic' for workout", () => {
        const context = parser.parseOccasion("gym workout");
        expect(context.formality).toBe("athletic");
      });

      it("should set formality to 'casual' for party", () => {
        const context = parser.parseOccasion("birthday party");
        expect(context.formality).toBe("casual");
      });

      it("should set formality to 'formal' for funeral", () => {
        const context = parser.parseOccasion("attending a funeral");
        expect(context.formality).toBe("formal");
      });

      it("should set formality to 'formal' for interview", () => {
        const context = parser.parseOccasion("job interview");
        expect(context.formality).toBe("formal");
      });
    });

    describe("Tone extraction", () => {
      it("should extract 'elegant' tone", () => {
        const context = parser.parseOccasion("formal event, need elegant look");
        expect(context.tone).toContain("elegant");
      });

      it("should extract 'comfortable' tone", () => {
        const context = parser.parseOccasion("wedding but need to be comfortable");
        expect(context.tone).toContain("comfortable");
      });

      it("should extract multiple tones", () => {
        const context = parser.parseOccasion("business meeting, professional and comfortable");
        expect(context.tone).toContain("professional");
        expect(context.tone).toContain("comfortable");
      });

      it("should extract 'minimalist' tone", () => {
        const context = parser.parseOccasion("date night, minimalist style");
        expect(context.tone).toContain("minimalist");
      });

      it("should return empty array when no tones mentioned", () => {
        const context = parser.parseOccasion("wedding in Japan");
        expect(context.tone).toEqual([]);
      });
    });

    describe("Weather consideration extraction", () => {
      it("should extract 'hot' weather", () => {
        const context = parser.parseOccasion("wedding in hot summer weather");
        expect(context.weatherConsideration).toBe("hot");
      });

      it("should extract 'cold' weather", () => {
        const context = parser.parseOccasion("business meeting in cold winter");
        expect(context.weatherConsideration).toBe("cold");
      });

      it("should extract 'rainy' weather", () => {
        const context = parser.parseOccasion("outdoor party, might be rainy");
        expect(context.weatherConsideration).toBe("rainy");
      });

      it("should extract 'humid' weather", () => {
        const context = parser.parseOccasion("tropical location, very humid");
        expect(context.weatherConsideration).toBe("humid");
      });

      it("should return undefined when no weather mentioned", () => {
        const context = parser.parseOccasion("business meeting");
        expect(context.weatherConsideration).toBeUndefined();
      });
    });

    describe("Preferences extraction", () => {
      it("should extract 'breathable' preference", () => {
        const context = parser.parseOccasion("business meeting, need breathable clothes");
        expect(context.preferences).toContain("breathable");
      });

      it("should extract 'lightweight' preference", () => {
        const context = parser.parseOccasion("traveling, prefer lightweight clothing");
        expect(context.preferences).toContain("lightweight");
      });

      it("should extract multiple preferences", () => {
        const context = parser.parseOccasion("wedding, want elegant and comfortable outfit");
        expect(context.preferences).toContain("elegant");
        expect(context.preferences).toContain("comfortable");
      });

      it("should extract 'minimalist' preference", () => {
        const context = parser.parseOccasion("prefer minimalist style");
        expect(context.preferences).toContain("minimalist");
      });

      it("should return empty array when no preferences mentioned", () => {
        const context = parser.parseOccasion("casual party");
        expect(context.preferences).toEqual([]);
      });
    });

    describe("Cultural notes extraction", () => {
      it("should add cultural notes for Japan", () => {
        const context = parser.parseOccasion("wedding in Japan");
        expect(context.culturalNotes).toBeDefined();
        expect(context.culturalNotes).toContain("modest");
      });

      it("should add cultural notes for Thailand", () => {
        const context = parser.parseOccasion("business meeting in Thailand");
        expect(context.culturalNotes).toBeDefined();
        expect(context.culturalNotes).toContain("modest");
      });

      it("should add cultural notes for Dubai", () => {
        const context = parser.parseOccasion("conference in Dubai");
        expect(context.culturalNotes).toBeDefined();
        expect(context.culturalNotes).toContain("Conservative");
      });

      it("should add cultural notes for religious sites", () => {
        const context = parser.parseOccasion("visiting a temple");
        expect(context.culturalNotes).toBe("Religious site - modest, respectful attire required");
      });

      it("should return undefined when no cultural considerations", () => {
        const context = parser.parseOccasion("party in new york");
        expect(context.culturalNotes).toBeUndefined();
      });
    });

    describe("Raw input preservation", () => {
      it("should preserve the original input", () => {
        const input = "Wedding in Japan, Elegant but Comfortable";
        const context = parser.parseOccasion(input);
        expect(context.rawInput).toBe(input);
      });
    });

    describe("Complex scenarios", () => {
      it("should parse comprehensive wedding input", () => {
        const context = parser.parseOccasion(
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

      it("should parse business meeting with preferences", () => {
        const context = parser.parseOccasion(
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

      it("should parse workout scenario", () => {
        const context = parser.parseOccasion("gym workout, comfortable and breathable");

        expect(context.occasion).toBe("workout");
        expect(context.formality).toBe("athletic");
        expect(context.tone).toContain("comfortable");
        expect(context.tone).toContain("breathable");
        expect(context.preferences).toContain("comfortable");
        expect(context.preferences).toContain("breathable");
      });

      it("should handle minimal input gracefully", () => {
        const context = parser.parseOccasion("party");

        expect(context.occasion).toBe("party");
        expect(context.formality).toBe("casual");
        expect(context.tone).toEqual([]);
        expect(context.preferences).toEqual([]);
        expect(context.location).toBeUndefined();
        expect(context.rawInput).toBe("party");
      });

      it("should handle empty or vague input", () => {
        const context = parser.parseOccasion("going out");

        expect(context.occasion).toBe("general");
        expect(context.formality).toBe("casual");
        expect(context.rawInput).toBe("going out");
      });
    });

    describe("Case insensitivity", () => {
      it("should handle uppercase input", () => {
        const context = parser.parseOccasion("WEDDING IN JAPAN");
        expect(context.occasion).toBe("wedding");
        expect(context.location).toBe("Japan");
      });

      it("should handle mixed case input", () => {
        const context = parser.parseOccasion("Business Meeting in New York");
        expect(context.occasion).toBe("business");
        expect(context.location).toBe("New York");
      });
    });
  });

  describe("Integration with types", () => {
    it("should return a valid OccasionContext object", () => {
      const context = parser.parseOccasion("wedding in Japan");

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

    it("should have correct formality enum values", () => {
      const contexts = [
        parser.parseOccasion("wedding"),
        parser.parseOccasion("business meeting"),
        parser.parseOccasion("workout"),
        parser.parseOccasion("casual party"),
      ];

      contexts.forEach(context => {
        expect(["casual", "business-casual", "formal", "athletic"]).toContain(context.formality);
      });
    });
  });
});
