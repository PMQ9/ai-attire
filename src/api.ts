/**
 * Module 5: API Server
 * Express.js HTTP server exposing /analyze endpoint
 * Ties all modules together for end-to-end fashion recommendations
 *
 * Dependencies:
 * - Module 1 (ClaudeService): Claude API wrapper
 * - Module 2 (VisionService): Image analysis
 * - Module 3 (ContextParser): Occasion parsing
 * - Module 4 (RecommenderEngine): Recommendation generation
 */

import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import path from "path";

import { ClaudeService } from "./services/claude";
import { VisionServiceImpl } from "./services/vision";
import { ContextParser } from "./services/context";
import { RecommenderEngine } from "./engine/recommender";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (_req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Initialize services
const claudeService = new ClaudeService();
const visionService = new VisionServiceImpl(claudeService);
const contextParser = new ContextParser();
const recommenderEngine = new RecommenderEngine(claudeService);

// Middleware
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      claude: "ready",
      vision: "ready",
      context: "ready",
      recommender: "ready"
    }
  });
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
    if (!occasion || occasion.trim().length === 0) {
      return res.status(400).json({
        error: "Occasion required",
        code: "MISSING_OCCASION",
      });
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`[API] Received request: ${occasion}`);
      console.log(`[API] Image size: ${req.file.size} bytes`);
    }

    // 2. Convert image to base64
    const imageBase64 = req.file.buffer.toString("base64");

    // 3. Analyze clothing (Module 2)
    if (process.env.NODE_ENV === "development") {
      console.log("[API] Analyzing clothing...");
    }
    const clothingAnalysis = await visionService.analyzeClothing(imageBase64);

    // 4. Parse occasion context (Module 3)
    if (process.env.NODE_ENV === "development") {
      console.log("[API] Parsing occasion context...");
    }
    const occasionContext = contextParser.parseOccasion(occasion);

    // 5. Generate recommendations (Module 4)
    if (process.env.NODE_ENV === "development") {
      console.log("[API] Generating recommendations...");
    }
    const recommendations = await recommenderEngine.generateRecommendations({
      clothingAnalysis,
      occasionContext,
    });

    // 6. Return response
    if (process.env.NODE_ENV === "development") {
      console.log("[API] Success! Returning recommendations.");
    }

    // Merge clothing analysis and formality into the response for frontend display
    const response = {
      ...recommendations,
      clothingAnalysis,
      formality: occasionContext.formality,
    };

    return res.json(response);
  } catch (error) {
    console.error("Error in /analyze:", error);

    // Determine appropriate error code and status
    let errorCode = "INTERNAL_ERROR";
    let statusCode = 500;
    let errorMessage = "Failed to analyze image";

    if (error instanceof Error) {
      errorMessage = error.message;

      // Categorize errors for better client experience
      if (error.message.includes("Vision") || error.message.includes("analyze")) {
        errorCode = "VISION_ERROR";
      } else if (error.message.includes("parse") || error.message.includes("Parse")) {
        errorCode = "PARSE_ERROR";
      } else if (error.message.includes("recommend") || error.message.includes("Recommend")) {
        errorCode = "RECOMMENDATION_ERROR";
      } else if (error.message.includes("API key") || error.message.includes("authentication")) {
        errorCode = "AUTH_ERROR";
        statusCode = 401;
      } else if (error.message.includes("rate limit")) {
        errorCode = "RATE_LIMIT_ERROR";
        statusCode = 429;
      }
    }

    return res.status(statusCode).json({
      error: errorMessage,
      code: errorCode,
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Global error handler for uncaught errors
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);

    // Handle multer errors
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: "File too large (max 10MB)",
          code: "FILE_TOO_LARGE",
        });
      }
      return res.status(400).json({
        error: err.message,
        code: "UPLOAD_ERROR",
      });
    }

    // Handle file filter errors
    if (err.message === 'Only image files are allowed') {
      return res.status(400).json({
        error: err.message,
        code: "INVALID_FILE_TYPE",
      });
    }

    // Default error
    return res.status(500).json({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
);

// Start server (only if this file is run directly)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Analyze endpoint: POST http://localhost:${PORT}/analyze`);
  });
}

// Export app for testing
export { app };
