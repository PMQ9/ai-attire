# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ai-attire** is an AI-powered fashion advisor for the Vanderbilt Claude Builder Hackathon. Users upload clothing images and describe occasions; the system analyzes their wardrobe and provides personalized outfit recommendations using Claude AI.

**Scope**: 4-hour MVP | **Team**: Multi-agent development | **Target**: End-to-end working fashion advice system

## Architecture Summary

### Core Design: 5 Independent Modules

The project is intentionally modularized for **parallel development**. Each module is self-contained and can be implemented independently if needed:

```
Module 1 (Claude API)  ──┐
                          ├──→ Module 2 (Vision) ──┐
Module 3 (Context)  ──┐  │                          ├──→ Module 4 (Recommender) ──→ Module 5 (API)
                      │  │                          │
                      └──┴─────────────────────────┘
```

### Data Flow Through System

```
User Input:
  - Image (JPG/PNG) of clothing
  - Text/Voice description of occasion

Processing Pipeline:
  1. Vision Service (Module 2)    → Analyzes image, extracts clothing items
  2. Context Parser (Module 3)    → Parses occasion/location/formality
  3. Recommender Engine (Module 4) → Combines analysis + context
  4. Claude API (Module 1)        → Calls Claude for fashion recommendations
  5. API Server (Module 5)        → Returns structured response

Output: Fashion advice with specific outfit recommendations
```

### Module Details

| # | Module | File | Responsibility | Dependencies |
|---|--------|------|-----------------|--------------|
| 1 | Claude API | `src/services/claude.ts` | Wrapper for Claude API calls | None |
| 2 | Vision Service | `src/services/vision.ts` | Analyze clothing in images | Module 1 |
| 3 | Context Parser | `src/services/context.ts` | Extract occasion/location/formality | None |
| 4 | Recommender | `src/engine/recommender.ts` | Synthesize recommendations | Modules 1, 2, 3 |
| 5 | API Server | `src/api.ts` | Express endpoints | Modules 2, 3, 4 |

### The Interface Contract: src/types.ts

**Critical**: All modules communicate through TypeScript interfaces defined in `src/types.ts`. This is the contract:

- `ClaudeAPIService` - Claude API wrapper interface
- `VisionService` - Vision analysis interface
- `ContextParser` - Context parsing interface
- `ClothingAnalysis` - Vision output type
- `OccasionContext` - Context parser output type
- `RecommendationRequest` - Input to recommender
- `RecommendationResponse` - Final output from recommender

**Do not modify interfaces without consensus.** They define how modules connect.

### Project Structure

```
src/
├── types.ts                 ← THE CONTRACT (all modules use these)
├── index.ts                 ← Entry point/exports
├── services/
│   ├── claude.ts           ← Module 1
│   ├── vision.ts           ← Module 2
│   ├── context.ts          ← Module 3
│   └── __tests__/          ← Unit tests
├── engine/
│   ├── recommender.ts      ← Module 4
│   └── __tests__/          ← Unit tests
└── api.ts                  ← Module 5

docs/
├── ARCHITECTURE.md         ← System design details
├── MODULE_1_CLAUDE_API.md  ← Complete spec for Module 1
├── MODULE_2_VISION.md      ← Complete spec for Module 2
├── MODULE_3_CONTEXT.md     ← Complete spec for Module 3
├── MODULE_4_RECOMMENDER.md ← Complete spec for Module 4
└── MODULE_5_API.md         ← Complete spec for Module 5

Config Files:
├── package.json            ← Dependencies and npm scripts
├── tsconfig.json           ← TypeScript configuration
├── jest.config.js          ← Test runner configuration
└── .env.example            ← Environment variables template
```

## Key Development Concepts

### Parallel Module Development

**Each module can be implemented independently** because:
1. Modules 1 & 3 have no dependencies - can start immediately
2. Once dependencies are complete, other modules become available
3. Modules communicate only through TypeScript interfaces
4. Each module can use mocks/stubs for dependencies while they're being built

### How Modules Talk to Each Other

Example from Recommender Engine (Module 4):
```typescript
constructor(
  private claudeService: ClaudeAPIService,    // Module 1
  private visionService: VisionService,        // Module 2
  private contextParser: ContextParser         // Module 3
) {}

async generateRecommendations(request: RecommendationRequest) {
  // Takes: clothing analysis (Module 2 output) + occasion (Module 3 output)
  // Calls: Claude API (Module 1) for recommendations
  // Returns: RecommendationResponse
}
```

### Module Status Tracking

The [README.md](README.md) module table shows which modules are complete. Update this when implementing:
- 🔲 Not started
- 🔄 In progress
- ✅ Complete

