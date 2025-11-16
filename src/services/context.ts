/**
 * Module 3: Context Parser
 * Parses user input about occasion/location and extracts structured context
 * Dependencies: Optional - ClaudeAPIService for AI-powered parsing
 */

import { ContextParser as IContextParser, OccasionContext, ClaudeAPIService } from "../types";

export class ContextParser implements IContextParser {
  private claudeService?: ClaudeAPIService;
  private useAI: boolean = true; // Toggle for AI-powered parsing

  /**
   * Constructor
   * @param claudeService Optional Claude API service for AI-powered parsing
   * @param useAI Whether to use AI parsing (default: true if claudeService provided)
   */
  constructor(claudeService?: ClaudeAPIService, useAI: boolean = true) {
    this.claudeService = claudeService;
    this.useAI = useAI && !!claudeService;
  }

  /**
   * Parse user input about occasion/location
   * Uses AI-powered parsing if Claude service is available, falls back to keyword-based
   * @param input User's free-form text describing the occasion
   * @returns Structured OccasionContext
   */
  async parseOccasion(input: string): Promise<OccasionContext> {
    // Try AI-powered parsing first if available
    if (this.useAI && this.claudeService) {
      try {
        return await this.parseOccasionWithAI(input);
      } catch (error) {
        console.warn("[ContextParser] AI parsing failed, falling back to keyword-based:", error);
        // Fall through to keyword-based parsing
      }
    }

    // Fallback to keyword-based parsing
    return this.parseOccasionKeywordBased(input);
  }

  /**
   * AI-powered context parsing using Claude API
   * More intelligent extraction with natural language understanding
   * @param input User's free-form text describing the occasion
   * @returns Structured OccasionContext
   */
  private async parseOccasionWithAI(input: string): Promise<OccasionContext> {
    if (!this.claudeService) {
      throw new Error("Claude service not available for AI parsing");
    }

    const prompt = `You are a fashion context analyzer. Parse the user's input about an occasion and extract structured information.

User input: "${input}"

Extract the following information and return ONLY valid JSON (no other text):
{
  "occasion": "string - the event type (wedding, business, workout, party, interview, casual, date, formal event, funeral, gala, beach, outdoor activity, general, etc.)",
  "location": "string or null - city/country name if mentioned (e.g., 'Japan', 'New York', 'Paris')",
  "formality": "string - one of: casual, business-casual, formal, athletic",
  "tone": ["array of style descriptors mentioned: elegant, comfortable, professional, minimalist, modern, classic, sophisticated, etc."],
  "weatherConsideration": "string or null - one of: hot, cold, rainy, humid, snowy, dry, windy, or null if not mentioned",
  "culturalNotes": "string or null - cultural or religious considerations based on location or event type",
  "preferences": ["array of user preferences: breathable, lightweight, warm, fitted, loose, sustainable, luxury, etc."]
}

Rules:
- Be precise with occasion types (use common categories)
- For formality: weddings/funerals/galas/interviews = formal, business/dates = business-casual, workouts = athletic, parties/casual = casual
- Only include tone/preferences explicitly mentioned
- Extract weather only if explicitly mentioned (hot, cold, humid, rainy, etc.)
- For cultural notes, consider location-specific dress codes (Japan = modest, Dubai = conservative, temples = respectful, etc.)
- Handle negations: if user says "NOT formal" or "don't want business", adjust accordingly
- Return null for location/weather/culturalNotes if not applicable
- Return empty arrays for tone/preferences if none mentioned

Return only the JSON object, nothing else.`;

    const response = await this.claudeService.callClaude(prompt, {
      maxTokens: 500,
      temperature: 0.3, // Lower temperature for more consistent structured output
    });

    // Parse JSON response
    try {
      // Extract JSON from response (handle cases where Claude adds explanation)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in Claude response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and construct OccasionContext
      const occasionContext: OccasionContext = {
        occasion: parsed.occasion || "general",
        location: parsed.location || undefined,
        formality: this.validateFormality(parsed.formality),
        tone: Array.isArray(parsed.tone) ? parsed.tone : [],
        weatherConsideration: parsed.weatherConsideration || undefined,
        culturalNotes: parsed.culturalNotes || undefined,
        preferences: Array.isArray(parsed.preferences) ? parsed.preferences : [],
        rawInput: input,
      };

      return occasionContext;
    } catch (parseError) {
      throw new Error(`Failed to parse Claude JSON response: ${parseError}`);
    }
  }

