# Architecture Overview

## System Design

ai-attire is a lightweight MVP built with modular, independent components. Each module handles one responsibility and can be developed/tested independently.

### Core Flow

```
HTTP Request
    ↓
[API Server] - Express endpoint receives image + context
    ↓
[Vision Service] - Claude Vision API analyzes clothing items
    ↓
[Context Parser] - Extracts occasion, location, preferences
    ↓
[Recommender Engine] - Combines data and calls Claude for advice
    ↓
[Claude API] - Calls Claude API with structured prompt
    ↓
[Recommender] - Formats response
    ↓
HTTP Response - User receives fashion advice
```

## Module Dependencies

```
API Server (Module 5)
    ├── depends on Vision Service (Module 2)
    ├── depends on Context Parser (Module 3)
    └── depends on Recommender Engine (Module 4)

Recommender Engine (Module 4)
    ├── depends on Vision Service (Module 2) [for clothing data]
    ├── depends on Context Parser (Module 3) [for occasion data]
    └── depends on Claude API Service (Module 1) [for AI calls]

Vision Service (Module 2)
    └── depends on Claude API Service (Module 1)

Context Parser (Module 3)
    └── no dependencies

Claude API Service (Module 1)
    └── no dependencies
```

## Interfaces (TypeScript Types)

All modules communicate through interfaces defined in `src/types.ts`. See that file for the complete contract.

Key types:
- `ClothingAnalysis` - Output from vision service
- `OccasionContext` - Output from context parser
- `RecommendationRequest` - Input to recommender
- `RecommendationResponse` - Final output to user

## Implementation Order

**Recommended order for parallel work:**

1. **Start First (no dependencies)**:
   - Module 1: Claude API Service
   - Module 3: Context Parser

2. **Once #1 is done**:
   - Module 2: Vision Service
   - Module 5: API Server (stub endpoints)

3. **Once #2 is done**:
   - Module 4: Recommender Engine
   - Module 5: API Server (complete implementation)

## Environment Variables

All services read from `.env`:
- `CLAUDE_API_KEY` - Claude API key for all Claude calls
- `PORT` - Express server port (default 3000)
- `NODE_ENV` - "development" or "production"

## Testing Strategy

Each module should:
- Have unit tests in `__tests__` folder next to source
- Export functions that can be tested independently
- Mock Claude API responses for testing

Test command: `npm test`

## Error Handling

All modules should:
- Throw descriptive errors with context
- Log errors (API server catches and returns 500)
- Validate inputs before processing

## Performance Considerations

- Cache Claude API responses where possible
- Use streaming for large image processing (if needed)
- Keep prompt engineering efficient to reduce API costs

---

See individual module docs (MODULE_1.md, MODULE_2.md, etc.) for implementation details.
