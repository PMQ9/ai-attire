/**
 * Module 3: Context Parser
 * Parses user input about occasion/location and extracts structured context
 * Dependencies: None
 */

import { ContextParser as IContextParser, OccasionContext } from "../types";

export class ContextParser implements IContextParser {
  /**
   * Parse user input about occasion/location
   * @param input User's free-form text describing the occasion
   * @returns Structured OccasionContext
   */
  parseOccasion(input: string): OccasionContext {
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
