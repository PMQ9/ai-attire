import { RecommenderEngine } from "../recommender";
import {
  ClaudeAPIService,
  VisionService,
  ContextParser as IContextParser,
  ClothingAnalysis,
  OccasionContext,
  RecommendationRequest,
} from "../../types";

/**
 * Mock Claude API Service for testing
 * Returns valid recommendation JSON responses
 */
class MockClaudeService implements ClaudeAPIService {
  async callClaude(_prompt: string): Promise<string> {
    return JSON.stringify({
      occasion: "business",
      location: "Thailand",
      summary:
        "For a business meeting in Thailand's warm climate, opt for lightweight, breathable fabrics that maintain professionalism.",
      recommendations: [
        "Light linen blazer with white dress shirt and black dress pants",
        "Breathable cotton button-down with khaki chinos",
        "White formal shirt with black formal pants for maximum professionalism",
      ],
      culturalTips: [
        "Business dress in Thailand is formal and respectful",
        "Avoid showing shoulders or excessive skin",
      ],
      dontWear: [
        "Heavy wool or dark colors in heat",
        "Shorts or revealing clothing",
        "Sneakers or casual footwear",
      ],
      shoppingTips: [
        "Consider adding lightweight dress shoes",
        "Invest in breathable dress pants",
      ],
    });
  }

  async callClaudeVision(_imageBase64: string, _prompt: string): Promise<string> {
    return "Mock vision response";
  }
}

/**
 * Mock service that returns response without optional fields
 */
class MinimalResponseMockService implements ClaudeAPIService {
  async callClaude(_prompt: string): Promise<string> {
    return JSON.stringify({
      occasion: "casual",
      location: null,
      summary: "Casual outfit suggestions for everyday wear.",
      recommendations: [
        "Blue casual shirt with black pants",
        "White shirt with blue jeans",
      ],
      culturalTips: null,
      dontWear: null,
      shoppingTips: null,
    });
  }

  async callClaudeVision(_imageBase64: string, _prompt: string): Promise<string> {
    return "Mock vision response";
  }
}

/**
 * Mock service that returns malformed JSON
 */
class MalformedJsonMockService implements ClaudeAPIService {
  async callClaude(_prompt: string): Promise<string> {
    return "This is not JSON at all, just plain text";
  }

  async callClaudeVision(_imageBase64: string, _prompt: string): Promise<string> {
    return "Mock vision response";
  }
}

/**
 * Mock service that returns incomplete JSON (missing required fields)
 */
class IncompleteJsonMockService implements ClaudeAPIService {
  async callClaude(_prompt: string): Promise<string> {
    return JSON.stringify({
      occasion: "business",
      // missing summary and recommendations
    });
  }

  async callClaudeVision(_imageBase64: string, _prompt: string): Promise<string> {
    return "Mock vision response";
  }
}

/**
 * Mock service that returns JSON with extra text
 */
class JsonWithExtraTextMockService implements ClaudeAPIService {
  async callClaude(_prompt: string): Promise<string> {
    return `Here are my recommendations:

${JSON.stringify({
  occasion: "wedding",
  location: "Japan",
  summary: "Elegant and culturally appropriate attire for a Japanese wedding.",
  recommendations: [
    "Black formal suit with white dress shirt",
    "Navy blue suit with light blue tie",
  ],
  culturalTips: ["Dress conservatively", "Remove shoes when entering venues"],
  dontWear: ["Bright colors", "Casual wear"],
  shoppingTips: ["Consider a formal tie"],
})}

That's my complete analysis.`;
  }

  async callClaudeVision(_imageBase64: string, _prompt: string): Promise<string> {
    return "Mock vision response";
  }
}

/**
 * Mock service that throws an error
 */
class ErrorMockService implements ClaudeAPIService {
  async callClaude(_prompt: string): Promise<string> {
    throw new Error("Claude API failed");
  }

  async callClaudeVision(_imageBase64: string, _prompt: string): Promise<string> {
    return "Mock vision response";
  }
}

/**
 * Mock Vision Service (not used directly by RecommenderEngine, but required for constructor)
 */
