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
  WeatherService,
  WeatherData,
} from "../types";

export class RecommenderEngine implements IRecommenderEngine {
  constructor(
    private claudeService: ClaudeAPIService,
    private weatherService?: WeatherService
  ) {}

  /**
   * Generate personalized fashion recommendations with a single API call
   * This is the most efficient method - sends image + occasion in one request
   *
   * @param imageBase64 Base64-encoded clothing image
   * @param occasionText User's description of the occasion
   * @param useWeather Optional: whether to fetch and include real-time weather data
   * @returns Complete response with clothing analysis, context, and recommendations
   *
   * @example
   * const result = await recommender.generateRecommendationsWithImage(
   *   imageBase64,
   *   "wedding in Japan, formal, hot weather"
   * );
   *
   * @example With weather toggle
   * const result = await recommender.generateRecommendationsWithImage(
   *   imageBase64,
   *   "wedding in Tokyo next week",
   *   true // fetch real-time weather
   * );
   */
  async generateRecommendationsWithImage(
    imageBase64: string,
    occasionText: string,
    useWeather: boolean = false
  ): Promise<RecommendationResponse> {
    // Validate inputs
    if (!imageBase64 || imageBase64.trim().length === 0) {
      throw new Error("Image data (base64) is required");
    }
    if (!occasionText || occasionText.trim().length === 0) {
      throw new Error("Occasion description is required");
    }

    try {
      // If weather toggle is enabled, use two-call flow with weather data
      if (useWeather && this.weatherService) {
        return await this.generateRecommendationsWithWeather(
          imageBase64,
          occasionText
        );
      }

      // Otherwise, use standard single-call flow
      // Build comprehensive prompt that does everything in one call
      const prompt = this.buildSingleCallPrompt(occasionText);

      // Make single Claude Vision API call
      const response = await this.claudeService.callClaudeVision(imageBase64, prompt);

      // Parse the comprehensive response
      const recommendations = this.parseSingleCallResponse(response);

      // Validate response structure
      this.validateResponse(recommendations);

      return recommendations;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generate recommendations with weather data (two-call flow)
   * Call 1: Extract location from occasion text
   * Call 2: Generate recommendations with weather context
   *
   * @param imageBase64 Base64-encoded clothing image
   * @param occasionText User's description of the occasion
   * @returns Complete response with weather-aware recommendations
   */
  private async generateRecommendationsWithWeather(
    imageBase64: string,
    occasionText: string
  ): Promise<RecommendationResponse> {
    try {
      // Step 1: Extract location from occasion text using Claude
      if (process.env.NODE_ENV === "development") {
        console.log("[Recommender] Extracting location from occasion text...");
      }

      const locationPrompt = `Extract the location (city and/or country) from this text. If there is a location mentioned, return ONLY the location name in the format "City" or "City, Country". If no location is mentioned, return "NONE".

Text: "${occasionText}"

Return only the location or "NONE", nothing else.`;

      const locationResponse = await this.claudeService.callClaude(locationPrompt, {
        maxTokens: 50,
        temperature: 0.1,
      });

      const location = locationResponse.trim();

      // Step 2: If location found, fetch weather data
      let weatherData: WeatherData | undefined;
      if (location !== "NONE" && location.length > 0 && this.weatherService) {
        try {
          if (process.env.NODE_ENV === "development") {
            console.log(`[Recommender] Fetching weather for: ${location}`);
          }

          weatherData = await this.weatherService.getCurrentWeather(location);

          if (process.env.NODE_ENV === "development") {
            console.log(`[Recommender] Weather fetched: ${weatherData.summary}`);
          }
        } catch (weatherError) {
          // If weather fetch fails, log warning but continue without weather
          console.warn(`[Recommender] Failed to fetch weather: ${weatherError}`);
          weatherData = undefined;
        }
      }

      // Step 3: Generate recommendations with weather context
      const prompt = weatherData
        ? this.buildWeatherAwarePrompt(occasionText, weatherData)
        : this.buildSingleCallPrompt(occasionText);

      if (process.env.NODE_ENV === "development") {
        console.log("[Recommender] Generating recommendations with weather context...");
      }

      const response = await this.claudeService.callClaudeVision(imageBase64, prompt);

      // Parse the response
      const recommendations = this.parseSingleCallResponse(response);

      // Add weather data to the response
      if (weatherData) {
        recommendations.weatherData = weatherData;
        recommendations.weatherConsidered = true;
      } else {
        recommendations.weatherConsidered = false;
      }

      // Validate response structure
      this.validateResponse(recommendations);

      return recommendations;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Build a weather-aware prompt that includes current weather conditions
   */
  private buildWeatherAwarePrompt(occasionText: string, weatherData: WeatherData): string {
    return `You are a professional fashion advisor with expertise in wardrobe analysis, cultural awareness, and occasion-appropriate styling.

TASK: Analyze the clothing image and provide complete fashion recommendations for the user's occasion, taking into account the CURRENT WEATHER CONDITIONS.

USER'S OCCASION:
"${occasionText}"

CURRENT WEATHER CONDITIONS:
Location: ${weatherData.location}
Temperature: ${weatherData.current.temperature}°C (${weatherData.current.temperatureFahrenheit}°F)
Weather: ${weatherData.current.weatherDescription}
Humidity: ${weatherData.current.humidity}%
Wind Speed: ${weatherData.current.windSpeed} km/h
Precipitation: ${weatherData.current.precipitation}mm
Summary: ${weatherData.summary}

YOUR COMPREHENSIVE ANALYSIS SHOULD:

1. ANALYZE THE CLOTHING IMAGE:
   - Identify all visible clothing items (type, color, style, material if visible)
   - Assess overall wardrobe style (formal, casual, sporty, business, etc.)
   - Note the dominant color palette
   - Provide a brief summary of what's in their wardrobe

2. UNDERSTAND THE OCCASION:
   - Extract the event type (wedding, business, workout, party, interview, date, etc.)
   - Determine formality level (casual, business-casual, formal, athletic)
   - Consider cultural context based on location
   - Extract style preferences mentioned

3. CREATE WEATHER-APPROPRIATE OUTFIT RECOMMENDATIONS:
   - **CRITICAL**: Factor in the CURRENT WEATHER CONDITIONS (temperature, precipitation, wind, humidity)
   - Suggest 3-5 creative outfit combinations using ONLY items from their wardrobe
   - Each outfit should be WEATHER-APPROPRIATE and explain why it works for these conditions
   - Consider layering for temperature fluctuations
   - Recommend breathable fabrics for heat, warm layers for cold
   - Suggest rain-appropriate items if precipitation is expected
   - Focus on helping them style what they already own FOR THIS WEATHER
   - Suggest 1-2 items to AVOID wearing (weather-inappropriate or occasion-inappropriate)
   - Optional: Only suggest shopping for critical weather-related gaps (e.g., umbrella, rain jacket)

IMPORTANT GUIDELINES:
- **WEATHER IS A PRIMARY FACTOR**: All recommendations must be appropriate for ${weatherData.current.temperature}°C and ${weatherData.current.weatherDescription}
- Be SPECIFIC about which wardrobe items to combine (use exact colors/styles from the image)
- Explain WHY each outfit works for BOTH the occasion AND the weather
- Keep recommendations BRIEF and actionable
- Consider cultural appropriateness alongside weather
- MINIMIZE shopping suggestions - work with their wardrobe
- Provide practical advice they can use immediately

Return ONLY valid JSON with this exact structure (no markdown, no extra text):
{
  "clothingAnalysis": {
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
    "summary": "brief summary of the wardrobe"
  },
  "occasionContext": {
    "occasion": "event type extracted",
    "location": "${weatherData.location}",
    "formality": "casual | business-casual | formal | athletic",
    "weatherConsideration": "${weatherData.current.weatherDescription}",
    "culturalNotes": "cultural considerations based on location, or null"
  },
  "occasion": "event type",
  "location": "${weatherData.location}",
  "summary": "how to style their wardrobe for this occasion IN THESE WEATHER CONDITIONS",
  "recommendations": [
    "outfit combo 1: specific pieces to wear together and why it works for the weather and occasion",
    "outfit combo 2: specific pieces to wear together and why it works for the weather and occasion",
    "outfit combo 3: specific pieces to wear together and why it works for the weather and occasion"
  ],
  "culturalTips": ["essential dress code requirement"] or null,
  "dontWear": ["item/style to avoid - include weather-inappropriate items"],
  "shoppingTips": null or ["only critical weather-related gaps if absolutely necessary"]
}`;
  }

  /**
   * Build a comprehensive prompt for single-call analysis
   * Combines clothing analysis, context parsing, and recommendations
   */
  private buildSingleCallPrompt(occasionText: string): string {
    return `You are a professional fashion advisor with expertise in wardrobe analysis, cultural awareness, and occasion-appropriate styling.

TASK: Analyze the clothing image and provide complete fashion recommendations for the user's occasion.

USER'S OCCASION:
"${occasionText}"

YOUR COMPREHENSIVE ANALYSIS SHOULD:

1. ANALYZE THE CLOTHING IMAGE:
   - Identify all visible clothing items (type, color, style, material if visible)
   - Assess overall wardrobe style (formal, casual, sporty, business, etc.)
   - Note the dominant color palette
   - Provide a brief summary of what's in their wardrobe

2. UNDERSTAND THE OCCASION:
   - Extract the event type (wedding, business, workout, party, interview, date, etc.)
   - Identify location if mentioned (city/country)
   - Determine formality level (casual, business-casual, formal, athletic)
   - Note any weather considerations (hot, cold, humid, etc.)
   - Consider cultural context based on location
   - Extract style preferences mentioned

3. CREATE OUTFIT RECOMMENDATIONS:
   - Suggest 3-5 creative outfit combinations using ONLY items from their wardrobe
   - Each outfit should be 1-2 sentences describing which pieces to wear together and WHY
   - Focus on helping them style what they already own
   - Consider the occasion, formality, weather, and cultural appropriateness
   - Suggest 1-2 items to AVOID wearing
   - Optional: Only suggest shopping for items if there's a critical gap

IMPORTANT GUIDELINES:
- PRIMARY GOAL: Create great outfits from what they already own
- Be SPECIFIC about which wardrobe items to combine (use exact colors/styles from the image)
- Keep recommendations BRIEF and actionable
- Consider cultural appropriateness and weather
- MINIMIZE shopping suggestions - assume their wardrobe is adequate
- Provide practical advice they can use immediately

Return ONLY valid JSON with this exact structure (no markdown, no extra text):
{
  "clothingAnalysis": {
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
    "summary": "brief summary of the wardrobe"
  },
  "occasionContext": {
    "occasion": "event type extracted",
    "location": "location if mentioned, otherwise null",
    "formality": "casual | business-casual | formal | athletic",
    "weatherConsideration": "hot | cold | humid | rainy | etc, or null",
    "culturalNotes": "cultural considerations based on location, or null"
  },
  "occasion": "event type",
  "location": "location or null",
  "summary": "how to style their wardrobe for this occasion",
  "recommendations": [
    "outfit combo 1: specific pieces to wear together and why",
    "outfit combo 2: specific pieces to wear together and why",
    "outfit combo 3: specific pieces to wear together and why"
  ],
  "culturalTips": ["essential dress code requirement"] or null,
  "dontWear": ["item/style to avoid"],
  "shoppingTips": null or ["only critical gaps"]
}`;
  }

  /**
   * Parse the comprehensive single-call response
   */
  private parseSingleCallResponse(response: string): RecommendationResponse {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in Claude's response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Build comprehensive response
      const recommendation: RecommendationResponse = {
        // Store the full clothing analysis
        clothingAnalysis: parsed.clothingAnalysis || undefined,
        // Store the occasion context
        occasionContext: parsed.occasionContext || undefined,
        // Main recommendation fields
        occasion: parsed.occasion || "Unknown",
        location: parsed.location || undefined,
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
        throw new Error(`Failed to parse comprehensive response: ${error.message}`);
      }
      throw new Error("Failed to parse comprehensive response: Unknown error");
    }
  }

  /**
   * Generate personalized fashion recommendations (legacy multi-call method)
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
  claudeService: ClaudeAPIService,
  weatherService?: WeatherService
): IRecommenderEngine {
  return new RecommenderEngine(claudeService, weatherService);
}
