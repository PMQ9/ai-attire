import { VisionServiceImpl } from "../vision";
import { ClaudeAPIService } from "../../types";

/**
 * Mock Claude API Service for testing
 * Allows us to test VisionService logic without calling real API
 */
class MockClaudeService implements ClaudeAPIService {
  async callClaude(_prompt: string): Promise<string> {
    return "Mock response";
  }

  async callClaudeVision(_imageBase64: string, _prompt: string): Promise<string> {
    // Return valid JSON response that matches expected structure
    return JSON.stringify({
      items: [
        {
          type: "shirt",
          color: "blue",
          style: "casual",
          material: "cotton",
        },
        {
          type: "pants",
          color: "black",
          style: "formal",
        },
      ],
      overallStyle: "business-casual",
      colorPalette: ["blue", "black", "white"],
      summary: "Professional wardrobe with business-casual pieces",
    });
  }
}

/**
 * Mock service that returns malformed JSON
 */
class MalformedResponseMockService implements ClaudeAPIService {
  async callClaude(_prompt: string): Promise<string> {
    return "Mock response";
  }

  async callClaudeVision(_imageBase64: string, _prompt: string): Promise<string> {
    return "This is not JSON at all";
  }
}

/**
 * Mock service that returns incomplete JSON
 */
class IncompleteJsonMockService implements ClaudeAPIService {
  async callClaude(_prompt: string): Promise<string> {
    return "Mock response";
  }

  async callClaudeVision(_imageBase64: string, _prompt: string): Promise<string> {
    return JSON.stringify({
      items: [{ type: "shirt", color: "blue" }], // missing 'style' field
      overallStyle: "casual",
      colorPalette: ["blue"],
      summary: "Test wardrobe",
    });
  }
}

/**
 * Mock service that returns valid JSON with extra text
 */
class JsonWithExtraTextMockService implements ClaudeAPIService {
  async callClaude(_prompt: string): Promise<string> {
    return "Mock response";
  }

  async callClaudeVision(_imageBase64: string, _prompt: string): Promise<string> {
    return `Here's the analysis:

${JSON.stringify({
  items: [{ type: "shirt", color: "blue", style: "casual" }],
  overallStyle: "casual",
  colorPalette: ["blue"],
  summary: "Casual wardrobe",
})}

That's the result.`;
  }
}

/**
 * Mock service that throws an error
 */
class ErrorMockService implements ClaudeAPIService {
  async callClaude(_prompt: string): Promise<string> {
    throw new Error("API Error");
  }

  async callClaudeVision(_imageBase64: string, _prompt: string): Promise<string> {
    throw new Error("Vision API failed");
  }
}

