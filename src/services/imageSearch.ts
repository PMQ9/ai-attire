/**
 * Image Search Service - Module 6
 * Searches for outfit images based on clothing descriptions
 * Uses Unsplash API for high-quality fashion photography
 */

import Anthropic from "@anthropic-ai/sdk";

// ============================================================================
// Types
// ============================================================================

export interface OutfitImage {
  url: string; // Full-size image URL
  thumbnailUrl: string; // Smaller preview URL
  description?: string; // Alt text/description
  photographer?: string; // Credit to photographer
  photographerUrl?: string; // Link to photographer profile
  source: "unsplash" | "pexels" | "generated"; // Image source
}

export interface ImageSearchService {
  /**
   * Search for outfit images based on clothing description
   * @param description Text description of the outfit (e.g., "black jeans white t-shirt")
   * @param count Number of images to return (default: 1)
   * @returns Array of outfit images
   */
  searchOutfitImages(
    description: string,
    count?: number
  ): Promise<OutfitImage[]>;

  /**
   * Parse recommendations and search for images for each outfit
   * @param recommendations Array of outfit recommendation strings
   * @returns Array of outfit images (one per recommendation)
   */
  getImagesForRecommendations(
    recommendations: string[]
  ): Promise<OutfitImage[]>;
}

// ============================================================================
// Unsplash Image Search Implementation
// ============================================================================

export class UnsplashImageSearch implements ImageSearchService {
  private readonly unsplashAccessKey: string;
  private readonly baseUrl = "https://api.unsplash.com";

  constructor(unsplashAccessKey?: string) {
    this.unsplashAccessKey =
      unsplashAccessKey || process.env.UNSPLASH_ACCESS_KEY || "";

    if (!this.unsplashAccessKey) {
      console.warn(
        "⚠️  UNSPLASH_ACCESS_KEY not set - image search will use fallback placeholders"
      );
    }
  }

  /**
   * Search Unsplash for outfit images
   */
  async searchOutfitImages(
    description: string,
    count: number = 1
  ): Promise<OutfitImage[]> {
    // If no API key, return placeholder images
    if (!this.unsplashAccessKey) {
      return this.getPlaceholderImages(description, count);
    }

    try {
      // Build search query optimized for fashion/outfit photos
      const query = this.buildFashionQuery(description);

      const response = await fetch(
        `${this.baseUrl}/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=portrait`,
        {
          headers: {
            Authorization: `Client-ID ${this.unsplashAccessKey}`,
          },
        }
      );

      if (!response.ok) {
        console.error(
          `Unsplash API error: ${response.status} ${response.statusText}`
        );
        return this.getPlaceholderImages(description, count);
      }

      const data = await response.json() as any;

      if (!data.results || data.results.length === 0) {
        console.warn(`No images found for query: ${query}`);
        return this.getPlaceholderImages(description, count);
      }

      // Map Unsplash results to OutfitImage format
      return data.results.slice(0, count).map((result: any) => ({
        url: result.urls.regular,
        thumbnailUrl: result.urls.small,
        description: result.alt_description || description,
        photographer: result.user.name,
        photographerUrl: result.user.links.html,
        source: "unsplash" as const,
      }));
    } catch (error) {
      console.error("Error fetching images from Unsplash:", error);
      return this.getPlaceholderImages(description, count);
    }
  }

  /**
   * Get images for multiple outfit recommendations
   */
  async getImagesForRecommendations(
    recommendations: string[]
  ): Promise<OutfitImage[]> {
    // Fetch images for each recommendation in parallel
    const imagePromises = recommendations.map((rec) =>
      this.searchOutfitImages(rec, 1)
    );

    const imageArrays = await Promise.all(imagePromises);

    // Flatten and return first image from each result
    return imageArrays.map((images) => images[0]).filter(Boolean);
  }

