# Outfit Image Search Feature

## Overview

The AI Attire app now displays **actual outfit images** alongside Claude's fashion recommendations. When Claude suggests "black jeans and a white t-shirt," users will see a real photo of someone wearing that outfit.

This feature uses the **Unsplash API** to search for high-quality fashion photography matching each recommended outfit.

---

## How It Works

### 1. User Flow

```
User uploads wardrobe image + describes occasion
           ↓
Claude analyzes and recommends outfits (text)
           ↓
For each recommendation, search Unsplash for matching outfit images
           ↓
Display images alongside recommendations
```

### 2. Technical Flow

```
Frontend → API Server → Recommender Engine → Claude API
                              ↓
                       Image Search Service → Unsplash API
                              ↓
                       RecommendationResponse (with outfit images)
                              ↓
                       Frontend displays images + text
```

---

## Implementation Details

### New Service: `src/services/imageSearch.ts`

**Purpose**: Search for fashion images based on outfit descriptions

**Two implementations available**:

1. **`UnsplashImageSearch`** (Default)
   - Direct search using Unsplash API
   - Optimizes search queries for fashion photography
   - Free tier: 50 requests/hour

2. **`ClaudeSmartImageSearch`** (Advanced)
   - Uses Claude to extract keywords from recommendations
   - More accurate search results
   - Higher cost (uses Claude API calls)
   - Currently not enabled by default

**Key Methods**:
- `searchOutfitImages(description, count)`: Search for images matching a description
- `getImagesForRecommendations(recommendations[])`: Fetch images for all outfit recommendations

**Graceful Fallback**:
- If no Unsplash API key is configured → uses placeholder images
- If search fails → returns placeholders
- Errors are logged but don't break the recommendation flow

---

### Updated Types: `src/types.ts`

**New Type**:
```typescript
export interface OutfitImage {
  url: string;                // Full-size image URL
  thumbnailUrl: string;       // Smaller preview URL
  description?: string;       // Alt text
  photographer?: string;      // Credit to photographer
  photographerUrl?: string;   // Link to photographer profile
  source: "unsplash" | "pexels" | "generated";
}
```

**Updated Type**:
```typescript
export interface RecommendationResponse {
  // ... existing fields
  outfitImages?: OutfitImage[];  // NEW: Images for each recommendation
}
```

---

### Updated Recommender: `src/engine/recommender.ts`

**Changes**:
- Added `imageSearchService` as optional dependency
- After generating recommendations, fetches images for each outfit
- Adds images to `RecommendationResponse.outfitImages`
- If image search fails, continues without images (non-blocking)

**All three methods now fetch images**:
1. `generateRecommendationsWithImage()` - Main single-call flow
2. `generateRecommendationsWithWeather()` - Weather-aware flow
3. `generateRecommendations()` - Legacy multi-call flow

---

### Updated API Server: `src/api.ts`

**Changes**:
- Imports `createImageSearchService()` function
- Instantiates image search service on startup
- Passes image search service to recommender engine

```typescript
const imageSearchService = createImageSearchService();
const recommenderEngine = new RecommenderEngine(
  claudeService,
  weatherService,
  imageSearchService  // NEW
);
```

---

### Updated Frontend: `public/app.js` & `public/styles.css`

**JavaScript Changes**:
- Updated `displayResults()` to render outfit images
- Each recommendation now displayed with:
  - Outfit image (if available)
  - Outfit description text
  - Photographer credit (Unsplash attribution)

**CSS Changes**:
- Added `.recommendations-list` - Container for all recommendations
- Added `.recommendation-item` - Individual outfit card
- Added `.outfit-image-container` - Image wrapper with max-width
- Added `.outfit-image` - Responsive image styling (3:4 aspect ratio)
- Added `.image-credit` - Photographer attribution
- Mobile-responsive layout (stacks vertically on small screens)

**Example HTML Output**:
```html
<div class="recommendations-list">
  <div class="recommendation-item with-image">
    <div class="outfit-image-container">
      <img src="https://images.unsplash.com/..." alt="..." class="outfit-image">
      <p class="image-credit">Photo by John Doe on Unsplash</p>
    </div>
    <div class="outfit-text">
      <strong>Outfit 1:</strong> Black jeans with white t-shirt...
    </div>
  </div>
  <!-- More recommendations... -->
</div>
```

---

## Setup Instructions

### 1. Get an Unsplash API Key (Free)

1. Go to https://unsplash.com/developers
2. Sign up / Log in
3. Create a new application
4. Copy your "Access Key"

**Free Tier Limits**:
- 50 requests per hour
- Perfect for development and low-traffic apps

### 2. Configure Environment Variable

Add to your `.env` file:
```bash
UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
```

**Note**: If you don't set this, the app will still work but use placeholder images instead of real photos.

### 3. Restart the Server

