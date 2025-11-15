import Anthropic from "@anthropic-ai/sdk";
import { ClaudeAPIService, CallOptions } from "../types";

/**
 * Module 1: Claude API Service
 * Wrapper around Anthropic's Claude API for text and vision calls
 *
 * This module handles:
 * - Authentication with Claude API
 * - Text-based prompts (callClaude)
 * - Vision API calls with images (callClaudeVision)
 * - Error handling and logging
 */

export class ClaudeService implements ClaudeAPIService {
  private client: Anthropic;
  private model: string = "claude-sonnet-4-5-20250929";

  constructor(apiKey?: string) {
    const key = apiKey || process.env.CLAUDE_API_KEY;

    if (!key) {
      throw new Error(
        "CLAUDE_API_KEY environment variable is not set. " +
        "Please add it to your .env file or pass it to the constructor."
      );
    }

    this.client = new Anthropic({ apiKey: key });
  }

  /**
   * Call Claude with a text prompt
   *
   * @param prompt The prompt to send to Claude
   * @param options Optional: maxTokens, temperature, topP
   * @returns Claude's response text
   *
   * @example
   * const response = await claudeService.callClaude(
   *   "What clothing would work best for a beach wedding?"
   * );
   */
  async callClaude(prompt: string, options?: CallOptions): Promise<string> {
    try {
      if (!prompt || prompt.trim().length === 0) {
        throw new Error("Prompt cannot be empty");
      }

      if (process.env.NODE_ENV === "development") {
        console.log(`[Claude API] Calling with prompt: ${prompt.substring(0, 100)}...`);
      }

      const requestBody: any = {
        model: this.model,
        max_tokens: options?.maxTokens || 1024,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      };

      // Some models don't accept both temperature and top_p
      if (options?.temperature !== undefined) {
        requestBody.temperature = options.temperature;
      } else {
        requestBody.temperature = 0.7;
      }

      // Only add top_p if temperature is not specified
      if (options?.temperature === undefined && options?.topP !== undefined) {
        requestBody.top_p = options.topP;
      }

      const response = await this.client.messages.create(requestBody);

      // Extract text from response
      const textContent = response.content.find((block) => block.type === "text");
      if (!textContent || textContent.type !== "text") {
        throw new Error("No text content in Claude response");
      }

      if (process.env.NODE_ENV === "development") {
        console.log(`[Claude API] Response received (${response.usage.output_tokens} tokens)`);
      }

      return textContent.text;
    } catch (error) {
      throw this.handleError(error, "callClaude");
    }
  }

  /**
   * Call Claude Vision API with an image
   *
   * Analyzes images and answers questions about them
   *
   * @param imageBase64 Base64-encoded image data (JPG, PNG, GIF, or WebP)
   * @param prompt The question/prompt for the image analysis
   * @returns Claude's vision analysis response
   *
   * @example
   * const analysis = await claudeService.callClaudeVision(
   *   imageBase64,
   *   "List all clothing items visible in this image with colors and styles"
   * );
   */
  async callClaudeVision(imageBase64: string, prompt: string): Promise<string> {
    try {
      if (!imageBase64 || imageBase64.trim().length === 0) {
        throw new Error("Image data (base64) cannot be empty");
      }

      if (!prompt || prompt.trim().length === 0) {
        throw new Error("Prompt cannot be empty");
      }

      // Validate base64 format (rough check)
      if (!this.isValidBase64(imageBase64)) {
        throw new Error("Invalid base64 image data");
      }

      if (process.env.NODE_ENV === "development") {
        console.log(`[Claude Vision] Analyzing image with prompt: ${prompt.substring(0, 100)}...`);
      }

      // Determine media type from base64 header (if present) or magic bytes
      let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/jpeg";
      let base64Data = imageBase64;

      // Remove data URI prefix if present
      if (imageBase64.includes(",")) {
        const prefix = imageBase64.split(",")[0];
        base64Data = imageBase64.split(",")[1];

        // Check for explicit media type in data URI
        if (prefix.includes("image/png")) {
          mediaType = "image/png";
        } else if (prefix.includes("image/gif")) {
          mediaType = "image/gif";
        } else if (prefix.includes("image/webp")) {
          mediaType = "image/webp";
        }
      } else {
        // No data URI prefix, detect from magic bytes (first few characters of base64)
        // Decode first 12 bytes to check magic numbers
        try {
          const buffer = Buffer.from(base64Data.substring(0, 24), "base64");

          // PNG: 89 50 4E 47
          if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
            mediaType = "image/png";
          }
          // JPEG: FF D8 FF
          else if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
            mediaType = "image/jpeg";
          }
          // GIF: 47 49 46
          else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
            mediaType = "image/gif";
          }
          // WEBP: RIFF ... WEBP
          else if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
            mediaType = "image/webp";
          }
        } catch {
          // If detection fails, default to jpeg
          mediaType = "image/jpeg";
        }
      }

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64Data,
                },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
      });

      // Extract text from response
      const textContent = response.content.find((block) => block.type === "text");
      if (!textContent || textContent.type !== "text") {
        throw new Error("No text content in Claude Vision response");
      }

      if (process.env.NODE_ENV === "development") {
        console.log(`[Claude Vision] Analysis complete (${response.usage.output_tokens} tokens)`);
      }

      return textContent.text;
    } catch (error) {
      throw this.handleError(error, "callClaudeVision");
    }
  }

  /**
   * Validate if a string is proper base64 format
   * Simple validation - not foolproof but catches most issues
   */
  private isValidBase64(str: string): boolean {
    try {
      // Remove data URI prefix if present
      const base64String = str.includes(",") ? str.split(",")[1] : str;
      // Base64 regex pattern
      const base64Pattern = /^[A-Za-z0-9+/=]+$/;
      return base64Pattern.test(base64String);
    } catch {
      return false;
    }
  }

  /**
   * Handle errors with proper logging and messages
   */
  private handleError(error: unknown, methodName: string): Error {
    console.error(`[Claude API Error] ${methodName}:`, error);

    // Check if it's an Anthropic API error (check by class name to avoid instanceof issues with mocks)
    if (error && typeof error === "object" && "status" in error) {
      const apiError = error as { status: number; message?: string };
      if (apiError.status === 401) {
        return new Error("Invalid Claude API key. Check your CLAUDE_API_KEY environment variable.");
      } else if (apiError.status === 429) {
        return new Error("Claude API rate limit exceeded. Please try again in a moment.");
      } else if (apiError.status === 500) {
        return new Error("Claude API server error. Please try again later.");
      }
      return new Error(`Claude API error: ${apiError.message || "Unknown error"}`);
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error(`Unknown error in ${methodName}: ${String(error)}`);
  }
}

/**
 * Factory function to create Claude service instance
 * Useful for dependency injection
 */
export function createClaudeService(apiKey?: string): ClaudeAPIService {
  return new ClaudeService(apiKey);
}