  /**
   * Build an optimized search query for fashion photos
   * Converts outfit descriptions to effective Unsplash search terms
   */
  private buildFashionQuery(description: string): string {
    // Extract key clothing items and colors
    const lowerDesc = description.toLowerCase();

    // Add "fashion" or "outfit" to help filter results
    let query = description;

    // If the description doesn't already mention "outfit", "fashion", "wear", or "style"
    if (
      !lowerDesc.includes("outfit") &&
      !lowerDesc.includes("fashion") &&
      !lowerDesc.includes("wearing") &&
      !lowerDesc.includes("style")
    ) {
      query = `person wearing ${description}`;
    }

    // Add "portrait" to get better people-focused shots
    if (!lowerDesc.includes("portrait")) {
      query += " fashion portrait";
    }

    return query;
  }

  /**
   * Generate placeholder images when API is unavailable
   * Uses placeholder.com with outfit description as text
   */
  private getPlaceholderImages(
    description: string,
    count: number
  ): OutfitImage[] {
    const images: OutfitImage[] = [];

    for (let i = 0; i < count; i++) {
      const placeholderText = encodeURIComponent(
        description.slice(0, 50) // Limit text length
      );

      images.push({
        url: `https://via.placeholder.com/600x800/2c3e50/ffffff?text=${placeholderText}`,
        thumbnailUrl: `https://via.placeholder.com/300x400/2c3e50/ffffff?text=${placeholderText}`,
        description: description,
        source: "generated",
      });
    }

    return images;
  }
}

// ============================================================================
// Claude-Powered Smart Image Search (Advanced Alternative)
// ============================================================================

/**
 * Advanced image search that uses Claude to extract clothing keywords
 * before searching for images. This provides more accurate results.
 */
export class ClaudeSmartImageSearch implements ImageSearchService {
  private unsplashSearch: UnsplashImageSearch;
  private claudeClient: Anthropic;

  constructor(unsplashAccessKey?: string, claudeApiKey?: string) {
    this.unsplashSearch = new UnsplashImageSearch(unsplashAccessKey);
    this.claudeClient = new Anthropic({
      apiKey: claudeApiKey || process.env.CLAUDE_API_KEY,
    });
  }

  /**
   * Uses Claude to extract key clothing items from recommendation text
   * Then searches for images matching those items
   */
  async searchOutfitImages(
    description: string,
    count: number = 1
  ): Promise<OutfitImage[]> {
    try {
      // Use Claude to extract searchable keywords from the recommendation
      const searchQuery = await this.extractSearchKeywords(description);

      // Search using the optimized query
      return await this.unsplashSearch.searchOutfitImages(searchQuery, count);
    } catch (error) {
      console.error("Claude keyword extraction failed:", error);
      // Fallback to direct search
      return await this.unsplashSearch.searchOutfitImages(description, count);
    }
  }

  async getImagesForRecommendations(
    recommendations: string[]
  ): Promise<OutfitImage[]> {
    const imagePromises = recommendations.map((rec) =>
      this.searchOutfitImages(rec, 1)
    );

    const imageArrays = await Promise.all(imagePromises);
    return imageArrays.map((images) => images[0]).filter(Boolean);
  }

  /**
   * Extract key clothing items and colors from recommendation text
   * Uses Claude to parse outfit descriptions into searchable keywords
   */
  private async extractSearchKeywords(description: string): Promise<string> {
    const prompt = `Extract the key clothing items and colors from this outfit recommendation. Return ONLY a short search query (5-10 words max) suitable for finding a fashion photo.

Outfit recommendation: "${description}"

Search query:`;

    const response = await this.claudeClient.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 50,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const searchQuery =
      response.content[0].type === "text"
        ? response.content[0].text.trim()
        : description;

    return searchQuery || description;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create an image search service
 * @param useSmartSearch Use Claude-powered smart search (default: false for cost savings)
 * @returns ImageSearchService instance
 */
export function createImageSearchService(
  useSmartSearch: boolean = false
): ImageSearchService {
  if (useSmartSearch) {
    return new ClaudeSmartImageSearch();
  }

  return new UnsplashImageSearch();
}