## Common Development Tasks

### Setup Development Environment
```bash
npm install
cp .env.example .env
# Edit .env and add your CLAUDE_API_KEY
```

### Run API Server
```bash
npm run dev
# Server runs on http://localhost:3000
```

### Testing
```bash
npm test                    # Run all tests
npm test -- --watch        # Watch mode for development
npm test -- MODULE_NAME    # Test specific module
```

### Build & Production
```bash
npm run build              # Compile TypeScript
npm start                  # Run production build
npm run clean              # Remove dist/ folder
```

### Example: Testing API Endpoint
```bash
npm run dev

# In another terminal:
curl -X POST http://localhost:3000/analyze \
  -F "image=@test_image.jpg" \
  -F "occasion=wedding in Japan"
```

## Implementing a New Module

### Step 1: Check Dependencies
Check `src/types.ts` - are dependencies available? If not:
- Start with modules 1 or 3 (no dependencies)
- Create mock implementations for missing dependencies while waiting

### Step 2: Read Module Documentation
- Each module has complete spec in `docs/MODULE_X_YYYYY.md`
- Includes: responsibility, input/output types, code examples, testing guidelines

### Step 3: Follow Interface Contract
- Implement the interface from `src/types.ts`
- Don't change the interface without consensus
- All inputs/outputs must match the types exactly

### Step 4: Write Tests
- Test file location: `src/services/__tests__/` or `src/engine/__tests__/`
- Copy test structure from module documentation
- Test happy path, error cases, and edge cases

### Step 5: Integration
- Once your module works, others can depend on it
- Check which modules depend on yours and coordinate

## Important Files to Reference

| File | Purpose |
|------|---------|
| [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) | Complete guide for all contributors - setup, workflow, contributing |
| [README.md](README.md) | Project overview and module status table |
| [src/types.ts](src/types.ts) | Interface contracts (the source of truth) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture and design decisions |
| [docs/MODULE_X_YYYYY.md](docs/) | Individual module specifications and guides |

## Working with Dependencies

### If You're Blocked by a Missing Dependency

Create a mock implementation:

```typescript
// Example: Mock Vision Service while waiting for Module 2
class MockVisionService implements VisionService {
  async analyzeClothing(imageBase64: string): Promise<ClothingAnalysis> {
    return {
      items: [
        { type: "shirt", color: "blue", style: "casual" },
        { type: "pants", color: "black", style: "formal" }
      ],
      overallStyle: "business-casual",
      colorPalette: ["blue", "black"],
      summary: "Mock wardrobe for testing"
    };
  }
}

// Use in your tests
const recommender = new RecommenderEngine(
  claudeService,
  mockVisionService,  // ← Use mock
  contextParser
);
```

This allows you to test your module's logic before dependencies are complete.

## Module Implementation Order

**Recommended parallel workflow for 4-hour hackathon:**

**Phase 1 (0-90 min)**: Independent modules
- Agent 1: Implement Module 1 (Claude API)
- Agent 2: Implement Module 3 (Context Parser)

**Phase 2 (90-180 min)**: Dependent modules
- Agent 1: Implement Module 2 (Vision) - depends on Module 1 ✓
- Agent 2: Implement Module 4 (Recommender) - depends on 1,2,3 (use mock for 2)

**Phase 3 (180-240 min)**: Integration
- Implement Module 5 (API Server) - ties everything together

## TypeScript & Code Style

- Strict mode enabled in `tsconfig.json`
- All modules must be properly typed
- Use `src/types.ts` interfaces for all module contracts
- Error messages should be descriptive
- Comments for complex logic sections

## Environment Variables

Required in `.env` (copy from `.env.example`):
- `CLAUDE_API_KEY` - Anthropic Claude API key
- `PORT` - Optional, defaults to 3000
- `NODE_ENV` - Optional, defaults to "development"

## ⚠️ IMPORTANT: API Key Usage for Claude Agents

**This section is for Claude Code agents running tests in the cloud.**

If you are running Claude agents in parallel to implement multiple modules, they may need the `CLAUDE_API_KEY` for testing. Follow these guidelines:

### When to Use the API Key
- ✅ **DO use** the API key only when **absolutely necessary** for:
  - Testing Module 1 (Claude API Service) actual API calls
  - Testing Module 2 (Vision Service) with real images
  - Testing the full end-to-end flow
  - **DO NOT use** for unit tests that can use mocks/stubs

### Minimize API Usage
- **Use mocks** for most tests - all tests should pass with mock services
- **Limit API calls** - each call costs money from your budget
- **Run locally first** - test locally with `.env` before running in cloud
- **Test once** - don't repeat the same API call test multiple times
- **Use minimal tokens** - set `maxTokens` to a low value for quick tests (50-100 tokens)

