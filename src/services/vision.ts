import { ClaudeAPIService, ClothingAnalysis, ClothingItem, VisionService } from "../types";

/**
 * Module 2: Vision Service
 * Uses Claude Vision API to analyze clothing items from images
 *
 * This module:
 * - Takes base64-encoded images as input
 * - Calls Claude Vision API to analyze clothing
 * - Parses Claude's response into structured ClothingAnalysis
 * - Returns detailed clothing information (items, colors, styles, etc.)
 */

export class VisionServiceImpl implements VisionService {
  constructor(private claudeService: ClaudeAPIService) {}

  /**
   * Analyze clothing items in an image
   *
   * @param imageBase64 Base64-encoded image (JPG, PNG, GIF, WebP)
   * @returns ClothingAnalysis with items, overall style, colors, and summary
   *
   * @example
   * const analysis = await visionService.analyzeClothing(imageBase64);
   * // Returns:
   * // {
   * //   items: [
   * //     { type: "shirt", color: "blue", style: "casual", material: "cotton" },
   * //     { type: "pants", color: "black", style: "formal" }
   * //   ],
   * //   overallStyle: "business-casual",
   * //   colorPalette: ["blue", "black", "white"],
   * //   summary: "Professional wardrobe with business-casual pieces..."
   * // }
   */
  async analyzeClothing(imageBase64: string): Promise<ClothingAnalysis> {
    // Validate input
    if (!imageBase64 || imageBase64.trim().length === 0) {
      throw new Error("Image data (base64) is required for analysis");
    }

    // Crafted prompt for Claude Vision to extract structured clothing information
    const prompt = `Analyze this clothing image and provide structured information in JSON format.

Extract the following:
1. Each visible clothing item (type, color, style, material if visible, condition if notable)
2. Overall style assessment (formal, casual, sporty, vintage, bohemian, athletic, business-casual, etc.)
3. Dominant color palette used in the wardrobe
4. Human-readable summary of what's visible

Return ONLY valid JSON with this exact structure (no markdown, no extra text):
{
  "items": [
    {
      "type": "clothing item type",
      "color": "color description",
      "style": "style classification",
      "material": "material if visible (optional)",
      "condition": "condition if notable (optional)"
    }
  ],
  "overallStyle": "overall style assessment",
  "colorPalette": ["color1", "color2", "color3"],
  "summary": "brief human-readable summary of the wardrobe"
}

Be specific and accurate. If uncertain about details, provide your best assessment.`;

    try {
      // Call Claude Vision API
      const response = await this.claudeService.callClaudeVision(imageBase64, prompt);

      // Parse the response into ClothingAnalysis
      const analysis = this.parseResponse(response);

      return analysis;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Parse Claude's response into ClothingAnalysis structure
   *
   * @param response Raw response from Claude Vision API
   * @returns Structured ClothingAnalysis object
   *
   * @throws Error if JSON parsing fails or structure is invalid
   */
  private parseResponse(response: string): ClothingAnalysis {
    try {
      // Extract JSON from response (handle cases where Claude adds extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in Claude response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate structure
      if (!Array.isArray(parsed.items)) {
        throw new Error("Invalid response structure: 'items' must be an array");
      }

      if (typeof parsed.overallStyle !== "string") {
        throw new Error("Invalid response structure: 'overallStyle' must be a string");
      }

      if (!Array.isArray(parsed.colorPalette)) {
        throw new Error("Invalid response structure: 'colorPalette' must be an array");
      }

      if (typeof parsed.summary !== "string") {
        throw new Error("Invalid response structure: 'summary' must be a string");
      }

      // Validate and clean up items
      const items: ClothingItem[] = parsed.items.map((item: any) => {
        if (!item.type || !item.color || !item.style) {
          throw new Error("Each clothing item must have type, color, and style");
        }

        const cleanedItem: ClothingItem = {
          type: String(item.type).trim(),
          color: String(item.color).trim(),
          style: String(item.style).trim(),
        };

        // Optional fields
        if (item.material) {
          cleanedItem.material = String(item.material).trim();
        }
        if (item.condition) {
          cleanedItem.condition = String(item.condition).trim();
        }

        return cleanedItem;
      });

      return {
        items,
        overallStyle: parsed.overallStyle.trim(),
        colorPalette: parsed.colorPalette.map((c: any) => String(c).trim()),
        summary: parsed.summary.trim(),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse Vision API response: ${error.message}`);
      }
      throw new Error("Failed to parse Vision API response: Unknown error");
    }
  }

  /**
   * Handle errors with descriptive messages
   */
  private handleError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    if (typeof error === "object" && error !== null && "message" in error) {
      return new Error(String((error as any).message));
    }

    return new Error(`Vision service error: ${String(error)}`);
  }
}

/**
 * Factory function to create Vision service instance
 * Useful for dependency injection
 */
export function createVisionService(claudeService: ClaudeAPIService): VisionService {
  return new VisionServiceImpl(claudeService);
}