```bash
npm run dev
```

---

## Usage Examples

### Example 1: Basic Usage

**User Input**:
- Image: Wardrobe with jeans, t-shirts, blazer
- Occasion: "Job interview in tech startup"

**Claude Recommendation**:
- "Outfit 1: Navy blazer with white t-shirt and dark jeans for a smart-casual tech interview look"

**Image Search**:
- Query: "person wearing navy blazer white t-shirt dark jeans fashion portrait"
- Result: High-quality Unsplash photo matching the description

### Example 2: Weather-Aware

**User Input**:
- Image: Summer wardrobe
- Occasion: "Wedding in Tokyo next week"
- Weather toggle: ON

**Claude Recommendation**:
- "Outfit 1: Light linen suit with breathable shirt, perfect for Tokyo's humid summer weather"

**Image Search**:
- Query: "person wearing light linen suit summer fashion portrait"
- Result: Photo of someone in a light summer suit

---

## Advanced: Smart Search with Claude

To enable Claude-powered keyword extraction for more accurate searches:

```typescript
// In src/api.ts, change:
const imageSearchService = createImageSearchService(true); // Enable smart search
```

**Pros**:
- More accurate image results
- Better parsing of complex outfit descriptions

**Cons**:
- Uses additional Claude API calls
- Slightly higher cost
- Slightly slower response time

---

## Troubleshooting

### Images not showing?

**Check**:
1. Is `UNSPLASH_ACCESS_KEY` set in `.env`?
   ```bash
   grep UNSPLASH_ACCESS_KEY .env
   ```

2. Are you within Unsplash rate limits? (50 requests/hour)
   - Check browser console for "429 Too Many Requests"

3. Is the search query too specific?
   - The app automatically optimizes queries, but very niche outfits may not have matching photos

### Placeholder images appearing?

This is normal when:
- No Unsplash API key is configured
- Unsplash search returns no results
- API request fails

**Action**: Check browser console for error messages

### Images loading slowly?

- Images use lazy loading (`loading="lazy"`)
- First-time loads may be slow depending on Unsplash CDN
- Consider caching responses for production use

---

## Performance Considerations

### Current Implementation
- **Parallel fetching**: Images for all recommendations fetched simultaneously
- **Non-blocking**: If image search fails, recommendations still display
- **Lazy loading**: Images load as they scroll into view

### Production Optimizations (Future)

1. **Caching**: Cache Unsplash search results
   - Use Redis or in-memory cache
   - Cache duration: 1 hour (matches Unsplash rate limit window)

2. **Image CDN**: Serve images through own CDN
   - Reduce dependency on Unsplash
   - Faster load times

3. **Preloading**: Fetch images during Claude API call
   - Start image search while waiting for Claude response
   - Reduce total response time

---

## Cost Analysis

### Unsplash API (Free Tier)
- **Cost**: $0
- **Limits**: 50 requests/hour
- **Sufficient for**: Development, low-traffic apps, demos

### Unsplash API (Production)
- **Cost**: Contact Unsplash for pricing
- **Limits**: Higher rate limits
- **Needed for**: High-traffic production apps

### Claude Smart Search (Optional)
- **Cost**: ~$0.001 per recommendation (using Haiku model)
- **When enabled**: Adds keyword extraction step
- **Budget**: Minimal impact for most use cases

---

## Future Enhancements

### Short-term
- [ ] Cache Unsplash search results
- [ ] Add image quality preference (high/medium/low)
- [ ] Support multiple images per outfit (carousel)

### Medium-term
- [ ] User-uploaded outfit images (save to database)
- [ ] Image similarity search (find similar outfits)
- [ ] Filter by gender, style, season

### Long-term
- [ ] AI-generated outfit images (using DALL-E or similar)
- [ ] Virtual try-on using user's photo
- [ ] Social sharing with outfit images

---

## Credits

**Image Provider**: [Unsplash](https://unsplash.com)
- All images are properly attributed to photographers
- Photographer credits displayed below each image
- Links to photographer profiles included

**API Documentation**: https://unsplash.com/documentation

---

## License Compliance

**Unsplash License**: Images are free to use under [Unsplash License](https://unsplash.com/license)

**Requirements**:
- ✅ Photographer attribution (implemented)
- ✅ Link to photographer profile (implemented)
- ✅ "on Unsplash" credit (implemented)

---

## Summary

The outfit image search feature:
- ✅ Enhances user experience with visual recommendations
- ✅ Uses high-quality fashion photography from Unsplash
- ✅ Gracefully degrades when API is unavailable
- ✅ Respects photographer attribution requirements
- ✅ Mobile-responsive design
- ✅ Zero cost for development (free tier)
- ✅ Non-blocking (doesn't slow down recommendations)

**Impact**: Users can now **see** what Claude recommends, making fashion advice more actionable and engaging.
