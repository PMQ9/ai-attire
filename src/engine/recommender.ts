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
        maxTokens: 1024, // Concise recommendations
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
1. FOCUS: Create 3-5 creative outfit combinations using ONLY items from their existing wardrobe
   - Each outfit should be 1-2 sentences describing which pieces to wear together
   - Explain WHY each combination works for this occasion
   - Help them discover new ways to style what they already own
2. Provide brief styling advice explaining how to maximize their current wardrobe (1-2 sentences)
3. Include cultural/location-specific dress tips only if critically important
4. Suggest 1-2 items to AVOID wearing (style mismatch or cultural inappropriateness)
5. OPTIONAL: Only suggest shopping for items if there's a critical gap in their wardrobe
   - Example: "Only if needed: lightweight blazer for formal occasions"
   - Most users should have sufficient pieces to look great at this event

IMPORTANT:
- PRIMARY GOAL: Create great outfits from what they already own
- Keep outfit recommendations BRIEF (1-2 sentences each)
- Be SPECIFIC about which wardrobe items to combine (use exact colors/styles)
- Consider cultural appropriateness, weather, and formality level
- MINIMIZE shopping suggestions - assume their wardrobe is adequate
- Focus on styling tips and creative combinations, not on what to buy
- Provide actionable, practical advice they can use immediately

Return your response as VALID JSON with this exact structure (no markdown code blocks, no extra text):
{
  "occasion": "${occasionContext.occasion}",
  "location": ${occasionContext.location ? `"${occasionContext.location}"` : "null"},
  "summary": "how to style their wardrobe for this occasion - focus on creative combinations",
  "recommendations": [
    "outfit combo 1: specific pieces to wear together and why it works",
    "outfit combo 2: specific pieces to wear together and why it works",
    "outfit combo 3: specific pieces to wear together and why it works"
  ],
  "culturalTips": ["essential dress code requirement"] or null if no critical tips,
  "dontWear": ["item/style to avoid 1"],
  "shoppingTips": null (or only include if there's a critical gap like "missing formal shoes")
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
