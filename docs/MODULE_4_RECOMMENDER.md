# Module 4: Recommender Engine

**File**: `src/engine/recommender.ts`

**Responsibility**: Synthesize clothing analysis + occasion context into personalized outfit recommendations using Claude AI.

**Dependencies**: Module 1 (Claude API), Module 2 (Vision), Module 3 (Context)

## Interface

```typescript
// From src/types.ts
export interface RecommendationRequest {
  clothingAnalysis: ClothingAnalysis;
  occasionContext: OccasionContext;
}

export interface RecommendationResponse {
  occasion: string;
  location?: string;
  summary: string; // Overall fashion advice
  recommendations: string[]; // Specific outfit suggestions
  culturalTips?: string[]; // Location/culture specific advice
  dontWear?: string[]; // What to avoid
  shoppingTips?: string[]; // If pieces are missing
}

export interface RecommenderEngine {
  generateRecommendations(request: RecommendationRequest): Promise<RecommendationResponse>;
}
```

## Implementation

### generateRecommendations(request: RecommendationRequest)

**Input**:
- Clothing analysis (from Vision Service)
- Occasion context (from Context Parser)

**Output**: Personalized recommendations

**Implementation Steps**:

1. Combine clothing analysis + context into a structured prompt
2. Call Claude API with the prompt
3. Parse Claude's response into `RecommendationResponse`
4. Validate response structure
5. Return to caller

## Code Structure

```typescript
import { ClaudeAPIService } from '../services/claude';
import { VisionService } from '../services/vision';
import { ContextParser } from '../services/context';
import { RecommendationRequest, RecommendationResponse } from '../types';

export class RecommenderEngine {
  constructor(
    private claudeService: ClaudeAPIService,
    private visionService: VisionService,
    private contextParser: ContextParser
  ) {}

  async generateRecommendations(
    request: RecommendationRequest
  ): Promise<RecommendationResponse> {
    // 1. Build prompt
    const prompt = this.buildPrompt(request);

    // 2. Call Claude
    const response = await this.claudeService.callClaude(prompt);

    // 3. Parse response
    const recommendations = this.parseResponse(response);

    // 4. Validate
    this.validateResponse(recommendations);

    // 5. Return
    return recommendations;
  }

  private buildPrompt(request: RecommendationRequest): string {
    const { clothingAnalysis, occasionContext } = request;

    return `
You are a fashion expert AI advisor. Based on the following information, provide personalized outfit recommendations.

USER'S WARDROBE:
${JSON.stringify(clothingAnalysis, null, 2)}

OCCASION DETAILS:
- Occasion: ${occasionContext.occasion}
- Location: ${occasionContext.location || "Not specified"}
- Formality: ${occasionContext.formality}
- Preferred style: ${occasionContext.tone?.join(", ") || "Not specified"}
- User preferences: ${occasionContext.preferences?.join(", ") || "None"}

Please provide:
1. A summary of fashion advice for this occasion
2. 3-5 specific outfit recommendations using items from their wardrobe
3. Cultural tips if location is specified
4. What they should avoid wearing
5. Any shopping suggestions for missing essential pieces

Format your response as JSON:
{
  "occasion": "string",
  "location": "string or null",
  "summary": "string",
  "recommendations": ["string", "string", ...],
  "culturalTips": ["string", ...],
  "dontWear": ["string", ...],
  "shoppingTips": ["string", ...]
}
    `;
  }

  private parseResponse(response: string): RecommendationResponse {
    try {
      // Claude should return JSON, extract it
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        occasion: parsed.occasion || "Unknown",
        location: parsed.location,
        summary: parsed.summary || "",
        recommendations: parsed.recommendations || [],
        culturalTips: parsed.culturalTips,
        dontWear: parsed.dontWear,
        shoppingTips: parsed.shoppingTips,
      };
    } catch (error) {
      throw new Error(`Failed to parse Claude response: ${error}`);
    }
  }

  private validateResponse(response: RecommendationResponse): void {
    if (!response.summary || !response.recommendations?.length) {
      throw new Error("Invalid recommendation response structure");
    }
  }
}
```

## Testing

Test cases:
- [ ] Test with business wardrobe + business occasion
- [ ] Test with casual wardrobe + formal event
- [ ] Test location-specific recommendations (Japan, Thailand)
- [ ] Test that recommendations use actual clothing items
- [ ] Test error handling for invalid input
- [ ] Test response parsing from Claude

**Test file**: `src/engine/__tests__/recommender.test.ts`

Example test:
```typescript
describe("RecommenderEngine", () => {
  it("generates recommendations for business meeting", async () => {
    const request: RecommendationRequest = {
      clothingAnalysis: {
        items: [
          { type: "shirt", color: "white", style: "formal" },
          { type: "pants", color: "black", style: "formal" }
        ],
        overallStyle: "business",
        colorPalette: ["white", "black"],
        summary: "Professional wardrobe"
      },
      occasionContext: {
        occasion: "business",
        location: "thailand",
        formality: "business-casual",
        tone: ["professional"],
        rawInput: "business meeting in thailand"
      }
    };

    const result = await recommender.generateRecommendations(request);

    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.occasion).toBeTruthy();
  });
});
```

## Example Usage

```typescript
const recommender = new RecommenderEngine(claudeService, visionService, contextParser);

const recommendations = await recommender.generateRecommendations({
  clothingAnalysis: { /* from vision service */ },
  occasionContext: { /* from context parser */ }
});

console.log(recommendations);
// Output:
// {
//   occasion: "business",
//   location: "thailand",
//   summary: "For a business meeting in Thailand's warm climate, lightweight fabrics...",
//   recommendations: [
//     "Light linen blazer with white dress shirt and black dress pants",
//     "Breathable cotton button-down with khaki chinos",
//     "Avoid dark heavy fabrics in the heat"
//   ],
//   culturalTips: [
//     "Business dress in Thailand is formal and respectful",
//     "Avoid showing shoulders or excessive skin"
//   ],
//   dontWear: [
//     "Heavy wool or dark colors in heat",
//     "Shorts or revealing clothing",
//     "Sneakers or casual footwear"
//   ],
//   shoppingTips: [
//     "Consider adding lightweight dress shoes",
//     "Invest in breathable dress pants"
//   ]
// }
```

## Prompt Engineering Tips

- Be specific about output format (JSON)
- Include all clothing analysis data
- Mention occasion and cultural context
- Ask for specific number of recommendations (3-5)
- Request JSON parsing-friendly format

## Integration Points

**Module 5 (API Server)** will use:
```typescript
const recommendations = await recommenderEngine.generateRecommendations({
  clothingAnalysis,
  occasionContext
});
return recommendations;
```

---

**Status**: 🔲 Waiting for Modules 1, 2, 3

**Estimated time**: 20-30 minutes

**Blocked by**: Module 1, Module 2, Module 3

**Next module to use this**: Module 5 (API Server)
