/**
 * Module 5: API Server Tests
 * Tests for Express.js endpoints
 *
 * Note: These tests focus on input validation and error handling.
 * Full integration tests with real API calls are separate.
 */

import request from "supertest";
import { app } from "../api";

describe("API Server", () => {
  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status", "ok");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("services");
      expect(response.body.services).toHaveProperty("claude", "ready");
      expect(response.body.services).toHaveProperty("vision", "ready");
      expect(response.body.services).toHaveProperty("context", "ready");
      expect(response.body.services).toHaveProperty("recommender", "ready");
    });

    it("should return a valid timestamp", async () => {
      const response = await request(app).get("/health");
      const timestamp = new Date(response.body.timestamp);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });

  describe("POST /analyze - Input Validation", () => {
    it("should return 400 if image is missing", async () => {
      const response = await request(app)
        .post("/analyze")
        .field("occasion", "wedding");

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Image required");
      expect(response.body).toHaveProperty("code", "MISSING_IMAGE");
    });

    it("should return 400 if occasion is missing", async () => {
      const response = await request(app)
        .post("/analyze")
        .attach("image", Buffer.from("fake-image-data"), "test.jpg");

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Occasion required");
      expect(response.body).toHaveProperty("code", "MISSING_OCCASION");
    });

    it("should return 400 if occasion is empty string", async () => {
      const response = await request(app)
        .post("/analyze")
        .field("occasion", "   ")
        .attach("image", Buffer.from("fake-image-data"), "test.jpg");

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Occasion required");
      expect(response.body).toHaveProperty("code", "MISSING_OCCASION");
    });

    it("should accept requests with both image and occasion", async () => {
      const response = await request(app)
        .post("/analyze")
        .field("occasion", "wedding in Japan")
        .attach("image", Buffer.from("fake-image-data"), "test.jpg");

      // Should not be a 400 error (will be 500 or 200 depending on API key)
      expect(response.status).not.toBe(400);
    });
  });

  describe("POST /analyze - File Upload Handling", () => {
    it("should handle file size limit errors", async () => {
      // Create a large buffer (larger than 10MB)
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024);

      const response = await request(app)
        .post("/analyze")
        .field("occasion", "wedding")
        .attach("image", largeBuffer, "large.jpg");

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code");
      // Should be FILE_TOO_LARGE or UPLOAD_ERROR
      expect(["FILE_TOO_LARGE", "UPLOAD_ERROR"]).toContain(response.body.code);
    });

    it("should reject non-image files", async () => {
      const response = await request(app)
        .post("/analyze")
        .field("occasion", "wedding")
        .attach("image", Buffer.from("not-an-image"), {
          filename: "document.pdf",
          contentType: "application/pdf",
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "INVALID_FILE_TYPE");
      expect(response.body).toHaveProperty("error", "Only image files are allowed");
    });

    it("should accept image files", async () => {
      const response = await request(app)
        .post("/analyze")
        .field("occasion", "wedding")
        .attach("image", Buffer.from("fake-image-data"), {
          filename: "test.jpg",
          contentType: "image/jpeg",
        });

      // Should not be a file type error
      expect(response.body.code).not.toBe("INVALID_FILE_TYPE");
    });
  });

  describe("POST /analyze - Response Structure", () => {
    it("should return JSON response", async () => {
      const response = await request(app)
        .post("/analyze")
        .field("occasion", "casual outing")
        .attach("image", Buffer.from("fake-image-data"), "test.jpg");

      expect(response.headers["content-type"]).toMatch(/json/);
    });

    it("should have error structure on failures", async () => {
      const response = await request(app)
        .post("/analyze")
        .field("occasion", "wedding");

      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("code");
      expect(typeof response.body.error).toBe("string");
      expect(typeof response.body.code).toBe("string");
    });
  });

  describe("Endpoint Availability", () => {
    it("should have /health endpoint", async () => {
      const response = await request(app).get("/health");
      expect(response.status).not.toBe(404);
    });

    it("should have /analyze endpoint", async () => {
      const response = await request(app).post("/analyze");
      expect(response.status).not.toBe(404);
    });

    it("should return 404 for unknown routes", async () => {
      const response = await request(app).get("/unknown-route");
      expect(response.status).toBe(404);
    });
  });

  describe("HTTP Methods", () => {
    it("should not allow GET requests to /analyze", async () => {
      const response = await request(app).get("/analyze");
      expect(response.status).not.toBe(200);
    });

    it("should not allow PUT requests to /analyze", async () => {
      const response = await request(app).put("/analyze");
      expect(response.status).not.toBe(200);
    });

    it("should not allow DELETE requests to /analyze", async () => {
      const response = await request(app).delete("/analyze");
      expect(response.status).not.toBe(200);
    });
  });
});
