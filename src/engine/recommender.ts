/**
 * Module 4: Recommender Engine
 * Synthesizes clothing analysis + occasion context into personalized outfit recommendations
 *
 * Dependencies:
 * - Module 1 (ClaudeAPIService): For making AI recommendations
 * - Module 2 (VisionService): Type only, not used directly
 * - Module 3 (ContextParser): Type only, not used directly
 *
 * This module takes:
 * - ClothingAnalysis (from Vision Service)
 * - OccasionContext (from Context Parser)
 *
 * And produces:
 * - RecommendationResponse with outfit suggestions, cultural tips, shopping advice
 */

import {
  ClaudeAPIService,
  RecommenderEngine as IRecommenderEngine,
  RecommendationRequest,
  RecommendationResponse,
} from "../types";

export class RecommenderEngine implements IRecommenderEngine {
  constructor(private claudeService: ClaudeAPIService) {}

  /**
   * Generate personalized fashion recommendations
   *
   * @param request Contains clothing analysis and occasion context
   * @returns Personalized recommendations with outfit suggestions
   *
   * @example
   * const recommendations = await recommender.generateRecommendations({
   *   clothingAnalysis: { items: [...], overallStyle: "business", ... },
   *   occasionContext: { occasion: "wedding", location: "Japan", ... }
   * });
   */
  async generateRecommendations(
    request: RecommendationRequest
  ): Promise<RecommendationResponse> {
    // Validate input
    if (!request.clothingAnalysis || !request.occasionContext) {
      throw new Error(
        "Both clothingAnalysis and occasionContext are required for recommendations"
      );
    }

    if (!request.clothingAnalysis.items || request.clothingAnalysis.items.length === 0) {
      throw new Error("Clothing analysis must contain at least one item");
    }

    if (!request.occasionContext.occasion) {
      throw new Error("Occasion context must specify an occasion");
    }

    try {
      // 1. Build structured prompt
      const prompt = this.buildPrompt(request);

      // 2. Call Claude API
      const response = await this.claudeService.callClaude(prompt, {
        maxTokens: 2048, // More tokens for detailed recommendations
        temperature: 0.7, // Balanced creativity and consistency
      });

      // 3. Parse Claude's response into structured format
      const recommendations = this.parseResponse(response, request.occasionContext);

      // 4. Validate response structure
      this.validateResponse(recommendations);

      // 5. Return recommendations
      return recommendations;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Build a comprehensive prompt for Claude
   *
   * Includes:
   * - User's wardrobe (from clothing analysis)
   * - Occasion details (from context parser)
   * - Clear instructions for JSON output
   */
  private buildPrompt(request: RecommendationRequest): string {
    const { clothingAnalysis, occasionContext } = request;

    // Format clothing items for clarity
    const itemsList = clothingAnalysis.items
      .map(
        (item, idx) =>
          `${idx + 1}. ${item.type} - ${item.color}, ${item.style}${
            item.material ? `, ${item.material}` : ""
          }${item.condition ? ` (${item.condition})` : ""}`
      )
      .join("\n");

    return `You are a professional fashion advisor with expertise in cultural awareness, style matching, and occasion-appropriate attire.

TASK: Provide personalized outfit recommendations based on the user's wardrobe and their upcoming occasion.

USER'S WARDROBE:
Overall Style: ${clothingAnalysis.overallStyle}
Color Palette: ${clothingAnalysis.colorPalette.join(", ")}
Available Items:
${itemsList}

Summary: ${clothingAnalysis.summary}

OCCASION DETAILS:
- Event Type: ${occasionContext.occasion}
- Location: ${occasionContext.location || "Not specified"}
- Formality Level: ${occasionContext.formality}
- Desired Tone/Style: ${occasionContext.tone?.join(", ") || "Not specified"}
- Weather Considerations: ${occasionContext.weatherConsideration || "Not specified"}
- Cultural Notes: ${occasionContext.culturalNotes || "None"}
- User Preferences: ${occasionContext.preferences?.join(", ") || "None"}

INSTRUCTIONS:
1. Provide 3-5 specific outfit combinations using items from their wardrobe
2. Write a brief summary of overall fashion advice for this occasion
3. Include cultural tips if the location has specific dress code expectations
4. List what they should avoid wearing for this occasion
5. Suggest shopping items ONLY if essential pieces are missing from their wardrobe

IMPORTANT:
- Use ONLY the items listed in their wardrobe for outfit recommendations
- Be specific about which items to combine
- Consider cultural appropriateness for the location
- Account for weather and formality level
- Provide actionable, practical advice

Return your response as VALID JSON with this exact structure (no markdown code blocks, no extra text):
{
  "occasion": "${occasionContext.occasion}",
  "location": ${occasionContext.location ? `"${occasionContext.location}"` : "null"},
  "summary": "overall fashion advice for this occasion in 2-3 sentences",
  "recommendations": [
    "specific outfit combination 1 using their wardrobe items",
    "specific outfit combination 2 using their wardrobe items",
    "specific outfit combination 3 using their wardrobe items"
  ],
  "culturalTips": ["tip 1", "tip 2"] or null if no location-specific tips,
  "dontWear": ["what to avoid 1", "what to avoid 2"],
  "shoppingTips": ["essential item to buy 1"] or null if wardrobe is complete
}`;
  }

  /**
   * Parse Claude's response into RecommendationResponse
   *
   * Handles cases where Claude might add extra text around the JSON
   */
  private parseResponse(
    response: string,
    occasionContext: any
  ): RecommendationResponse {
    try {
      // Extract JSON from response (handles cases where Claude adds markdown or text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in Claude's response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Build response with defaults for optional fields
      const recommendation: RecommendationResponse = {
        occasion: parsed.occasion || occasionContext.occasion || "Unknown",
        location: parsed.location || occasionContext.location || undefined,
        summary: parsed.summary || "",
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations
          : [],
        culturalTips: Array.isArray(parsed.culturalTips)
          ? parsed.culturalTips
          : undefined,
        dontWear: Array.isArray(parsed.dontWear) ? parsed.dontWear : undefined,
        shoppingTips: Array.isArray(parsed.shoppingTips)
          ? parsed.shoppingTips
          : undefined,
      };

      return recommendation;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse recommendation response: ${error.message}`);
      }
      throw new Error("Failed to parse recommendation response: Unknown error");
    }
  }

  /**
   * Validate that the response has required fields
   */
  private validateResponse(response: RecommendationResponse): void {
    if (!response.occasion || response.occasion.trim().length === 0) {
      throw new Error("Recommendation response must include an occasion");
    }

    if (!response.summary || response.summary.trim().length === 0) {
      throw new Error("Recommendation response must include a summary");
    }

    if (!response.recommendations || response.recommendations.length === 0) {
      throw new Error(
        "Recommendation response must include at least one outfit recommendation"
      );
    }

    // Validate that recommendations are non-empty strings
    for (const rec of response.recommendations) {
      if (typeof rec !== "string" || rec.trim().length === 0) {
        throw new Error("All recommendations must be non-empty strings");
      }
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

    return new Error(`Recommender engine error: ${String(error)}`);
  }
}

/**
 * Factory function to create Recommender Engine instance
 * Useful for dependency injection
 */
export function createRecommenderEngine(
  claudeService: ClaudeAPIService
): IRecommenderEngine {
  return new RecommenderEngine(claudeService);
}
