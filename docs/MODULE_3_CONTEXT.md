# Module 3: Context Parser

**File**: `src/services/context.ts`

**Responsibility**: Parse user input about occasion/location. Extract structured context for recommendation generation.

**Dependencies**: None

## Interface

```typescript
// From src/types.ts
export interface OccasionContext {
  occasion: string; // "wedding", "business meeting", "workout", etc.
  location?: string; // "Japan", "Thailand", "New York", etc.
  formality: "casual" | "business-casual" | "formal" | "athletic";
  tone: string[]; // ["elegant", "comfortable", "professional"]
  weatherConsideration?: string; // "hot", "cold", "rainy", etc.
  culturalNotes?: string; // Specific cultural considerations
  preferences?: string[]; // User preferences for style
  rawInput: string; // Original user input
}

export interface ContextParser {
  parseOccasion(input: string): OccasionContext;
}
```

## Implementation

### parseOccasion(input: string)

**Input**: User's free-form text describing occasion
- Examples: "wedding in Japan", "business meeting in Thailand", "casual workout"

**Output**: `OccasionContext` object with:
- Occasion type
- Location
- Formality level
- Style tone descriptors
- Cultural/weather considerations
- User preferences

**Implementation Strategy**:

Simple approach (no AI needed for MVP):
1. Use regex/keyword matching to identify occasion
2. Extract location if mentioned
3. Infer formality from occasion type
4. Extract preferences (keywords like "comfortable", "elegant", "breathable")
5. Return structured object

## Code Structure

```typescript
export class ContextParser {
  parseOccasion(input: string): OccasionContext {
    const lowerInput = input.toLowerCase();

    // Extract occasion
    const occasion = this.extractOccasion(lowerInput);

    // Extract location
    const location = this.extractLocation(lowerInput);

    // Determine formality
    const formality = this.determineFormal(occasion);

    // Extract tone/style descriptors
    const tone = this.extractTone(lowerInput);

    // Extract preferences
    const preferences = this.extractPreferences(lowerInput);

    return {
      occasion,
      location,
      formality,
      tone,
      preferences,
      rawInput: input,
    };
  }

  private extractOccasion(text: string): string {
    // Look for keywords: wedding, business, workout, casual, etc.
    const occasions = [
      { keyword: "wedding", value: "wedding" },
      { keyword: "business", value: "business" },
      { keyword: "workout", value: "workout" },
      { keyword: "casual", value: "casual" },
      { keyword: "formal", value: "formal" },
      { keyword: "party", value: "party" },
      { keyword: "meeting", value: "business" },
      // ... more mappings
    ];

    for (const { keyword, value } of occasions) {
      if (text.includes(keyword)) return value;
    }
    return "general";
  }

  private extractLocation(text: string): string | undefined {
    // Look for country/city names: Japan, Thailand, New York, etc.
    // Can use a simple list or regex
    const locations = ["japan", "thailand", "new york", "london", "paris"];
    for (const loc of locations) {
      if (text.includes(loc)) return loc;
    }
    return undefined;
  }

  private determineFormal(occasion: string): OccasionContext["formality"] {
    const formalityMap: Record<string, OccasionContext["formality"]> = {
      wedding: "formal",
      business: "business-casual",
      workout: "athletic",
      casual: "casual",
      formal: "formal",
      default: "casual",
    };
    return formalityMap[occasion] || formalityMap["default"];
  }

  private extractTone(text: string): string[] {
    const tones = [
      "elegant", "comfortable", "breathable", "professional",
      "casual", "sporty", "trendy", "conservative", "bold"
    ];
    return tones.filter(tone => text.includes(tone));
  }

  private extractPreferences(text: string): string[] {
    // Similar to extractTone - look for user preferences
    const prefs = [
      "breathable", "lightweight", "warm", "formal", "casual",
      "elegant", "comfortable", "minimalist", "bold"
    ];
    return prefs.filter(p => text.includes(p));
  }
}
```

## Testing

Test cases:
- [ ] "wedding in Japan" → extracts occasion, location, formal
- [ ] "business meeting in Thailand" → extracts occasion, location, business-casual
- [ ] "casual workout" → extracts occasion, athletic formality
- [ ] "formal event, need elegant look" → extracts tone
- [ ] Unknown input → returns sensible defaults

**Test file**: `src/services/__tests__/context.test.ts`

Example tests:
```typescript
describe("ContextParser", () => {
  const parser = new ContextParser();

  it("parses wedding in Japan", () => {
    const context = parser.parseOccasion("wedding in Japan");
    expect(context.occasion).toBe("wedding");
    expect(context.location).toBe("japan");
    expect(context.formality).toBe("formal");
  });

  it("extracts preferences", () => {
    const context = parser.parseOccasion("business meeting, need breathable clothes");
    expect(context.preferences).toContain("breathable");
  });
});
```

## Example Usage

```typescript
const parser = new ContextParser();

const context = parser.parseOccasion("wedding in Japan, elegant but comfortable");

console.log(context);
// Output:
// {
//   occasion: "wedding",
//   location: "Japan",
//   formality: "formal",
//   tone: ["elegant", "comfortable"],
//   preferences: ["comfortable"],
//   rawInput: "wedding in Japan, elegant but comfortable"
// }
```

## Integration Points

**Module 4 (Recommender)** will use:
```typescript
const context = parser.parseOccasion(userInput);
// Then combine with clothing analysis to generate recommendations
```

## Enhancement Ideas (if time permits)

- Expand locations list
- Add more occasion types
- Add weather context extraction
- Add cultural context (formality norms in different cultures)

---

**Status**: 🔲 Not started

**Estimated time**: 15-20 minutes

**Blocked by**: None (no dependencies!)

**Next module to use this**: Module 4 (Recommender Engine), Module 5 (API)
