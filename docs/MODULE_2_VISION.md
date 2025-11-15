# Module 2: Vision Service

**File**: `src/services/vision.ts`

**Responsibility**: Use Claude Vision API to analyze clothing items from images. Extract colors, styles, materials, garment types.

**Dependencies**: Module 1 (Claude API Service)

## Interface

```typescript
// From src/types.ts
export interface ClothingAnalysis {
  items: ClothingItem[];
  overallStyle: string;
  colorPalette: string[];
  summary: string;
}

export interface ClothingItem {
  type: string; // "shirt", "pants", "dress", etc.
  color: string;
  style: string; // "formal", "casual", "athletic", etc.
  material?: string;
  condition?: string;
}

export interface VisionService {
  analyzeClothing(imageBase64: string): Promise<ClothingAnalysis>;
}
```

## Implementation

### analyzeClothing(imageBase64: string)

**Input**: Base64-encoded image (JPG, PNG, WebP, GIF)

**Output**: `ClothingAnalysis` object with:
- Array of identified clothing items
- Overall style assessment
- Color palette used
- Human-readable summary

**Implementation Steps**:

1. Validate image input (not empty, valid base64)
2. Call Claude Vision via `claudeService.callClaudeVision()`
3. Send structured prompt to extract clothing info
4. Parse Claude's response into `ClothingAnalysis`
5. Return structured object

**Example Prompt** (you'll write this):
```
Analyze this clothing image and provide:
1. List each clothing item (type, color, style, material if visible)
2. Overall style (formal, casual, sporty, vintage, bohemian, etc.)
3. Color palette (dominant colors used)
4. Summary of what's visible

Format response as JSON with structure: {items: [], overallStyle: "", colorPalette: [], summary: ""}
```

## Setup

```bash
npm install @anthropic-ai/sdk dotenv
```

## Code Structure

```typescript
import { ClaudeAPIService } from './claude';
import { ClothingAnalysis, ClothingItem } from '../types';

export class VisionService {
  constructor(private claudeService: ClaudeAPIService) {}

  async analyzeClothing(imageBase64: string): Promise<ClothingAnalysis> {
    // 1. Validate input
    if (!imageBase64) throw new Error("Image required");

    // 2. Call Claude Vision
    const response = await this.claudeService.callClaudeVision(
      imageBase64,
      "Your prompt here..."
    );

    // 3. Parse response
    const analysis = this.parseResponse(response);

    // 4. Return structured data
    return analysis;
  }

  private parseResponse(response: string): ClothingAnalysis {
    // Parse Claude's response into ClothingAnalysis structure
    // Handle errors if response is malformed
  }
}
```

## Testing

Test cases:
- [ ] Test with sample wardrobe image
- [ ] Verify clothing items are correctly identified
- [ ] Verify color palette is extracted
- [ ] Test with different clothing styles (formal, casual, sporty)
- [ ] Test error handling with invalid image
- [ ] Test JSON parsing from Claude response

**Test file**: `src/services/__tests__/vision.test.ts`

## Example Usage

```typescript
const visionService = new VisionService(claudeService);
const analysis = await visionService.analyzeClothing(imageBase64);

console.log(analysis);
// Output:
// {
//   items: [
//     { type: "shirt", color: "blue", style: "casual", material: "cotton" },
//     { type: "pants", color: "black", style: "formal" }
//   ],
//   overallStyle: "business-casual",
//   colorPalette: ["blue", "black", "white"],
//   summary: "Professional wardrobe with business-casual pieces..."
// }
```

## Integration Points

**Module 4 (Recommender)** will use this output:
```typescript
const clothingAnalysis = await visionService.analyzeClothing(imageBase64);
// Then combine with context to generate recommendations
```

## Tips

- Claude Vision is very good at identifying clothing
- Be specific in your prompt about what to extract
- Ask for JSON output to make parsing easier
- Include validation for expected JSON structure
- Handle partial/unclear images gracefully

---

**Status**: 🔲 Waiting for Module 1

**Estimated time**: 20-25 minutes

**Blocked by**: Module 1 (Claude API Service)

**Next module to use this**: Module 4 (Recommender Engine)