class MockVisionService implements VisionService {
  async analyzeClothing(_imageBase64: string): Promise<ClothingAnalysis> {
    return {
      items: [
        { type: "shirt", color: "blue", style: "casual" },
        { type: "pants", color: "black", style: "formal" },
      ],
      overallStyle: "business-casual",
      colorPalette: ["blue", "black"],
      summary: "Mock wardrobe",
    };
  }
}

/**
 * Mock Context Parser (not used directly by RecommenderEngine, but required for constructor)
 */
class MockContextParser implements IContextParser {
  parseOccasion(_input: string): OccasionContext {
    return {
      occasion: "business",
      location: "Thailand",
      formality: "business-casual",
      tone: ["professional"],
      rawInput: "business meeting in Thailand",
    };
  }
}

describe("RecommenderEngine", () => {
  let recommender: RecommenderEngine;
  let mockClaudeService: MockClaudeService;
  let mockVisionService: MockVisionService;
  let mockContextParser: MockContextParser;

  beforeEach(() => {
    mockClaudeService = new MockClaudeService();
    mockVisionService = new MockVisionService();
    mockContextParser = new MockContextParser();
    recommender = new RecommenderEngine(
      mockClaudeService,
      mockVisionService,
      mockContextParser
    );
  });

  describe("generateRecommendations - Happy Path", () => {
    const validRequest: RecommendationRequest = {
      clothingAnalysis: {
        items: [
          { type: "shirt", color: "white", style: "formal" },
          { type: "pants", color: "black", style: "formal" },
          { type: "blazer", color: "navy", style: "formal" },
        ],
        overallStyle: "business",
        colorPalette: ["white", "black", "navy"],
        summary: "Professional business wardrobe",
      },
      occasionContext: {
        occasion: "business",
        location: "Thailand",
        formality: "business-casual",
        tone: ["professional", "breathable"],
        weatherConsideration: "hot",
        culturalNotes: "Dress modestly, especially in temples",
        preferences: ["breathable", "lightweight"],
        rawInput: "business meeting in Thailand, hot weather, prefer breathable",
      },
    };

    it("should generate recommendations successfully", async () => {
      const result = await recommender.generateRecommendations(validRequest);

      expect(result).toBeDefined();
      expect(result.occasion).toBe("business");
      expect(result.location).toBe("Thailand");
      expect(result.summary).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it("should return at least one recommendation", async () => {
      const result = await recommender.generateRecommendations(validRequest);

      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it("should include all required fields", async () => {
      const result = await recommender.generateRecommendations(validRequest);

      expect(result.occasion).toBeTruthy();
      expect(result.summary).toBeTruthy();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it("should include optional cultural tips when location is provided", async () => {
      const result = await recommender.generateRecommendations(validRequest);

      expect(result.culturalTips).toBeDefined();
      expect(Array.isArray(result.culturalTips)).toBe(true);
      expect(result.culturalTips!.length).toBeGreaterThan(0);
    });

    it("should include what not to wear suggestions", async () => {
      const result = await recommender.generateRecommendations(validRequest);

      expect(result.dontWear).toBeDefined();
      expect(Array.isArray(result.dontWear)).toBe(true);
    });

    it("should include shopping tips", async () => {
      const result = await recommender.generateRecommendations(validRequest);

      expect(result.shoppingTips).toBeDefined();
      expect(Array.isArray(result.shoppingTips)).toBe(true);
    });

    it("should handle request without location", async () => {
      const requestWithoutLocation: RecommendationRequest = {
        clothingAnalysis: validRequest.clothingAnalysis,
        occasionContext: {
          ...validRequest.occasionContext,
          location: undefined,
        },
      };

      const minimalService = new MinimalResponseMockService();
      const minimalRecommender = new RecommenderEngine(
        minimalService,
        mockVisionService,
        mockContextParser
      );

      const result = await minimalRecommender.generateRecommendations(
        requestWithoutLocation
      );

      expect(result).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it("should handle response with JSON embedded in text", async () => {
      const jsonWithTextService = new JsonWithExtraTextMockService();
      const jsonWithTextRecommender = new RecommenderEngine(
        jsonWithTextService,
        mockVisionService,
        mockContextParser
      );

      const result = await jsonWithTextRecommender.generateRecommendations(validRequest);

      expect(result).toBeDefined();
      expect(result.occasion).toBe("wedding");
      expect(result.location).toBe("Japan");
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe("generateRecommendations - Error Handling", () => {
    it("should throw error when clothingAnalysis is missing", async () => {
      const invalidRequest: any = {
        occasionContext: {
          occasion: "business",
          formality: "business-casual" as const,
          tone: [],
          rawInput: "test",
        },
      };

      await expect(recommender.generateRecommendations(invalidRequest)).rejects.toThrow(
        "Both clothingAnalysis and occasionContext are required"
      );
    });

    it("should throw error when occasionContext is missing", async () => {
      const invalidRequest: any = {
        clothingAnalysis: {
          items: [{ type: "shirt", color: "blue", style: "casual" }],
          overallStyle: "casual",
          colorPalette: ["blue"],
          summary: "Test",
        },
      };

      await expect(recommender.generateRecommendations(invalidRequest)).rejects.toThrow(
        "Both clothingAnalysis and occasionContext are required"
      );
    });

    it("should throw error when clothing items array is empty", async () => {
      const requestWithEmptyItems: RecommendationRequest = {
        clothingAnalysis: {
          items: [],
          overallStyle: "casual",
          colorPalette: [],
          summary: "Empty wardrobe",
        },
        occasionContext: {
          occasion: "casual",
          formality: "casual",
          tone: [],
          rawInput: "test",
        },
      };

      await expect(
        recommender.generateRecommendations(requestWithEmptyItems)
      ).rejects.toThrow("Clothing analysis must contain at least one item");
    });

    it("should throw error when occasion is missing", async () => {
      const requestWithoutOccasion: RecommendationRequest = {
        clothingAnalysis: {
          items: [{ type: "shirt", color: "blue", style: "casual" }],
          overallStyle: "casual",
          colorPalette: ["blue"],
          summary: "Test",
        },
        occasionContext: {
          occasion: "",
          formality: "casual",
          tone: [],
          rawInput: "test",
        },
      };

      await expect(
        recommender.generateRecommendations(requestWithoutOccasion)
      ).rejects.toThrow("Occasion context must specify an occasion");
    });

    it("should throw error when Claude API call fails", async () => {
      const errorService = new ErrorMockService();
      const errorRecommender = new RecommenderEngine(
        errorService,
        mockVisionService,
        mockContextParser
      );

      const validRequest: RecommendationRequest = {
        clothingAnalysis: {
          items: [{ type: "shirt", color: "blue", style: "casual" }],
          overallStyle: "casual",
          colorPalette: ["blue"],
          summary: "Test",
        },
        occasionContext: {
          occasion: "casual",
          formality: "casual",
          tone: [],
          rawInput: "test",
        },
      };

      await expect(errorRecommender.generateRecommendations(validRequest)).rejects.toThrow(
        "Claude API failed"
      );
    });

    it("should throw error when response is malformed JSON", async () => {
      const malformedService = new MalformedJsonMockService();
      const malformedRecommender = new RecommenderEngine(
        malformedService,
        mockVisionService,
        mockContextParser
      );

      const validRequest: RecommendationRequest = {
        clothingAnalysis: {
          items: [{ type: "shirt", color: "blue", style: "casual" }],
          overallStyle: "casual",
          colorPalette: ["blue"],
          summary: "Test",
        },
        occasionContext: {
          occasion: "casual",
          formality: "casual",
          tone: [],
          rawInput: "test",
        },
      };

      await expect(
        malformedRecommender.generateRecommendations(validRequest)
      ).rejects.toThrow("Failed to parse recommendation response");
    });

    it("should throw error when response is missing required fields", async () => {
      const incompleteService = new IncompleteJsonMockService();
      const incompleteRecommender = new RecommenderEngine(
        incompleteService,
        mockVisionService,
        mockContextParser
      );

      const validRequest: RecommendationRequest = {
        clothingAnalysis: {
          items: [{ type: "shirt", color: "blue", style: "casual" }],
          overallStyle: "casual",
          colorPalette: ["blue"],
          summary: "Test",
        },
        occasionContext: {
          occasion: "casual",
          formality: "casual",
          tone: [],
          rawInput: "test",
        },
      };

      await expect(
        incompleteRecommender.generateRecommendations(validRequest)
      ).rejects.toThrow();
    });
  });

  describe("generateRecommendations - Edge Cases", () => {
    it("should handle minimal occasion context", async () => {
      const minimalRequest: RecommendationRequest = {
        clothingAnalysis: {
          items: [{ type: "shirt", color: "blue", style: "casual" }],
          overallStyle: "casual",
          colorPalette: ["blue"],
          summary: "Simple wardrobe",
        },
        occasionContext: {
          occasion: "casual",
          formality: "casual",
          tone: [],
          rawInput: "casual",
        },
      };

      const result = await recommender.generateRecommendations(minimalRequest);

      expect(result).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it("should handle large number of clothing items", async () => {
      const manyItems = Array.from({ length: 20 }, (_, i) => ({
        type: `item${i}`,
        color: `color${i}`,
        style: "casual",
      }));

      const largeRequest: RecommendationRequest = {
        clothingAnalysis: {
          items: manyItems,
          overallStyle: "diverse",
          colorPalette: Array.from({ length: 10 }, (_, i) => `color${i}`),
          summary: "Large and diverse wardrobe",
        },
        occasionContext: {
          occasion: "party",
          formality: "casual",
          tone: ["fun", "stylish"],
          rawInput: "party",
        },
      };

      const result = await recommender.generateRecommendations(largeRequest);

      expect(result).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it("should handle optional fields in clothing items", async () => {
      const requestWithOptionalFields: RecommendationRequest = {
        clothingAnalysis: {
          items: [
            {
              type: "blazer",
              color: "navy",
              style: "formal",
              material: "wool",
              condition: "excellent",
            },
            {
              type: "shirt",
              color: "white",
              style: "formal",
              // no material or condition
            },
          ],
          overallStyle: "formal",
          colorPalette: ["navy", "white"],
          summary: "Formal wardrobe",
        },
        occasionContext: {
          occasion: "interview",
          formality: "formal",
          tone: ["professional"],
          rawInput: "job interview",
        },
      };

      const result = await recommender.generateRecommendations(requestWithOptionalFields);

      expect(result).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it("should handle responses with null optional fields", async () => {
      const minimalService = new MinimalResponseMockService();
      const minimalRecommender = new RecommenderEngine(
        minimalService,
        mockVisionService,
        mockContextParser
      );

      const request: RecommendationRequest = {
        clothingAnalysis: {
          items: [{ type: "shirt", color: "blue", style: "casual" }],
          overallStyle: "casual",
          colorPalette: ["blue"],
          summary: "Casual wardrobe",
        },
        occasionContext: {
          occasion: "casual",
          formality: "casual",
          tone: [],
          rawInput: "casual day",
        },
      };

      const result = await minimalRecommender.generateRecommendations(request);

      expect(result).toBeDefined();
      expect(result.occasion).toBe("casual");
      expect(result.recommendations.length).toBeGreaterThan(0);
      // Optional fields should be undefined when null in response
      expect(result.location).toBeUndefined();
    });

    it("should handle complex occasion contexts with all fields", async () => {
      const complexRequest: RecommendationRequest = {
        clothingAnalysis: {
          items: [
            { type: "suit", color: "charcoal", style: "formal", material: "wool" },
            { type: "shirt", color: "white", style: "formal", material: "cotton" },
            { type: "tie", color: "red", style: "formal", material: "silk" },
          ],
          overallStyle: "formal",
          colorPalette: ["charcoal", "white", "red"],
          summary: "Complete formal business attire",
        },
        occasionContext: {
          occasion: "business",
          location: "Tokyo",
          formality: "formal",
          tone: ["professional", "conservative", "elegant"],
          weatherConsideration: "cold",
          culturalNotes: "Business in Japan values formality and respect",
          preferences: ["traditional", "conservative"],
          rawInput:
            "formal business meeting in Tokyo, cold weather, prefer traditional conservative style",
        },
      };

      const result = await recommender.generateRecommendations(complexRequest);

      expect(result).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.occasion).toBeTruthy();
      expect(result.summary).toBeTruthy();
    });
  });

  describe("Integration with ClaudeAPIService", () => {
    it("should call claudeService.callClaude with a prompt", async () => {
      const spy = jest.spyOn(mockClaudeService, "callClaude");

      const request: RecommendationRequest = {
        clothingAnalysis: {
          items: [{ type: "shirt", color: "blue", style: "casual" }],
          overallStyle: "casual",
          colorPalette: ["blue"],
          summary: "Casual wardrobe",
        },
        occasionContext: {
          occasion: "casual",
          formality: "casual",
          tone: [],
          rawInput: "casual day",
        },
      };

      await recommender.generateRecommendations(request);

      expect(spy).toHaveBeenCalledWith(expect.any(String), expect.any(Object));
      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockRestore();
    });

    it("should pass clothing items in the prompt", async () => {
      const spy = jest.spyOn(mockClaudeService, "callClaude");

      const request: RecommendationRequest = {
        clothingAnalysis: {
          items: [
            { type: "shirt", color: "blue", style: "casual" },
            { type: "pants", color: "black", style: "formal" },
          ],
          overallStyle: "business-casual",
          colorPalette: ["blue", "black"],
          summary: "Mixed wardrobe",
        },
        occasionContext: {
          occasion: "business",
          formality: "business-casual",
          tone: [],
          rawInput: "business meeting",
        },
      };

      await recommender.generateRecommendations(request);

      const callArgs = spy.mock.calls[0];
      const prompt = callArgs[0];

      expect(prompt).toContain("shirt");
      expect(prompt).toContain("blue");
      expect(prompt).toContain("pants");
      expect(prompt).toContain("black");

      spy.mockRestore();
    });

    it("should pass occasion context in the prompt", async () => {
      const spy = jest.spyOn(mockClaudeService, "callClaude");

      const request: RecommendationRequest = {
        clothingAnalysis: {
          items: [{ type: "shirt", color: "blue", style: "casual" }],
          overallStyle: "casual",
          colorPalette: ["blue"],
          summary: "Casual wardrobe",
        },
        occasionContext: {
          occasion: "wedding",
          location: "Japan",
          formality: "formal",
          tone: ["elegant"],
          rawInput: "wedding in Japan",
        },
      };

      await recommender.generateRecommendations(request);

      const callArgs = spy.mock.calls[0];
      const prompt = callArgs[0];

      expect(prompt).toContain("wedding");
      expect(prompt).toContain("Japan");
      expect(prompt).toContain("formal");
      expect(prompt).toContain("elegant");

      spy.mockRestore();
    });

    it("should request JSON format in the prompt", async () => {
      const spy = jest.spyOn(mockClaudeService, "callClaude");

      const request: RecommendationRequest = {
        clothingAnalysis: {
          items: [{ type: "shirt", color: "blue", style: "casual" }],
          overallStyle: "casual",
          colorPalette: ["blue"],
          summary: "Casual wardrobe",
        },
        occasionContext: {
          occasion: "casual",
          formality: "casual",
          tone: [],
          rawInput: "casual day",
        },
      };

      await recommender.generateRecommendations(request);

      const callArgs = spy.mock.calls[0];
      const prompt = callArgs[0];

      expect(prompt).toContain("JSON");
      expect(prompt).toContain("recommendations");
      expect(prompt).toContain("summary");

      spy.mockRestore();
    });

    it("should pass options to claudeService.callClaude", async () => {
      const spy = jest.spyOn(mockClaudeService, "callClaude");

      const request: RecommendationRequest = {
        clothingAnalysis: {
          items: [{ type: "shirt", color: "blue", style: "casual" }],
          overallStyle: "casual",
          colorPalette: ["blue"],
          summary: "Casual wardrobe",
        },
        occasionContext: {
          occasion: "casual",
          formality: "casual",
          tone: [],
          rawInput: "casual day",
        },
      };

      await recommender.generateRecommendations(request);

      expect(spy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          maxTokens: expect.any(Number),
          temperature: expect.any(Number),
        })
      );

      spy.mockRestore();
    });
  });
});
