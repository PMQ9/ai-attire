/**
 * Shared TypeScript interfaces for ai-attire
 * All modules use these types for communication
 */

// ============================================================================
// Vision Service Types (Module 2)
// ============================================================================

export interface ClothingItem {
  type: string; // "shirt", "pants", "dress", "jacket", etc.
  color: string; // "blue", "black", "red", etc.
  style: string; // "formal", "casual", "athletic", "bohemian", etc.
  material?: string; // "cotton", "silk", "wool", etc.
  condition?: string; // "good", "worn", "new", etc.
}

export interface ClothingAnalysis {
  items: ClothingItem[];
  overallStyle: string; // Overall style assessment
  colorPalette: string[]; // Dominant colors in wardrobe
  summary: string; // Human-readable summary
}

// ============================================================================
// Context Parser Types (Module 3)
// ============================================================================

export interface OccasionContext {
  occasion: string; // "wedding", "business", "workout", "casual", etc.
  location?: string; // "Japan", "Thailand", "New York", etc.
  formality: "casual" | "business-casual" | "formal" | "athletic";
  tone: string[]; // ["elegant", "comfortable", "professional", etc.]
  weatherConsideration?: string; // "hot", "cold", "rainy", etc.
  culturalNotes?: string; // Specific cultural considerations
  preferences?: string[]; // User preferences for style
  rawInput: string; // Original user input (for logging/debugging)
}

// ============================================================================
// Claude API Types (Module 1)
// ============================================================================

export interface CallOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

export interface ClaudeAPIService {
  /**
   * Call Claude with a text prompt
   * @param prompt The prompt to send to Claude
   * @param options Optional parameters for the API call
   * @returns Claude's response text
   */
  callClaude(prompt: string, options?: CallOptions): Promise<string>;

  /**
   * Call Claude Vision API with an image
   * @param imageBase64 Base64-encoded image data
   * @param prompt The prompt to send with the image
   * @returns Claude's vision analysis response
   */
  callClaudeVision(imageBase64: string, prompt: string): Promise<string>;
}

// ============================================================================
// Vision Service Interface (Module 2)
// ============================================================================

export interface VisionService {
  /**
   * Analyze clothing items in an image
   * @param imageBase64 Base64-encoded image
   * @returns ClothingAnalysis with items, style, colors, etc.
   */
  analyzeClothing(imageBase64: string): Promise<ClothingAnalysis>;
}

// ============================================================================
// Context Parser Interface (Module 3)
// ============================================================================

export interface ContextParser {
  /**
   * Parse user input about occasion/location
   * @param input User's free-form text about occasion
   * @returns Structured OccasionContext (async with AI parsing, or sync with keyword-based fallback)
   */
  parseOccasion(input: string): Promise<OccasionContext>;
}

// ============================================================================
// Recommender Types & Interface (Module 4)
// ============================================================================

export interface RecommendationRequest {
  clothingAnalysis: ClothingAnalysis;
  occasionContext: OccasionContext;
}

export interface RecommendationResponse {
  occasion: string;
  location?: string;
  summary: string; // Overall fashion advice
  recommendations: string[]; // Specific outfit suggestions (3-5)
  culturalTips?: string[]; // Location/culture specific advice
  dontWear?: string[]; // What to avoid wearing
  shoppingTips?: string[]; // If pieces are missing from wardrobe
  clothingAnalysis?: ClothingAnalysis; // Wardrobe analysis from vision service
  occasionContext?: OccasionContext; // Parsed occasion context
  formality?: string; // Formality level for the occasion
  shoppingSuggestions?: string[]; // Suggested items to purchase
  analysis?: string; // Detailed analysis text
}

export interface RecommenderEngine {
  /**
   * Generate personalized fashion recommendations
   * @param request Clothing analysis + occasion context
   * @returns Personalized recommendations and advice
   */
  generateRecommendations(
    request: RecommendationRequest
  ): Promise<RecommendationResponse>;
}

// ============================================================================
// API Types (Module 5)
// ============================================================================

export interface AnalyzeRequest {
  image: Buffer; // Image file from multipart form
  occasion: string; // User's description of occasion
  preferences?: string; // Optional: user style preferences
}

export interface ApiErrorResponse {
  error: string;
  code: string;
  details?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface ServiceConfig {
  claudeApiKey: string;
  port?: number;
  nodeEnv?: "development" | "production";
}
