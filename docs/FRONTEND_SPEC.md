# Frontend Specification - AI-Attire Web UI

**Status**: 🔄 In Development
**Priority**: Medium (Backend API is complete and working)
**Estimated Time**: 2-3 hours

---

## Overview

Build a web interface for the AI-Attire fashion advisor system. Users can upload wardrobe images and describe occasions to get personalized outfit recommendations powered by Claude AI.

## Features Required

### 1. User Interface Components

#### Main Page Layout
```
┌─────────────────────────────────────────┐
│         AI-ATTIRE Fashion Advisor       │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Input Mode Selection           │   │
│  │  ○ Upload Image                 │   │
│  │  ○ Capture from Webcam          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Image Input Area               │   │
│  │  [Drag & drop or click]          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Occasion Input                  │   │
│  │ [Text field]                    │   │
│  │ Example: "wedding in Japan"     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Analyze Button]                       │
│                                         │
└─────────────────────────────────────────┘
```

### 2. Input Mode 1: File Upload

**Features:**
- Drag-and-drop area for images
- Click to browse file system
- File type validation (JPG, PNG, GIF, WebP)
- File size validation (max 10MB)
- Preview of selected image

**Accepted formats:**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### 3. Input Mode 2: Webcam Capture

**Features:**
- Real-time webcam preview
- "Capture Photo" button
- Ability to retake photos
- Permission handling for camera access

**Implementation Notes:**
- Use HTML5 `<video>` and `<canvas>` APIs
- Handle camera permission errors gracefully
- Store captured image as blob for upload

### 4. Occasion Input

**Form Field:**
- Text input for occasion description
- Examples: "wedding in Japan", "business meeting in Thailand", "casual weekend"
- Optional: Dropdown suggestions for common occasions

**Validation:**
- Required field
- Minimum 3 characters
- Maximum 200 characters

### 5. Results Display

After analysis, display recommendations in organized sections:

#### Layout
```
┌─────────────────────────────────────────┐
│         Recommendations                 │
├─────────────────────────────────────────┤
│                                         │
│ Occasion: Wedding                       │
│ Location: Japan                         │
│                                         │
│ Summary:                                │
│ [Fashion advice summary text]           │
│                                         │
│ Outfit Recommendations:                 │
│ 1. [Outfit 1]                          │
│ 2. [Outfit 2]                          │
│ 3. [Outfit 3]                          │
│ ...                                     │
│                                         │
│ Cultural Tips:                          │
│ • [Tip 1]                              │
│ • [Tip 2]                              │
│                                         │
│ What NOT to Wear:                       │
│ • [Don't wear 1]                       │
│ • [Don't wear 2]                       │
│                                         │
│ Shopping Tips:                          │
│ • [Recommendation 1]                   │
│ • [Recommendation 2]                   │
│                                         │
└─────────────────────────────────────────┘
```

**Display Sections:**
1. **Occasion & Location** - Echo back what was analyzed
2. **Summary** - Overall fashion advice
3. **Outfit Recommendations** - 3-5 specific combinations
4. **Cultural Tips** - Location-specific etiquette
5. **What NOT to Wear** - Things to avoid
6. **Shopping Tips** - Missing wardrobe pieces to consider

---

## API Integration

### Backend API Endpoints

The frontend will communicate with these endpoints:

#### Health Check
```
GET /health

Response (200 OK):
{
  "status": "ok",
  "timestamp": "2025-11-15T23:37:39.270Z",
  "services": {
    "claude": "ready",
    "vision": "ready",
    "context": "ready",
    "recommender": "ready"
  }
}
```

#### Analyze (Main Endpoint)
```
POST /analyze

Request (multipart/form-data):
- image: File (JPEG, PNG, GIF, WebP, max 10MB)
- occasion: String (required, 3-200 chars)
- preferences: String (optional)

Response (200 OK):
{
  "occasion": "wedding",
  "location": "Japan",
  "summary": "For a formal wedding in Japan...",
  "recommendations": [
    "Outfit 1",
    "Outfit 2",
    ...
  ],
  "culturalTips": ["Tip 1", "Tip 2"],
  "dontWear": ["Don't 1", "Don't 2"],
  "shoppingTips": ["Shopping 1", "Shopping 2"]
}

Response (400 Bad Request):
{
  "error": "Image required",
  "code": "MISSING_IMAGE"
}

Response (500 Internal Server Error):
{
  "error": "Failed to analyze image",
  "code": "VISION_ERROR",
  "details": "Error message"
}
```

---

## Technical Requirements

### Frontend Stack (Recommendations)
- **HTML/CSS/JavaScript** - Vanilla or framework (React, Vue, Svelte, etc.)
- **No additional dependencies** unless necessary
- **Responsive design** - Mobile + Desktop
- **Cross-browser support** - Modern browsers (Chrome, Firefox, Safari, Edge)

