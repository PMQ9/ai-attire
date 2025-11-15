# Documentation Index

This folder contains all documentation for the ai-attire project. Start here to understand the system.

## 📖 Getting Started (Read These First)

1. **[../README.md](../README.md)** - Project overview, vision, quick start
2. **[../QUICKSTART.md](../QUICKSTART.md)** - 5-minute quick reference
3. **[../FOUNDATION_SUMMARY.md](../FOUNDATION_SUMMARY.md)** - Complete setup summary

## 🏗️ System Design

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture, data flow, module dependencies, implementation order

## 📦 Module Implementation Guides

Each module has a complete specification, code examples, and testing instructions:

| Module | File | Description |
|--------|------|-------------|
| 1 | [MODULE_1_CLAUDE_API.md](MODULE_1_CLAUDE_API.md) | Claude API wrapper - calls Claude and Claude Vision |
| 2 | [MODULE_2_VISION.md](MODULE_2_VISION.md) | Vision Service - analyzes clothing in images |
| 3 | [MODULE_3_CONTEXT.md](MODULE_3_CONTEXT.md) | Context Parser - extracts occasion/location from user input |
| 4 | [MODULE_4_RECOMMENDER.md](MODULE_4_RECOMMENDER.md) | Recommender Engine - generates personalized fashion advice |
| 5 | [MODULE_5_API.md](MODULE_5_API.md) | API Server - Express endpoints tying everything together |

## 📋 Contributing

- **[../CONTRIBUTING.md](../CONTRIBUTING.md)** - How to work on modules, workflow, checklist

## 🔗 Key Files to Reference

- **[../src/types.ts](../src/types.ts)** - ALL module interfaces/contracts
- **[../package.json](../package.json)** - Dependencies and scripts
- **[../tsconfig.json](../tsconfig.json)** - TypeScript config
- **[../.env.example](../.env.example)** - Environment template

## 📚 How to Use This Documentation

### For a New Contributor:

1. Read [../README.md](../README.md) to understand the project
2. Read [../QUICKSTART.md](../QUICKSTART.md) for quick setup
3. Pick a module from the table above
4. Read the module's documentation (e.g., MODULE_1_CLAUDE_API.md)
5. Read [ARCHITECTURE.md](ARCHITECTURE.md) to understand how modules connect
6. Look at [../src/types.ts](../src/types.ts) to see the interface you need to implement
7. Implement following the module guide
8. Test with `npm test`

### For Parallel Development:

- [ARCHITECTURE.md](ARCHITECTURE.md) shows which modules can be worked on in parallel
- Start with modules that have no dependencies (Modules 1 and 3)
- Once those are done, implement dependent modules (2 and 4)
- Finally integrate everything in Module 5

## 🎯 Module Dependency Map

```
Module 1 (Claude API)  ─┬──→ Module 2 (Vision)
                       │
Module 3 (Context) ────┼──→ Module 4 (Recommender) ──→ Module 5 (API)
                       │
                       └────────────────────────────┘
```

**Recommended parallel workflow:**
- Person A: Module 1 (Claude API) + Module 2 (Vision)
- Person B: Module 3 (Context) + Module 4 (Recommender)
- Person C: Module 5 (API Server) once 1-4 are ready

## ❓ Common Questions

**Q: Which module should I work on?**
A: Pick one that's not blocked. Start with Module 1 or 3 (no dependencies). See ARCHITECTURE.md.

**Q: What are the interface contracts?**
A: All in [../src/types.ts](../src/types.ts). Don't change them without consensus.

**Q: How do I test my module?**
A: Each module guide has test cases. Run `npm test`.

**Q: How do modules communicate?**
A: Through TypeScript interfaces defined in src/types.ts.

**Q: What if a module I depend on isn't done?**
A: Create a mock implementation for testing. See CONTRIBUTING.md.

## 🚀 Quick Links

- **Project Setup**: See [../README.md](../README.md) "Quick Start" section
- **Module Status**: See [../README.md](../README.md) "Modules for Parallel Work" table
- **API Specification**: See [MODULE_5_API.md](MODULE_5_API.md)
- **Contributing Guidelines**: See [../CONTRIBUTING.md](../CONTRIBUTING.md)
- **Implementation Checklist**: See [../CONTRIBUTING.md](../CONTRIBUTING.md) "Checklist Before Submitting"

---

**Everything you need to implement ai-attire is in these docs. Happy coding! 🚀**
