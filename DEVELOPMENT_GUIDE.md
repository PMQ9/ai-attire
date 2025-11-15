# Development Guide

Complete guide for contributing to ai-attire. Everything you need to know to implement modules and work in parallel.

---

## Table of Contents

1. [Quick Start](#quick-start) - Get running in 5 minutes
2. [Foundation Summary](#foundation-summary) - Complete setup overview
3. [Module Specifications](#module-specifications) - What needs to be built
4. [Parallel Development Workflow](#parallel-development-workflow) - How to coordinate
5. [Contributing Guidelines](#contributing-guidelines) - How to contribute
6. [FAQs](#faqs) - Common questions

---

## Quick Start

### 30-Second Setup

```bash
npm install
cp .env.example .env
# Add your Claude API key to .env
npm run test  # Verify setup works
```

### Pick Your Module (5 min)

Look at the progress table in [README.md](README.md). Pick ONE:

1. **Claude API Service** - Talk to Claude API
2. **Vision Service** - Analyze clothing in images
3. **Context Parser** - Understand what the user needs
4. **Recommender Engine** - Generate recommendations
5. **API Server** - Tie it all together

### Implement Your Module (60-90 min)

1. **Read** `docs/MODULE_X_YYYYY.md` for your module
2. **Look at** `src/types.ts` for interfaces
3. **Copy the code structure** from the module docs
4. **Test it** with `npm test`
5. **Iterate** until it works

### Example: Implementing Module 1 (Claude API)

```bash
# 1. Create the file
touch src/services/claude.ts

# 2. Copy structure from docs/MODULE_1_CLAUDE_API.md
# 3. Implement callClaude() and callClaudeVision()
# 4. Test with:
npm test -- claude.test.ts

# 5. When ready, update README status table
```

### Testing

```bash
# Test your module
npm test -- MODULE_NAME

# Run all tests
npm test

# Watch mode for development
npm test -- --watch
```

**⚠️ BUDGET NOTE**: Use mocks for 99% of tests to save API costs. Only run real API tests when necessary. See CLAUDE.md → "API Key Usage for Claude Agents" for details on keeping costs under control.

### When Stuck

1. **Read the docs** - `docs/MODULE_X_*.md` has examples
2. **Check types** - `src/types.ts` is the contract
3. **Look at existing code** - Other modules show patterns
4. **Ask** - Better to clarify than guess

---

## Foundation Summary

### What's Been Created

#### 📋 Documentation

| File | Purpose |
|------|---------|
| [README.md](README.md) | Project overview, vision, module table |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, data flow, dependencies |
| [docs/MODULE_1_CLAUDE_API.md](docs/MODULE_1_CLAUDE_API.md) | Claude API wrapper spec & guide |
| [docs/MODULE_2_VISION.md](docs/MODULE_2_VISION.md) | Vision service spec & guide |
| [docs/MODULE_3_CONTEXT.md](docs/MODULE_3_CONTEXT.md) | Context parser spec & guide |
| [docs/MODULE_4_RECOMMENDER.md](docs/MODULE_4_RECOMMENDER.md) | Recommender engine spec & guide |
| [docs/MODULE_5_API.md](docs/MODULE_5_API.md) | Express API server spec & guide |

#### 🔧 Project Setup

| File | Purpose |
|------|---------|
| [package.json](package.json) | Dependencies & scripts |
| [tsconfig.json](tsconfig.json) | TypeScript configuration |
| [jest.config.js](jest.config.js) | Test configuration |
| [.env.example](.env.example) | Environment template |

#### 📁 Source Code Structure

```
src/
├── types.ts                    # Shared interfaces (THE CONTRACT)
├── index.ts                    # Entry point
├── services/
│   ├── claude.ts              # [MODULE 1]
│   ├── vision.ts              # [MODULE 2]
│   ├── context.ts             # [MODULE 3]
│   └── __tests__/             # Unit tests
├── engine/
│   ├── recommender.ts         # [MODULE 4]
│   └── __tests__/             # Unit tests
└── api.ts                      # [MODULE 5]
```

### Module Status

| # | Module | File | Status | Dependencies |
|---|--------|------|--------|--------------|
| 1 | Claude API | `services/claude.ts` | 🔲 | None |
| 2 | Vision Service | `services/vision.ts` | 🔲 | Module 1 |
| 3 | Context Parser | `services/context.ts` | 🔲 | None |
| 4 | Recommender | `engine/recommender.ts` | 🔲 | 1, 2, 3 |
| 5 | API Server | `api.ts` | 🔲 | 2, 3, 4 |

### How Multiple Agents Can Work in Parallel

**Phase 1: Independent Modules** (Both starting simultaneously)
```
Agent A: Implement Module 1 (Claude API) - NO DEPENDENCIES
Agent B: Implement Module 3 (Context Parser) - NO DEPENDENCIES
```

**Phase 2: Dependent Modules** (Once Phase 1 complete)
```
Agent A (finished Module 1): Implement Module 2 (Vision)
Agent B (finished Module 3): Implement Module 4 (Recommender)
```

**Phase 3: Integration** (Once Phase 2 complete)
```
Agent A or B: Implement Module 5 (API Server) and test end-to-end
```

### Key Interfaces (src/types.ts)

All modules communicate through TypeScript interfaces:

- **ClothingAnalysis** - Vision Service output
- **OccasionContext** - Context Parser output
- **RecommendationRequest** - Recommender input
- **RecommendationResponse** - Final output to user
- **ClaudeAPIService** - Claude wrapper interface
- **VisionService** - Vision wrapper interface
- **ContextParser** - Context wrapper interface
- **RecommenderEngine** - Recommender wrapper interface

**→ These interfaces are the contract between modules. Don't change them without consensus.**

---

## Module Specifications

Each module has a complete specification in `docs/MODULE_X_*.md`. Here's what you'll find in each:

### Module 1: Claude API Service
**File**: `src/services/claude.ts` | **Dependency**: None

Two functions:
- `callClaude(prompt, options)` - Call Claude with text
- `callClaudeVision(imageBase64, prompt)` - Call Claude with image

See: [docs/MODULE_1_CLAUDE_API.md](docs/MODULE_1_CLAUDE_API.md)

### Module 2: Vision Service
**File**: `src/services/vision.ts` | **Dependency**: Module 1

One function:
- `analyzeClothing(imageBase64)` - Analyze clothing items in image

Returns: `ClothingAnalysis` with items, colors, style, summary

See: [docs/MODULE_2_VISION.md](docs/MODULE_2_VISION.md)

### Module 3: Context Parser
**File**: `src/services/context.ts` | **Dependency**: None

One function:
- `parseOccasion(input)` - Parse user's occasion description

Returns: `OccasionContext` with occasion, location, formality, tone, preferences

See: [docs/MODULE_3_CONTEXT.md](docs/MODULE_3_CONTEXT.md)

### Module 4: Recommender Engine
**File**: `src/engine/recommender.ts` | **Dependency**: Modules 1, 2, 3

One function:
- `generateRecommendations(request)` - Generate personalized outfit recommendations

Takes: Clothing analysis + occasion context
Returns: `RecommendationResponse` with advice, outfit suggestions, cultural tips

See: [docs/MODULE_4_RECOMMENDER.md](docs/MODULE_4_RECOMMENDER.md)

### Module 5: API Server
**File**: `src/api.ts` | **Dependency**: Modules 2, 3, 4

Express server with:
- `POST /analyze` - Main endpoint
- `GET /health` - Health check

Takes: Image file + occasion description
Returns: Personalized fashion recommendations

See: [docs/MODULE_5_API.md](docs/MODULE_5_API.md)

---

## Parallel Development Workflow

### Timeline for 4-Hour Hackathon

#### Phase 1: Independent Modules (0:00-1:30, 60-90 min)

```
Agent A                                 Agent B
     ↓                                       ↓
Module 1: Claude API Wrapper            Module 3: Context Parser
├─ No dependencies                      ├─ No dependencies
├─ Implement callClaude()               ├─ Implement parseOccasion()
├─ Implement callClaudeVision()         ├─ Parse occasion/location/formality
├─ Write tests                          ├─ Write tests
└─ 60-90 minutes                        └─ 60-90 minutes

✅ When done: Notify other agents, mark in README
```

**Why these first?** Neither has dependencies. Both can start immediately.

#### Phase 2: Modules Depending on Phase 1 (1:30-3:00, 90 min)

```
Agent A                                 Agent B
(finished Module 1)                     (finished Module 3)
     ↓                                       ↓
Module 2: Vision Service                Module 4: Recommender Engine
├─ Depends on: Module 1 ✓               ├─ Depends on: Module 1 ✓
├─ Depends on: Module 3 ✓               ├─ Depends on: Module 2 (wait)
├─ Implement analyzeClothing()          ├─ Implement generateRecommendations()
├─ Call Claude Vision API               ├─ Parse clothing + context
├─ Write tests                          ├─ Use MOCK Module 2 while waiting
└─ 70-80 minutes                        └─ 70-80 minutes

✅ When done: Notify for Phase 3
```

**Agent B's strategy for waiting Module 2:**
```typescript
// Create a mock/stub Module 2 while waiting
class MockVisionService implements VisionService {
  async analyzeClothing(imageBase64: string): Promise<ClothingAnalysis> {
    return {
      items: [
        { type: "shirt", color: "blue", style: "casual" },
        { type: "pants", color: "black", style: "formal" }
      ],
      overallStyle: "business-casual",
      colorPalette: ["blue", "black"],
      summary: "Mock data for testing"
    };
  }
}
```

This lets you test Module 4 logic before Module 2 is complete.

#### Phase 3: Integration (3:00-4:00, 60 min)

```
One Agent
(All other modules complete)
     ↓
Module 5: Express API Server
├─ Depends on: Module 2 ✓
├─ Depends on: Module 3 ✓
├─ Depends on: Module 4 ✓
├─ Implement /analyze endpoint
├─ Wire up all modules together
├─ Write tests
├─ Test end-to-end
└─ 30-60 minutes

✅ DONE: Full working application
```

### Ideal Team Allocation

**For 2 People (4 hours)**:
```
Person 1: Module 1 (60 min) → Module 2 (60 min)
Person 2: Module 3 (60 min) → Module 4 (60 min)
Then EITHER: Person 1 or 2 does Module 5 (30-60 min)
```

**For 3+ People (4 hours)**:
```
Person 1: Module 1 (60 min) → Help with Module 5
Person 2: Module 3 (60 min) → Help complete Module 4
Person 3: Module 2 (60 min) → Module 5 (60 min)
Person 4: Tests & documentation
```

### How to Track Progress

**Starting a module**:
```markdown
| 1 | Claude API | 🔄 John (started 2:00) |
```

**Blocked/waiting**:
```markdown
| 2 | Vision | ⏳ Mary (waiting for Module 1) |
```

**Complete**:
```markdown
| 1 | Claude API | ✅ John (done 3:00) |
```

### Communication Checklist

When your module is done, **post in team chat**:
```
✅ DONE: Module X [Name]
- Time started: X
- Time completed: X
- Any blocking issues: No / Yes (describe)
- Ready for dependent modules: Yes

Modules that can now start:
- Module Y
- Module Z
```

When you're blocked waiting for a dependency:
```
⏳ WAITING: Module X [Name]
- Blocked by: Module Y (expected done X:XX)
- Using mock implementation: Yes/No
- Can proceed with testing: Yes/No
```

---

## Contributing Guidelines

### Workflow for Any Module

1. **Read your module documentation** in `docs/MODULE_X_*.md`
2. **Check interfaces** in `src/types.ts`
3. **Implement** following the code structure in docs
4. **Write tests** using examples provided
5. **Run `npm test`** to verify
6. **Mark complete** in README status table

### Code Structure

Follow the file structure exactly:
```
src/
├── services/
│   ├── claude.ts          # Module 1
│   ├── vision.ts          # Module 2
│   ├── context.ts         # Module 3
│   └── __tests__/         # Your test file here
├── engine/
│   ├── recommender.ts     # Module 4
│   └── __tests__/         # Your test file here
└── api.ts                 # Module 5
```

### Key Rules

✅ **DO**:
- Follow the interface contracts in `src/types.ts` exactly
- Write tests as you code
- Test frequently with `npm test`
- Ask questions if specs are unclear
- Start with modules that have no dependencies
- Use mock implementations for waiting on dependencies

❌ **DON'T**:
- Modify `src/types.ts` without consensus
- Skip testing
- Change module interfaces
- Copy code without understanding
- Over-engineer - keep it MVP

### Checklist Before Marking Complete

- [ ] Code follows module specification in docs/
- [ ] All tests pass: `npm test`
- [ ] TypeScript compiles without errors: `npm run build`
- [ ] Uses interfaces from `src/types.ts`
- [ ] Error handling is implemented
- [ ] Code is commented where complex
- [ ] Updated README status table

### Testing

```bash
# Test your specific module
npm test -- MODULE_NAME

# Run all tests
npm test

# Watch mode for development
npm test -- --watch
```

Each module should have unit tests in `src/services/__tests__/` or `src/engine/__tests__/`.

Example test structure:
```typescript
describe("Module Name", () => {
  it("should do X", async () => {
    // Your test here
  });

  it("should handle error Y", async () => {
    // Error case test
  });
});
```

### Common Issues & Solutions

**Issue: Module depends on another that isn't ready**

Solution: Create a mock/stub implementation (see Parallel Development section above).

**Issue: Types don't match between modules**

Solution: Check `src/types.ts` - it's the source of truth. Both modules must use exact same types.

**Issue: Tests are too complex**

Solution: Start simple, test one function at a time. Use example test cases in module docs.

### Integration Points

Once your module is done:
- Module 1 (Claude) → Used by Modules 2 & 4
- Module 2 (Vision) → Used by Module 4 & 5
- Module 3 (Context) → Used by Module 4 & 5
- Module 4 (Recommender) → Used by Module 5
- Module 5 (API) → Final integration

---

## FAQs

### Q: Which module should I work on?

**A**: Pick one that's not blocked:
- **Start immediately**: Module 1 or 3 (no dependencies)
- **After Module 1**: Module 2
- **After Modules 1, 2, 3**: Module 4
- **After Modules 2, 3, 4**: Module 5

### Q: What are the interface contracts?

**A**: All in `src/types.ts`. These are the "contracts" - don't change them. If you need a new interface, discuss with team first.

### Q: How do I test my module?

**A**: Each module guide (`docs/MODULE_X_*.md`) has test cases and examples. Run `npm test`.

### Q: What if a module I depend on isn't done?

**A**: Use a mock implementation. Create a simple stub that returns fake data so you can test your module independently.

### Q: How do modules communicate?

**A**: Through TypeScript interfaces defined in `src/types.ts`. Each module exports functions that follow these interfaces.

### Q: Can I change the TypeScript interfaces?

**A**: No, they're the contract between modules. If you need changes, discuss with team. Small changes might be ok if you notify others.

### Q: What if I get stuck?

**A**:
1. Check `docs/MODULE_X_*.md` - has examples
2. Check `src/types.ts` - see the interface
3. Check module docs for code structure
4. Ask the team

### Q: How much time should each module take?

**A**:
- Module 1 (Claude API): 60-90 min
- Module 2 (Vision): 70-80 min
- Module 3 (Context): 60-75 min
- Module 4 (Recommender): 70-90 min
- Module 5 (API): 30-60 min

Total: ~4 hours for all 5 modules with multiple people working in parallel.

### Q: What if we run out of time?

**A**: Focus on the happy path (image → recommendations). Skip error handling and edge cases if needed.

### Q: How do I know my module is done?

**A**:
- Code implements the spec from `docs/MODULE_X_*.md`
- Tests pass: `npm test`
- Compiles: `npm run build`
- Uses correct TypeScript interfaces from `src/types.ts`

---

## Commands Reference

```bash
# Setup (run once)
npm install
cp .env.example .env
# Edit .env and add CLAUDE_API_KEY

# Development
npm run dev          # Start API server
npm test             # Run tests
npm test -- --watch  # Watch mode

# Build
npm run build        # Compile TypeScript
npm start            # Run production build

# Cleanup
npm run clean        # Remove dist/ folder
```

---

## Quick Links

- **Project Overview**: [README.md](README.md)
- **Architecture**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Module Docs**: [docs/](docs/)
- **Contributing**: This file
- **Type Contracts**: [src/types.ts](src/types.ts)

---

**Good luck, and have fun building! 🚀**
