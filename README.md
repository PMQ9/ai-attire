# ai-attire

> AI-powered personal fashion advisor. Upload clothing images + describe your occasion, get personalized attire recommendations powered by Claude AI.

**Hackathon**: Vanderbilt Claude Builder Hackathon | **Scope**: 4-hour MVP | **Team**: Distributed agents

## 🎯 Quick Vision

User uploads image of their wardrobe → describes occasion (voice/text) → Claude analyzes and recommends what to wear.

## 🏗️ Modular Architecture

This project is designed for **parallel development**. Each module below is independent and can be worked on simultaneously:

```
ai-attire/
├── src/
│   ├── services/
│   │   ├── claude.ts              # [MODULE 1] Claude API wrapper
│   │   ├── vision.ts              # [MODULE 2] Image → clothing analysis
│   │   └── context.ts             # [MODULE 3] Parse occasion input
│   ├── engine/
│   │   └── recommender.ts         # [MODULE 4] Synthesize recommendations
│   ├── api.ts                      # [MODULE 5] Express server + endpoints
│   ├── types.ts                    # Shared TypeScript interfaces
│   └── index.ts                    # Entry point
├── docs/
│   ├── ARCHITECTURE.md             # Detailed architecture
│   ├── MODULE_1_CLAUDE_API.md      # Claude integration guide
│   ├── MODULE_2_VISION.md          # Image processing guide
│   ├── MODULE_3_CONTEXT.md         # Context parsing guide
│   ├── MODULE_4_RECOMMENDER.md     # Recommendation logic guide
│   └── MODULE_5_API.md             # API endpoints guide
├── .env.example                    # Environment template
├── package.json
├── tsconfig.json
└── DEVELOPMENT_GUIDE.md            # Complete development guide
```

## 📦 Modules for Parallel Work

| Module | File | Responsibility | Status |
|--------|------|-----------------|--------|
| **1. Claude API** | `src/services/claude.ts` | Wrapper for Claude API calls, prompt engineering | ✅ |
| **2. Vision Service** | `src/services/vision.ts` | Use Claude Vision to analyze clothing in images | ✅ |
| **3. Context Parser** | `src/services/context.ts` | Parse occasion/location input (wedding, business, etc.) | ✅ |
| **4. Recommender Engine** | `src/engine/recommender.ts` | Combine vision + context → personalized advice | ✅ |
| **5. API Server** | `src/api.ts` | Express endpoints to tie everything together | ✅ |

## 🚀 Quick Start

**New to this project?** Read **[DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)** - it has everything you need including:
- 5-minute quick start
- How to pick a module
- Complete workflow for parallel development
- Module specifications and guidelines

### Quick Setup
```bash
npm install
cp .env.example .env
# Edit .env and add: CLAUDE_API_KEY=your_key_here
```

### Run API Server
```bash
npm run dev

# Example request:
curl -X POST http://localhost:3000/analyze \
  -F "image=@clothing.jpg" \
  -F "occasion=wedding in Japan"
```

### Current Status: API-Only ⚙️

The backend is **fully functional** with a complete REST API. The frontend is **not yet implemented**.

**How to use:**
- Start the API server: `npm run dev` (runs on http://localhost:3000)
- Access via cURL, Postman, or any HTTP client
- No web UI currently - **frontend development is in progress**

**Frontend coming soon** with:
1. **File Upload Mode**: Browse and select image from disk
2. **Webcam Capture Mode**: Take a photo directly from your device's webcam

## 📋 Data Flow

```
User Image (JPG/PNG)
    ↓
[Vision Service] → Extract clothing items, colors, styles
    ↓
User Input: "Wedding in Japan, semi-formal"
    ↓
[Context Parser] → Extract: occasion, location, tone
    ↓
[Claude API] → Synthesize fashion advice
    ↓
[Recommender] → Generate personalized outfit recommendations
    ↓
API Response → User gets advice
```

## 🤝 How to Contribute (For Multiple Agents)

**Each module is independent.** Pick one, follow its guide, and implement it:

1. **Read** [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) - Complete setup and workflow
2. **Pick a module** from the table above
3. **Read** the module's documentation (e.g., `docs/MODULE_1_CLAUDE_API.md`)
4. **Implement** the module following the interface in `src/types.ts`
5. **Test** with `npm test`
6. **Mark complete** in the table above

## 💻 Tech Stack

- **Language**: TypeScript/Node.js
- **AI**: Claude API (with Vision)
- **Server**: Express.js
- **Testing**: Jest
- **Image Processing**: Claude Vision API (no external dependencies)

## 📚 Documentation

- **[DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)** ← Start here! Complete guide for setup, workflow, and contribution
- [Full Architecture](docs/ARCHITECTURE.md) - System design and data flow
- [Module Guides](docs/) - Implementation guides for each module
- [API Endpoints](docs/MODULE_5_API.md) - REST endpoint specifications

## ✅ MVP Status

### Backend (API) - COMPLETE ✅
- [x] Can upload an image of clothing (via API)
- [x] Can describe an occasion/context (via API)
- [x] Claude API analyzes and provides recommendations
- [x] API returns structured attire advice
- [x] Works end-to-end (image → recommendation)
- [x] All 128 unit tests passing
- [x] TypeScript compilation successful
- [x] API health endpoint operational

### Frontend (UI) - IN DEVELOPMENT 🔄
- [ ] Web interface (HTML/CSS/JavaScript)
- [ ] **Option 1**: Upload image from disk
- [ ] **Option 2**: Capture image from webcam
- [ ] Display recommendations in user-friendly format
- [ ] Show cultural tips and shopping suggestions

## 🎓 Example Usage

```bash
# User uploads wardrobe image and describes context
curl -X POST http://localhost:3000/analyze \
  -F "image=@my_wardrobe.jpg" \
  -F "occasion=business meeting in Thailand" \
  -F "preferences=breathable,professional"

# Response:
{
  "occasion": "Business Meeting",
  "location": "Thailand",
  "analysis": "Your wardrobe includes professional pieces suitable for warm climates...",
  "recommendations": [
    "Lightweight linen blazer with breathable cotton dress pants",
    "Avoid heavy wool or dark colors in the heat",
    "Consider tropical fabrics and earth tones"
  ],
  "culturalTips": "Business in Thailand values respect and formality - avoid showing shoulders"
}
```

## 🎨 Frontend Development (In Progress)

A frontend UI is being developed to make the API accessible through a web browser.

### Frontend Features (Planned)
- **HTML/CSS/JavaScript** web interface
- **Two input modes**:
  1. **File Upload**: Select and upload a wardrobe image from disk
  2. **Webcam Capture**: Take a live photo from your device's camera
- **Real-time recommendations** display
- **Responsive design** for desktop and mobile

### Frontend Integration
The frontend will call the existing API endpoints:
- `GET /health` - Check service status
- `POST /analyze` - Send image + occasion → receive recommendations

**Note**: The backend API is production-ready and fully functional. Frontend development is a separate module that will consume these endpoints.

---

## 📝 License

Created for Vanderbilt Claude Builder Hackathon." 
