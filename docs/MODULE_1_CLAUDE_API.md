# Module 1: Claude API Service

**File**: `src/services/claude.ts`

**Responsibility**: Wrapper around Claude API. Handles authentication, API calls, and prompt engineering.

**Dependencies**: None

## Interface

```typescript
// From src/types.ts
export interface ClaudeAPIService {
  // Call Claude with a message
  callClaude(prompt: string, options?: CallOptions): Promise<string>;

  // Call Claude with vision (image analysis)
  callClaudeVision(imageBase64: string, prompt: string): Promise<string>;
}
```

## Implementation Requirements

### 1. Basic Claude API Call

```typescript
async callClaude(prompt: string, options?: CallOptions): Promise<string>
```

- Use Claude 3.5 Sonnet model or latest available
- Accept a text prompt, return Claude's response
- Options: optional max_tokens, temperature, etc.
- Throw descriptive errors if API fails
- Log all API calls (in development)

**Example:**
```typescript
const response = await claudeService.callClaude(
  "What clothing would work best for a beach wedding?"
);
```

### 2. Claude Vision Call

```typescript
async callClaudeVision(imageBase64: string, prompt: string): Promise<string>
```

- Accept base64-encoded image data
- Call Claude Vision API with the image
- Include the prompt for analysis
- Support image types: JPG, PNG, GIF, WebP
- Return the vision analysis response

**Example:**
```typescript
const analysis = await claudeService.callClaudeVision(
  imageBase64,
  "List all clothing items visible in this image with colors and styles"
);
```

## Setup

1. **Install dependencies**:
   ```bash
   npm install @anthropic-ai/sdk dotenv
   ```

2. **Initialize in constructor**:
   ```typescript
   import Anthropic from "@anthropic-ai/sdk";

   const client = new Anthropic({
     apiKey: process.env.CLAUDE_API_KEY,
   });
   ```

3. **Handle errors**:
   - Network errors
   - Invalid API key
   - Rate limiting
   - Input validation (prompt length, image size)

## Testing

Test cases to implement:
- [ ] Test basic API call with simple prompt
- [ ] Test vision API call with sample image
- [ ] Test error handling for invalid API key
- [ ] Test error handling for rate limiting
- [ ] Test base64 image encoding

**Test file**: `src/services/__tests__/claude.test.ts`

Example test:
```typescript
describe("ClaudeAPIService", () => {
  it("should call Claude and return response", async () => {
    const response = await claudeService.callClaude("Hello");
    expect(response).toBeTruthy();
    expect(typeof response).toBe("string");
  });
});
```

## Usage from Other Modules

Vision Service (Module 2) will use:
```typescript
const clothingAnalysis = await claudeService.callClaudeVision(
  imageBase64,
  "List all clothing items, colors, and styles in this image"
);
```

Recommender Engine (Module 4) will use:
```typescript
const recommendations = await claudeService.callClaude(
  // Crafted prompt combining vision output + context
);
```

## Environment

Requires in `.env`:
```
CLAUDE_API_KEY=sk-ant-...
```

## Cost Optimization

- Batch requests if possible
- Cache responses for identical inputs
- Use shorter prompts where possible
- Consider token usage in logging

## ⚠️ Testing with Real API (Budget Conscious)

**IMPORTANT**: This module requires actual API calls. When testing:

### Testing Strategy
- **Use mocks for unit tests**: 99% of tests should use mock implementations
- **One integration test**: Create ONE real API test to verify the connection works
- **Minimal tokens**: Use `maxTokens: 50` in test to keep cost low (~$0.001 per test)

### Test Structure Example
```typescript
describe("ClaudeAPIService", () => {
  // ✅ Mock test (no API cost)
  it("should parse response correctly", async () => {
    const mockService = new MockClaudeService();
    const response = await mockService.callClaude("test");
    expect(response).toBe("mocked response");
  });

  // ✅ One real API test (minimal cost - ~$0.001)
  it("should call real Claude API with minimal tokens", async () => {
    const service = new ClaudeService();
    const response = await service.callClaude("Hi", { maxTokens: 50 });
    expect(response).toBeTruthy();
    // This test runs ONCE and costs ~$0.001
  });
});
```

### Dont's
- ❌ Don't call the real API for every test run
- ❌ Don't test the same prompt multiple times
- ❌ Don't use high token limits (keep it 50-100)
- ❌ Don't re-test if the test already passed once

---

**Status**: 🔲 Not started

**Estimated time**: 15-20 minutes

**Next module to wait for this**: Module 2 (Vision Service), Module 4 (Recommender)