  /**
   * Validate formality value matches the type
   */
  private validateFormality(formality: string): OccasionContext["formality"] {
    const validFormalities: OccasionContext["formality"][] = [
      "casual",
      "business-casual",
      "formal",
      "athletic",
    ];
    if (validFormalities.includes(formality as OccasionContext["formality"])) {
      return formality as OccasionContext["formality"];
    }
    return "casual"; // Default
  }

  /**
   * Keyword-based parsing (original implementation)
   * Used as fallback when AI parsing is unavailable or fails
   * @param input User's free-form text describing the occasion
   * @returns Structured OccasionContext
   */
  private parseOccasionKeywordBased(input: string): OccasionContext {
    const lowerInput = input.toLowerCase();

    // Extract occasion
    const occasion = this.extractOccasion(lowerInput);

    // Extract location
    const location = this.extractLocation(lowerInput);

    // Determine formality based on occasion
    const formality = this.determineFormality(occasion);

    // Extract tone/style descriptors
    const tone = this.extractTone(lowerInput);

    // Extract weather considerations
    const weatherConsideration = this.extractWeather(lowerInput);

    // Extract cultural notes based on location
    const culturalNotes = this.extractCulturalNotes(location, lowerInput);

    // Extract user preferences
    const preferences = this.extractPreferences(lowerInput);

    return {
      occasion,
      location,
      formality,
      tone,
      weatherConsideration,
      culturalNotes,
      preferences,
      rawInput: input,
    };
  }

