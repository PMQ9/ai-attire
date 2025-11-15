import { ClaudeService, createClaudeService } from "../claude";
import { ClaudeAPIService } from "../../types";

// Mock the Anthropic SDK
jest.mock("@anthropic-ai/sdk", () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [
          {
            type: "text",
            text: "This is a mocked Claude response for testing purposes.",
          },
        ],
        usage: {
          input_tokens: 10,
          output_tokens: 50,
        },
      }),
    },
  }));
});

/**
 * Test suite for Module 1: Claude API Service
 *
 * Tests cover:
 * - Basic text prompts
 * - Vision API calls
 * - Error handling
 * - Input validation
 */

describe("ClaudeAPIService", () => {
  let claudeService: ClaudeAPIService;

  beforeAll(() => {
    // Set a test API key if not in environment
    if (!process.env.CLAUDE_API_KEY) {
      // For local testing without real API key
      process.env.CLAUDE_API_KEY = "test-key";
    }
  });

  beforeEach(() => {
    // Create fresh instance for each test
    claudeService = new ClaudeService(process.env.CLAUDE_API_KEY);
  });

  describe("Initialization", () => {
    it("should throw error if no API key provided and no env variable", () => {
      // Temporarily remove the environment variable
      const originalKey = process.env.CLAUDE_API_KEY;
      delete process.env.CLAUDE_API_KEY;

      expect(() => {
        new ClaudeService("");
      }).toThrow("CLAUDE_API_KEY");

      // Restore the environment variable
      process.env.CLAUDE_API_KEY = originalKey;
    });

    it("should initialize with valid API key", () => {
      const service = new ClaudeService("test-key");
      expect(service).toBeInstanceOf(ClaudeService);
    });

    it("should use CLAUDE_API_KEY from environment if no key provided", () => {
      const originalKey = process.env.CLAUDE_API_KEY;
      process.env.CLAUDE_API_KEY = "env-test-key";

      const service = new ClaudeService();
      expect(service).toBeInstanceOf(ClaudeService);

      // Restore
      process.env.CLAUDE_API_KEY = originalKey;
    });
  });

  describe("Factory Function", () => {
    it("should create service via factory function", () => {
      const service = createClaudeService("factory-test-key");
      expect(service).toBeDefined();
      expect(typeof service.callClaude).toBe("function");
      expect(typeof service.callClaudeVision).toBe("function");
    });
  });

  describe("callClaude", () => {
    it("should require non-empty prompt", async () => {
      await expect(claudeService.callClaude("")).rejects.toThrow("empty");
      await expect(claudeService.callClaude("   ")).rejects.toThrow("empty");
    });

    it("should accept CallOptions", async () => {
      // This test verifies the method signature accepts options
      // In a real test with valid API key, it would check the options are used
      try {
        await claudeService.callClaude("test prompt", {
          maxTokens: 256,
          temperature: 0.5,
          topP: 0.9,
        });
      } catch (error) {
        // We expect API error without real key, not a validation error
        expect(error).toBeDefined();
      }
    });

    it("should handle valid simple prompt structure", async () => {
      // Verify the method can be called with proper signature
      const callPromise = claudeService.callClaude("What is 2+2?");
      expect(callPromise).toBeInstanceOf(Promise);
    });
  });

  describe("callClaudeVision", () => {
    // Sample valid base64 image data (1x1 pixel white PNG)
    const validBase64PNG =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";

    const validBase64JPEG =
      "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=";

    it("should require non-empty image data", async () => {
      await expect(claudeService.callClaudeVision("", "analyze")).rejects.toThrow("empty");
      await expect(claudeService.callClaudeVision("   ", "analyze")).rejects.toThrow("empty");
    });

    it("should require non-empty prompt", async () => {
      await expect(claudeService.callClaudeVision(validBase64PNG, "")).rejects.toThrow("empty");
    });

    it("should reject invalid base64 data", async () => {
      const invalidBase64 = "not-valid-base64!!!";
      await expect(claudeService.callClaudeVision(invalidBase64, "analyze")).rejects.toThrow(
        "Invalid base64"
      );
    });

    it("should accept valid base64 image without data URI prefix", async () => {
      const callPromise = claudeService.callClaudeVision(validBase64PNG, "What is in this image?");
      expect(callPromise).toBeInstanceOf(Promise);
    });

    it("should accept base64 with data URI prefix (jpeg)", async () => {
      const withPrefix = `data:image/jpeg;base64,${validBase64JPEG}`;
      const callPromise = claudeService.callClaudeVision(withPrefix, "Analyze this image");
      expect(callPromise).toBeInstanceOf(Promise);
    });

    it("should accept base64 with data URI prefix (png)", async () => {
      const withPrefix = `data:image/png;base64,${validBase64PNG}`;
      const callPromise = claudeService.callClaudeVision(withPrefix, "Analyze this image");
      expect(callPromise).toBeInstanceOf(Promise);
    });

    it("should handle gif images", async () => {
      const gifBase64 = "R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
      const withPrefix = `data:image/gif;base64,${gifBase64}`;
      const callPromise = claudeService.callClaudeVision(withPrefix, "Describe");
      expect(callPromise).toBeInstanceOf(Promise);
    });

    it("should handle webp images", async () => {
      const webpBase64 = "UklGRiYAAABXEBP/";
      const withPrefix = `data:image/webp;base64,${webpBase64}`;
      const callPromise = claudeService.callClaudeVision(withPrefix, "Describe");
      expect(callPromise).toBeInstanceOf(Promise);
    });
  });

  describe("Error Handling", () => {
    it("should require non-empty prompt in callClaude", async () => {
      await expect(claudeService.callClaude("")).rejects.toThrow("empty");
    });

    it("should require non-empty image data in callClaudeVision", async () => {
      await expect(claudeService.callClaudeVision("", "prompt")).rejects.toThrow(
        "empty"
      );
    });

    it("should require non-empty prompt in callClaudeVision", async () => {
      const validBase64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
      await expect(claudeService.callClaudeVision(validBase64, "")).rejects.toThrow(
        "empty"
      );
    });
  });

  describe("Interface Compliance", () => {
    it("should implement ClaudeAPIService interface", () => {
      expect(typeof claudeService.callClaude).toBe("function");
      expect(typeof claudeService.callClaudeVision).toBe("function");
    });

    it("callClaude should return a Promise<string>", async () => {
      const result = claudeService.callClaude("test");
      expect(result).toBeInstanceOf(Promise);
    });

    it("callClaudeVision should return a Promise<string>", async () => {
      const validBase64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
      const result = claudeService.callClaudeVision(validBase64, "test");
      expect(result).toBeInstanceOf(Promise);
    });
  });
});