### Functionality Requirements

1. **State Management**
   - Current input mode (upload vs webcam)
   - Selected/captured image
   - Occasion text
   - Loading state during API call
   - Results/recommendations

2. **API Communication**
   - Fetch or axios for HTTP requests
   - FormData for multipart upload
   - Error handling with user-friendly messages
   - Loading indicators

3. **Image Handling**
   - File validation (type, size)
   - Image preview before upload
   - Base64 or blob handling for upload

4. **Webcam Handling**
   - Request camera permission
   - Display live preview
   - Capture frame to canvas
   - Convert canvas to blob/file

---

## Implementation Checklist

- [ ] **HTML Structure**
  - [ ] Main container
  - [ ] Input mode selector (radio buttons)
  - [ ] File upload area (drag-drop)
  - [ ] Webcam container
  - [ ] Image preview area
  - [ ] Occasion input field
  - [ ] Analyze button
  - [ ] Results container

- [ ] **CSS Styling**
  - [ ] Responsive layout
  - [ ] Dark/light theme (optional)
  - [ ] Loading states
  - [ ] Error states
  - [ ] Mobile friendly

- [ ] **JavaScript Functionality**
  - [ ] Input mode toggle
  - [ ] File upload handling
    - [ ] Drag-and-drop
    - [ ] Click to browse
    - [ ] File validation
    - [ ] Preview display
  - [ ] Webcam functionality
    - [ ] Permission request
    - [ ] Live preview
    - [ ] Capture button
    - [ ] Retake option
  - [ ] Form validation
  - [ ] API integration
    - [ ] Health check on load
    - [ ] Analyze request
    - [ ] Error handling
  - [ ] Results display
    - [ ] Format recommendations
    - [ ] Display sections
    - [ ] Styling

- [ ] **Testing**
  - [ ] Test with various image formats
  - [ ] Test with different screen sizes
  - [ ] Test error scenarios
  - [ ] Test webcam permission denial
  - [ ] Test API connection errors

---

## File Organization

```
public/
├── index.html           # Main HTML file
├── styles.css           # Styling
├── script.js            # JavaScript logic
└── assets/              # Images, icons, etc.
```

Or if using a framework:
```
src/
├── components/
│   ├── ImageUpload.jsx
│   ├── WebcamCapture.jsx
│   ├── OccasionInput.jsx
│   └── RecommendationResults.jsx
├── App.jsx
└── styles.css
```

---

## Example Workflow (User Perspective)

1. User opens the web app
2. App checks `/health` to ensure backend is available
3. User selects input mode (Upload or Webcam)
4. **If Upload**:
   - User drags image or clicks to browse
   - App shows preview
5. **If Webcam**:
   - App requests camera permission
   - User sees live preview
   - User clicks "Capture"
6. User enters occasion: "wedding in Japan"
7. User clicks "Analyze"
8. App shows loading indicator
9. App sends request to `POST /analyze`
10. Backend analyzes and returns recommendations
11. App displays all recommendations beautifully formatted

---

## API Response Example

```json
{
  "occasion": "wedding",
  "location": "Japan",
  "summary": "For a formal wedding in Japan, your traditional Asian ceremonial attire is appropriate and will be respectful of the cultural setting.",
  "recommendations": [
    "Traditional Chinese tunic with dark navy dress pants and black leather shoes",
    "Traditional Vietnamese áo dài with dark navy dress pants and black dress shoes",
    "Áo dài inspired jacket over navy dress pants with black shoes"
  ],
  "culturalTips": [
    "Japanese weddings require conservative formal dress",
    "Be prepared to remove shoes when entering certain venues",
    "Avoid pure white (bride's color) or pure black (funeral color)"
  ],
  "dontWear": [
    "Overly casual accessories or sneakers",
    "Excessive jewelry or flashy accessories",
    "Anything wrinkled or stained"
  ],
  "shoppingTips": [
    "Consider formal dress socks in black or navy",
    "A subtle clutch or formal envelope bag would be useful",
    "Consider a formal overcoat for outdoor events"
  ]
}
```

---

## Notes for Frontend Developer

1. **Backend is working**: All 5 modules are complete, tested, and operational. The API is production-ready.
2. **No breaking changes needed**: Your UI just needs to call the existing endpoints.
3. **Keep it simple**: Focus on clean UX that makes the API accessible.
4. **Handle errors gracefully**: Show user-friendly error messages for network issues, validation errors, etc.
5. **Mobile first**: Users may take photos from phones, so design mobile-friendly UI.
6. **Accessibility**: Use semantic HTML, ARIA labels where needed.

---

**Good luck! You're building the bridge between users and our powerful AI fashion advisor! 🎨✨**
