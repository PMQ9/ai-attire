# Module 5: API Server

**File**: `src/api.ts`

**Responsibility**: Express.js HTTP server exposing `/analyze` endpoint. Ties all modules together.

**Dependencies**: Module 2 (Vision), Module 3 (Context), Module 4 (Recommender)

## API Endpoints

### POST /analyze

**Purpose**: Analyze user's clothing and generate recommendations

**Request** (multipart/form-data):
```
POST /analyze HTTP/1.1
Content-Type: multipart/form-data

image: <binary image file>
occasion: "wedding in Japan"
preferences: "elegant,comfortable"
```

**Response** (200 OK):
```json
{
  "occasion": "wedding",
  "location": "Japan",
  "summary": "For a wedding in Japan, elegance and respect are paramount...",
  "recommendations": [
    "Formal dark suit with silk tie",
    "White dress shirt with minimal pattern",
    "Black formal dress shoes"
  ],
  "culturalTips": [
    "Japanese weddings value formality and respect",
    "Avoid bright colors; earth tones and dark colors are preferred"
  ],
  "dontWear": [
    "White (traditionally for funerals)",
    "Overly casual or revealing clothing",
    "Loud patterns or excessive jewelry"
  ],
  "shoppingTips": [
    "Consider a formal Japanese-inspired accessory"
  ]
}
```

**Error Response** (400 Bad Request):
```json
{
  "error": "Image required",
  "code": "MISSING_IMAGE"
}
```

**Error Response** (500 Internal Server Error):
```json
{
  "error": "Failed to analyze image",
  "code": "VISION_ERROR"
}
```

## Implementation

### Code Structure

```typescript
import express from "express";
import multer from "multer";
import dotenv from "dotenv";

import { ClaudeAPIService } from "./services/claude";
import { VisionService } from "./services/vision";
import { ContextParser } from "./services/context";
import { RecommenderEngine } from "./engine/recommender";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Initialize services
const claudeService = new ClaudeAPIService();
const visionService = new VisionService(claudeService);
const contextParser = new ContextParser();
const recommenderEngine = new RecommenderEngine(
  claudeService,
  visionService,
  contextParser
);

// Middleware
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Main analyze endpoint
app.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    // 1. Validate inputs
    if (!req.file) {
      return res.status(400).json({
        error: "Image required",
        code: "MISSING_IMAGE",
      });
    }

    const occasion = req.body.occasion;
    if (!occasion) {
      return res.status(400).json({
        error: "Occasion required",
        code: "MISSING_OCCASION",
      });
    }

    // 2. Convert image to base64
    const imageBase64 = req.file.buffer.toString("base64");

    // 3. Analyze clothing
    const clothingAnalysis = await visionService.analyzeClothing(imageBase64);

    // 4. Parse occasion context
    const occasionContext = contextParser.parseOccasion(occasion);

    // 5. Generate recommendations
    const recommendations = await recommenderEngine.generateRecommendations({
      clothingAnalysis,
      occasionContext,
    });

    // 6. Return response
    res.json(recommendations);
  } catch (error) {
    console.error("Error in /analyze:", error);
    res.status(500).json({
      error: "Failed to analyze image",
      code: "VISION_ERROR",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

## Setup

1. **Install dependencies**:
   ```bash
   npm install express multer dotenv typescript @types/express @types/node
   npm install --save-dev ts-node @types/multer
   ```

2. **Create scripts in package.json**:
   ```json
   {
     "scripts": {
       "dev": "ts-node src/api.ts",
       "start": "node dist/api.js",
       "build": "tsc"
     }
   }
   ```

3. **Setup .env**:
   ```
   CLAUDE_API_KEY=sk-ant-...
   PORT=3000
   NODE_ENV=development
   ```

## Testing

Test cases:
- [ ] Test with valid image and occasion
- [ ] Test with missing image (400 error)
- [ ] Test with missing occasion (400 error)
- [ ] Test with invalid image format
- [ ] Test response structure matches specification
- [ ] Test error handling

**Test file**: `src/__tests__/api.test.ts`

Example test:
```typescript
describe("API /analyze", () => {
  it("returns recommendations for valid request", async () => {
    const response = await request(app)
      .post("/analyze")
      .field("occasion", "wedding")
      .attach("image", "test-image.jpg");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("recommendations");
    expect(Array.isArray(response.body.recommendations)).toBe(true);
  });

  it("returns 400 for missing image", async () => {
    const response = await request(app)
      .post("/analyze")
      .field("occasion", "wedding");

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("MISSING_IMAGE");
  });
});
```

## Example Usage (cURL)

```bash
# Single file upload
curl -X POST http://localhost:3000/analyze \
  -F "image=@my_wardrobe.jpg" \
  -F "occasion=business meeting in Thailand"

# With preferences
curl -X POST http://localhost:3000/analyze \
  -F "image=@wardrobe.jpg" \
  -F "occasion=casual weekend" \
  -F "preferences=comfortable,stylish"
```

## Performance Considerations

- Image validation before processing
- Proper error handling and logging
- Consider request size limits
- Cache responses if needed (advanced)

## Future Enhancements

- [ ] Add authentication
- [ ] Add database to store wardrobe data
- [ ] Add voice input processing
- [ ] Add pagination for recommendations
- [ ] Add frontend UI

---

**Status**: 🔲 Waiting for Modules 2, 3, 4

**Estimated time**: 15-20 minutes

**Blocked by**: Module 2, Module 3, Module 4

**Next**: Final integration and testing