describe("VisionService", () => {
  let visionService: VisionServiceImpl;
  let mockClaudeService: MockClaudeService;

  beforeEach(() => {
    mockClaudeService = new MockClaudeService();
    visionService = new VisionServiceImpl(mockClaudeService);
  });

  describe("analyzeClothing - Happy Path", () => {
    it("should analyze clothing and return structured ClothingAnalysis", async () => {
      const imageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      const analysis = await visionService.analyzeClothing(imageBase64);

      expect(analysis).toBeDefined();
      expect(analysis.items).toBeDefined();
      expect(Array.isArray(analysis.items)).toBe(true);
      expect(analysis.overallStyle).toBeDefined();
      expect(analysis.colorPalette).toBeDefined();
      expect(Array.isArray(analysis.colorPalette)).toBe(true);
      expect(analysis.summary).toBeDefined();
    });

    it("should correctly parse clothing items from response", async () => {
      const imageBase64 = "test_image_base64";

      const analysis = await visionService.analyzeClothing(imageBase64);

      expect(analysis.items.length).toBe(2);

      // First item
      expect(analysis.items[0].type).toBe("shirt");
      expect(analysis.items[0].color).toBe("blue");
      expect(analysis.items[0].style).toBe("casual");
      expect(analysis.items[0].material).toBe("cotton");

      // Second item
      expect(analysis.items[1].type).toBe("pants");
      expect(analysis.items[1].color).toBe("black");
      expect(analysis.items[1].style).toBe("formal");
    });

    it("should extract overall style correctly", async () => {
      const imageBase64 = "test_image_base64";

      const analysis = await visionService.analyzeClothing(imageBase64);

      expect(analysis.overallStyle).toBe("business-casual");
    });

    it("should extract color palette correctly", async () => {
      const imageBase64 = "test_image_base64";

      const analysis = await visionService.analyzeClothing(imageBase64);

      expect(analysis.colorPalette).toEqual(["blue", "black", "white"]);
    });

    it("should extract summary correctly", async () => {
      const imageBase64 = "test_image_base64";

      const analysis = await visionService.analyzeClothing(imageBase64);

      expect(analysis.summary).toContain("Professional");
      expect(analysis.summary).toContain("business-casual");
    });

    it("should handle optional clothing item fields", async () => {
      // The second item doesn't have material and condition
      const imageBase64 = "test_image_base64";

      const analysis = await visionService.analyzeClothing(imageBase64);

      expect(analysis.items[1].material).toBeUndefined();
      expect(analysis.items[1].condition).toBeUndefined();
    });
  });

  describe("analyzeClothing - Error Handling", () => {
    it("should throw error when image is empty", async () => {
      await expect(visionService.analyzeClothing("")).rejects.toThrow(
        "Image data (base64) is required for analysis"
      );
    });

    it("should throw error when image is whitespace only", async () => {
      await expect(visionService.analyzeClothing("   \n  \t  ")).rejects.toThrow(
        "Image data (base64) is required for analysis"
      );
    });

    it("should throw error when Claude API call fails", async () => {
      const errorService = new ErrorMockService();
      const errorVisionService = new VisionServiceImpl(errorService);

      await expect(errorVisionService.analyzeClothing("test_image")).rejects.toThrow(
        "Vision API failed"
      );
    });

    it("should throw descriptive error when response is malformed JSON", async () => {
      const malformedService = new MalformedResponseMockService();
      const malformedVisionService = new VisionServiceImpl(malformedService);

      await expect(malformedVisionService.analyzeClothing("test_image")).rejects.toThrow(
        "Failed to parse Vision API response"
      );
    });

    it("should throw error when required fields are missing from JSON", async () => {
      const incompleteService = new IncompleteJsonMockService();
      const incompleteVisionService = new VisionServiceImpl(incompleteService);

      await expect(incompleteVisionService.analyzeClothing("test_image")).rejects.toThrow();
    });

    it("should handle JSON with extra text around it", async () => {
      const jsonWithTextService = new JsonWithExtraTextMockService();
      const jsonWithTextVisionService = new VisionServiceImpl(jsonWithTextService);

      const analysis = await jsonWithTextVisionService.analyzeClothing("test_image");

      expect(analysis.items).toBeDefined();
      expect(analysis.items[0].type).toBe("shirt");
      expect(analysis.items[0].color).toBe("blue");
      expect(analysis.items[0].style).toBe("casual");
    });
  });

  describe("analyzeClothing - Edge Cases", () => {
    it("should handle empty items array", async () => {
      const emptyItemsService: ClaudeAPIService = {
        async callClaude(_prompt: string): Promise<string> {
          return "Mock";
        },
        async callClaudeVision(_imageBase64: string, _prompt: string): Promise<string> {
          return JSON.stringify({
            items: [],
            overallStyle: "unknown",
            colorPalette: [],
            summary: "No items detected",
          });
        },
      };

      const testVisionService = new VisionServiceImpl(emptyItemsService);
      const analysis = await testVisionService.analyzeClothing("test_image");

      expect(analysis.items.length).toBe(0);
      expect(analysis.items).toEqual([]);
    });

    it("should trim whitespace from strings", async () => {
      const whitespaceService: ClaudeAPIService = {
        async callClaude(_prompt: string): Promise<string> {
          return "Mock";
        },
        async callClaudeVision(_imageBase64: string, _prompt: string): Promise<string> {
          return JSON.stringify({
            items: [
              {
                type: "  shirt  ",
                color: "  blue  ",
                style: "  casual  ",
              },
            ],
            overallStyle: "  casual  ",
            colorPalette: ["  blue  ", "  white  "],
            summary: "  test summary  ",
          });
        },
      };

      const testVisionService = new VisionServiceImpl(whitespaceService);
      const analysis = await testVisionService.analyzeClothing("test_image");

      expect(analysis.items[0].type).toBe("shirt");
      expect(analysis.items[0].color).toBe("blue");
      expect(analysis.items[0].style).toBe("casual");
      expect(analysis.overallStyle).toBe("casual");
      expect(analysis.colorPalette[0]).toBe("blue");
      expect(analysis.summary).toBe("test summary");
    });

    it("should handle clothing items with all optional fields", async () => {
      const completeItemService: ClaudeAPIService = {
        async callClaude(_prompt: string): Promise<string> {
          return "Mock";
        },
        async callClaudeVision(_imageBase64: string, _prompt: string): Promise<string> {
          return JSON.stringify({
            items: [
              {
                type: "jacket",
                color: "brown",
                style: "formal",
                material: "wool",
                condition: "excellent",
              },
            ],
            overallStyle: "formal",
            colorPalette: ["brown"],
            summary: "Formal jacket",
          });
        },
      };

      const testVisionService = new VisionServiceImpl(completeItemService);
      const analysis = await testVisionService.analyzeClothing("test_image");

      const item = analysis.items[0];
      expect(item.type).toBe("jacket");
      expect(item.color).toBe("brown");
      expect(item.style).toBe("formal");
      expect(item.material).toBe("wool");
      expect(item.condition).toBe("excellent");
    });

    it("should handle large number of items", async () => {
      const manyItemsService: ClaudeAPIService = {
        async callClaude(_prompt: string): Promise<string> {
          return "Mock";
        },
        async callClaudeVision(_imageBase64: string, _prompt: string): Promise<string> {
          const items = Array.from({ length: 10 }, (_, i) => ({
            type: `item${i}`,
            color: `color${i}`,
            style: "casual",
          }));

          return JSON.stringify({
            items,
            overallStyle: "casual",
            colorPalette: Array.from({ length: 10 }, (_, i) => `color${i}`),
            summary: "Large wardrobe",
          });
        },
      };

      const testVisionService = new VisionServiceImpl(manyItemsService);
      const analysis = await testVisionService.analyzeClothing("test_image");

      expect(analysis.items.length).toBe(10);
      expect(analysis.colorPalette.length).toBe(10);
    });
  });

  describe("Integration with ClaudeAPIService", () => {
    it("should pass image to claudeService.callClaudeVision", async () => {
      const spy = jest.spyOn(mockClaudeService, "callClaudeVision");
      const imageBase64 = "test_image_data";

      await visionService.analyzeClothing(imageBase64);

      expect(spy).toHaveBeenCalledWith(imageBase64, expect.any(String));
      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockRestore();
    });

    it("should pass structured prompt to claudeService", async () => {
      const spy = jest.spyOn(mockClaudeService, "callClaudeVision");
      const imageBase64 = "test_image_data";

      await visionService.analyzeClothing(imageBase64);

      const callArgs = spy.mock.calls[0];
      const prompt = callArgs[1];

      // Verify prompt contains key instructions
      expect(prompt).toContain("clothing");
      expect(prompt).toContain("JSON");
      expect(prompt).toContain("items");
      expect(prompt).toContain("color");
      expect(prompt).toContain("style");

      spy.mockRestore();
    });
  });
});