  /**
   * Extract the occasion type from user input
   */
  private extractOccasion(text: string): string {
    // Order matters: check more specific keywords first
    const occasions = [
      { keywords: ["job interview", "interview"], value: "interview" },
      { keywords: ["wedding", "marriage", "ceremony"], value: "wedding" },
      { keywords: ["workout", "gym", "exercise", "running", "yoga", "fitness"], value: "workout" },
      { keywords: ["funeral", "memorial"], value: "funeral" },
      { keywords: ["gala", "ball"], value: "gala" },
      { keywords: ["formal event", "formal"], value: "formal event" },
      { keywords: ["business", "meeting", "conference", "office", "work"], value: "business" },
      { keywords: ["party", "celebration", "birthday"], value: "party" },
      { keywords: ["date", "dinner date", "romantic"], value: "date" },
      { keywords: ["brunch", "lunch"], value: "casual dining" },
      { keywords: ["beach", "pool"], value: "beach" },
      { keywords: ["hiking", "outdoor"], value: "outdoor activity" },
      { keywords: ["casual"], value: "casual" },
    ];

    for (const { keywords, value } of occasions) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return value;
        }
      }
    }

    return "general";
  }

  /**
   * Extract location from user input
   */
  private extractLocation(text: string): string | undefined {
    const locations = [
      // Countries
      "japan", "thailand", "china", "korea", "singapore",
      "india", "vietnam", "malaysia", "indonesia", "philippines",
      "france", "germany", "italy", "spain", "uk", "england",
      "united states", "usa", "canada", "mexico", "brazil",
      "australia", "new zealand",
      "dubai", "egypt", "south africa",
      // Cities
      "new york", "los angeles", "san francisco", "chicago", "boston",
      "london", "paris", "rome", "barcelona", "berlin",
      "tokyo", "kyoto", "osaka", "beijing", "shanghai",
      "bangkok", "singapore", "hong kong", "seoul",
      "sydney", "melbourne",
    ];

    for (const loc of locations) {
      if (text.includes(loc)) {
        // Normalize location to title case
        return loc.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
    }

    return undefined;
  }

  /**
   * Determine formality level based on occasion
   */
  private determineFormality(occasion: string): OccasionContext["formality"] {
    const formalityMap: Record<string, OccasionContext["formality"]> = {
      wedding: "formal",
      funeral: "formal",
      gala: "formal",
      "formal event": "formal",
      interview: "formal",
      business: "business-casual",
      "casual dining": "business-casual",
      date: "business-casual",
      workout: "athletic",
      beach: "casual",
      party: "casual",
      casual: "casual",
      general: "casual",
    };

    return formalityMap[occasion] || "casual";
  }

  /**
   * Extract tone/style descriptors from user input
   */
  private extractTone(text: string): string[] {
    const tones = [
      "elegant", "comfortable", "breathable", "professional",
      "casual", "sporty", "trendy", "conservative", "bold",
      "minimalist", "modern", "classic", "traditional",
      "sophisticated", "relaxed", "chic", "stylish",
      "edgy", "vintage", "bohemian", "preppy"
    ];

    return tones.filter(tone => text.includes(tone));
  }

  /**
   * Extract weather considerations from user input
   */
  private extractWeather(text: string): string | undefined {
    // Order matters: check more specific keywords first
    const weatherKeywords = [
      { keywords: ["humid", "humidity"], value: "humid" },
      { keywords: ["snowy", "snow"], value: "snowy" },
      { keywords: ["rainy", "rain", "wet", "monsoon"], value: "rainy" },
      { keywords: ["cold", "winter", "freezing", "chilly"], value: "cold" },
      { keywords: ["hot", "warm", "summer", "heat", "tropical"], value: "hot" },
      { keywords: ["dry", "arid"], value: "dry" },
      { keywords: ["windy"], value: "windy" },
    ];

    for (const { keywords, value } of weatherKeywords) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return value;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract cultural notes based on location and context
   */
  private extractCulturalNotes(location: string | undefined, text: string): string | undefined {
    // Check for explicit cultural keywords first (these take priority)
    if (text.includes("temple") || text.includes("mosque") || text.includes("church")) {
      return "Religious site - modest, respectful attire required";
    }

    if (!location) return undefined;

    const culturalContext: Record<string, string> = {
      "Japan": "Consider modest dress codes; remove shoes indoors",
      "Thailand": "Dress modestly, especially in temples; avoid pointing feet",
      "India": "Modest clothing recommended; consider cultural sensitivity",
      "Dubai": "Conservative dress expected; cover shoulders and knees",
      "Saudi Arabia": "Very conservative dress codes; women should cover",
      "Vatican": "Modest dress required; cover shoulders and knees",
      "Singapore": "Smart casual widely accepted; hot and humid climate",
    };

    return culturalContext[location];
  }

  /**
   * Extract user preferences from input
   */
  private extractPreferences(text: string): string[] {
    const prefs = [
      "breathable", "lightweight", "warm", "layered",
      "elegant", "comfortable", "professional",
      "minimalist", "bold", "colorful", "neutral",
      "fitted", "loose", "stretchy", "structured",
      "sustainable", "eco-friendly", "vintage",
      "luxury", "budget-friendly", "designer"
    ];

    const extracted = prefs.filter(pref => text.includes(pref));

    // Filter out preferences that are just part of the occasion description
    // Don't count "casual" or "formal" as preferences if they're just describing the occasion
    const filteredPrefs = extracted.filter(pref => {
      // If the preference is "casual" or "formal", only include if it appears with context words
      if (pref === "casual" || pref === "formal") {
        return text.includes(`prefer ${pref}`) ||
               text.includes(`want ${pref}`) ||
               text.includes(`need ${pref}`);
      }
      return true;
    });

    return filteredPrefs;
  }
}

// Export a default instance for easy use
export const contextParser = new ContextParser();