### Budget Management
- Budget: **$5 for 4-hour hackathon**
- Estimated cost: ~$0.001 per minimal test
- With proper mocking, you can run 100+ unit tests for ~$0.01

### For Cloud Agent Implementation
If implementing modules in Claude Code cloud environment and you need API testing:
1. Add `CLAUDE_API_KEY` to your Claude Code cloud environment (Settings → Environment)
2. Set Network Access to "Trusted" for external API calls
3. **Only run necessary tests** - don't run the same test twice
4. **Use mocks** for development, only test with real API when validating the whole system

## Success Criteria for Complete Project

- [ ] All 5 modules implemented and tested
- [ ] `npm test` passes all tests
- [ ] `npm run build` compiles without errors
- [ ] End-to-end: Can upload image → get fashion recommendations
- [ ] API endpoint `/analyze` works with image and occasion input
- [ ] All module status table items show ✅

## Quality Assurance & Testing Workflow

**IMPORTANT**: After implementing any feature or module, follow this workflow:

### 1. Write Unit Tests for Your Feature

- Create test file: `src/{services|engine}/__tests__/[module].test.ts`
- Test the happy path, error cases, and edge cases
- Use examples from `docs/MODULE_X_*.md` as templates
- Tests should verify your implementation matches the spec

Example test structure:
```typescript
describe("YourModule", () => {
  it("should do the expected thing", async () => {
    const result = await yourFunction();
    expect(result).toMatchExpectedOutput();
  });

  it("should handle error cases gracefully", async () => {
    expect(() => yourFunction(invalid)).toThrow();
  });
});
```

### 2. Add Tests to Regression Suite

Create or update `tests/regression.test.ts` to include your module's critical tests:

```typescript
// tests/regression.test.ts
describe("Regression Tests - Critical Features", () => {
  // Import tests from your module
  describe("Module 1: Claude API", () => {
    // Critical functionality tests
  });

  describe("Module 2: Vision Service", () => {
    // Critical functionality tests
  });
  // ... etc for all modules
});
```

The regression suite ensures all modules work together without breaking.

### 3. Run All Tests Before Marking Complete

```bash
# Run all unit tests
npm test

# Verify no regressions (all existing tests still pass)
# All tests should pass - if any fail, fix them before moving on
```

**Do not mark a module as complete** if tests are failing or if existing tests break.

### 4. Update CHANGELOG.md

After completing a feature/module, add a **concise entry** to [CHANGELOG.md](CHANGELOG.md):

Format:
```markdown
## [Module Name] - [Brief Description]

- **Status**: Implemented ✅
- **What was done**: 1-2 sentence summary
- **Tested**: Yes/No
- **Tests added**: List test file or regression entry
- **Dependencies met**: Yes/No
```

Example:
```markdown
## Module 1: Claude API Wrapper - Complete

- **Status**: Implemented ✅
- **What was done**: Wrapper for Claude API with `callClaude()` and `callClaudeVision()` methods
- **Tested**: Yes
- **Tests added**: `src/services/__tests__/claude.test.ts` (basic API calls, vision API calls, error handling)
- **Dependencies met**: N/A (no dependencies)
```

This helps:
- Future Claude Code instances see what's been done
- Avoid duplicate work
- Track progress through the 4-hour hackathon
- Understand implementation details quickly

### Test Checklist Before Marking Complete

- [ ] Written unit tests for your module
- [ ] All new tests pass: `npm test -- [module-name]`
- [ ] All existing tests still pass: `npm test`
- [ ] No regression tests broken
- [ ] Added entry to CHANGELOG.md
- [ ] TypeScript compiles: `npm run build`
- [ ] Updated README.md status table (module marked ✅)

## When Helping Contributors

1. **First**, point them to [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) for overview
2. **Then**, refer to specific module documentation in `docs/MODULE_X_*.md`
3. **Always**, emphasize the interface contract in `src/types.ts`
4. **Encourage** writing tests **while implementing**, not after
5. **Check** that their implementation matches the module spec exactly
6. **Verify** tests pass and changelog is updated before marking complete

## Troubleshooting

**Module compilation errors**: Check `src/types.ts` - interface might be wrong
**Tests failing**: Run single module test: `npm test -- MODULE_NAME`
**API not working**: Verify all 5 modules are implemented; check `/health` endpoint first
**Dependencies missing**: Install with `npm install` and check `package.json`

## Additional Resources

- [Anthropic Claude Documentation](https://docs.anthropic.com)
- [Express.js Documentation](https://expressjs.com)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Jest Testing Framework](https://jestjs.io)
