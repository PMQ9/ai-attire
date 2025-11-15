/**
 * ai-attire - AI-powered fashion advisor
 *
 * This is the entry point. For running the API server, use:
 *   npm run dev     (development)
 *   npm start       (production)
 *
 * For implementing modules, see:
 *   - docs/ARCHITECTURE.md - System overview
 *   - docs/MODULE_*.md - Individual module guides
 *   - src/types.ts - Shared interfaces
 *
 * Module implementation order:
 *   1. Module 1: src/services/claude.ts
 *   2. Module 3: src/services/context.ts  (can be parallel with 1)
 *   3. Module 2: src/services/vision.ts   (depends on 1)
 *   4. Module 4: src/engine/recommender.ts (depends on 1,2,3)
 *   5. Module 5: src/api.ts (depends on 2,3,4)
 */

// Module 1: Claude API Service
// export * from './services/claude'; // TODO: Uncomment when Module 1 is implemented

// Module 2: Vision Service
// export * from './services/vision'; // TODO: Uncomment when Module 2 is implemented

// Module 3: Context Parser
export { ContextParser, contextParser } from './services/context';

// Module 4: Recommender Engine
// export * from './engine/recommender'; // TODO: Uncomment when Module 4 is implemented

// Shared types
export * from './types';

// Start API server when run directly
if (require.main === module) {
  console.log('ai-attire entry point');
  console.log('Module 3 (Context Parser) is implemented.');
  console.log('To start the API server, implement Module 5 (api.ts) first.');
  // require('./api'); // TODO: Uncomment when Module 5 is implemented
}
