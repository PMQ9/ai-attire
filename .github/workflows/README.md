# GitHub Actions CI/CD Workflows

This directory contains automated testing and quality assurance workflows for the ai-attire project.

## Workflows Overview

### 1. **CI Tests** (`ci.yml`)
**Purpose**: Main continuous integration pipeline that runs on every push and pull request.

**Triggers**:
- Push to `main` and `develop` branches
- Pull requests to `main` and `develop` branches

**Actions**:
- Installs dependencies (`npm ci`)
- Builds the project (`npm run build`)
- Runs all unit tests with coverage (`npm test`)
- Runs regression tests (`npm test tests/regression.test.ts`)
- Uploads coverage reports to Codecov
- Archives test results and build artifacts

**Node Versions Tested**: 18.x, 20.x (matrix strategy for compatibility)

**Artifacts Generated**:
- `coverage/` - Code coverage reports
- `dist/` - Compiled TypeScript output

---

### 2. **Code Quality Checks** (`code-quality.yml`)
**Purpose**: Validates TypeScript compilation, project structure, and critical interfaces.

**Triggers**: Same as CI Tests

**Actions**:
- Installs dependencies
- Runs TypeScript type checking (`npm run build` + `npx tsc --noEmit`)
- Verifies required project files exist:
  - `tsconfig.json`
  - `package.json`
  - `.env.example`
  - Core source directories
- Validates all critical interfaces in `src/types.ts`:
  - `ClothingAnalysis`
  - `OccasionContext`
  - `RecommendationResponse`
  - `ClaudeAPIService`
  - `VisionService`
  - `ContextParser`
  - `RecommenderEngine`

**Purpose**: Early detection of type errors and structural violations before tests run.

---

### 3. **Test Report** (`test-report.yml`)
**Purpose**: Comprehensive testing with detailed reporting and PR comments.

**Triggers**: Same as CI Tests

**Actions**:
- Installs dependencies and builds
- Runs all tests with coverage (`npm test -- --coverage --verbose --forceExit`)
- Generates coverage badge
- **Posts test summary as PR comment** (for pull requests)
  - Shows coverage percentages (statements, branches, functions, lines)
- Creates GitHub Step Summary for visibility in Actions tab
- Uploads coverage to Codecov
- Archives test coverage reports

**PR Comment Format**:
```
## Test Results 🧪

| Metric | Coverage |
|--------|----------|
| Statements | XX% |
| Branches | XX% |
| Functions | XX% |
| Lines | XX% |

✅ Tests passed
```

---

## Test Files Structure

The workflows run the following tests:

### Unit Tests
- `src/services/__tests__/claude.test.ts` - Claude API wrapper tests
- `src/services/__tests__/vision.test.ts` - Vision analysis tests
- `src/services/__tests__/context.test.ts` - Context parser tests
- `src/engine/__tests__/recommender.test.ts` - Recommender engine tests
- `src/__tests__/api.test.ts` - API server endpoint tests

### Regression Tests
- `tests/regression.test.ts` - Critical functionality and integration tests

## Jest Configuration

The `jest.config.js` is configured to:
- Use TypeScript preset (`ts-jest`)
- Test in Node environment
- Search in both `src/` and `tests/` directories
- Generate coverage reports in HTML, text, and LCOV formats
- Exclude test files and entry point from coverage

## Coverage Reports

Coverage reports are generated in the `coverage/` directory:
- `lcov.info` - LCOV format (used by Codecov)
- `coverage-summary.json` - JSON format
- `index.html` - HTML report for detailed exploration

### Coverage Thresholds
Current coverage: **~82%**

Target metrics:
- Statements: 80%+
- Branches: 70%+
- Functions: 80%+
- Lines: 80%+

## Running Workflows Locally

### Run CI Pipeline
```bash
npm ci
npm run build
npm test -- --coverage --verbose
npm test -- tests/regression.test.ts --verbose
```

### Run Code Quality Checks
```bash
npm run build
npx tsc --noEmit
```

### Run Test Report
```bash
npm test -- --coverage --verbose --forceExit
```

## Troubleshooting

### Tests Failing in CI but Pass Locally
1. Clear npm cache: `npm cache clean --force`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check Node version: `node --version` (must be 18.x or 20.x)

### Coverage Reports Not Uploading
1. Verify Codecov access token is set (not needed for public repos)
2. Check that `coverage/lcov.info` exists after test run
3. Check Codecov GitHub App is installed in repository

### Type Checking Failures
1. Run locally: `npm run build`
2. Fix all TypeScript errors before pushing
3. Ensure `tsconfig.json` is not modified

### Project Structure Validation Failed
1. Verify all required files exist in expected locations
2. Check that no critical files were accidentally deleted or moved
3. Restore from git if needed: `git checkout -- [file]`

## Monitoring Workflows

### View Workflow Runs
1. Go to repository → **Actions** tab
2. Select workflow: CI Tests, Code Quality Checks, or Test Report
3. Click on a workflow run to see detailed logs

### Check PR Status
- For pull requests, status checks appear at the bottom
- All three workflows must pass (green checkmark) to merge
- Click "Details" on any failed check to see error logs

## Codecov Integration

Coverage reports are automatically uploaded to Codecov for:
- Historical coverage tracking
- Coverage badges
- Per-line coverage information
- Comparison with previous builds

View coverage reports: [Codecov Dashboard](https://codecov.io)

## Best Practices

1. **Run tests locally before pushing**
   ```bash
   npm test -- --coverage
   ```

2. **Fix type errors before committing**
   ```bash
   npm run build
   ```

3. **Keep dependencies updated** but test after updates
   ```bash
   npm outdated
   npm update
   npm test
   ```

4. **Write tests for new features**
   - Add to appropriate test file in `src/**/__tests__/`
   - Follow existing test patterns
   - Run `npm test` to verify

5. **Add critical features to regression tests**
   - Update `tests/regression.test.ts`
   - Ensures feature doesn't break in future updates

## Performance Notes

- **CI Tests**: ~2-3 minutes (runs on both Node 18.x and 20.x)
- **Code Quality**: ~1 minute
- **Test Report**: ~2 minutes
- **Total workflow time**: ~5-7 minutes for all three

### Optimization Tips
- Enable branch protection to fail fast on failed checks
- Use caching (npm cache is already configured)
- Consider splitting workflows if execution time exceeds 10 minutes

## Future Enhancements

Potential additions:
- [ ] E2E tests with Playwright
- [ ] Performance benchmarking
- [ ] Security scanning (Snyk, OWASP)
- [ ] Dependency vulnerability scanning (Dependabot)
- [ ] Automated releases (semantic versioning)
- [ ] Docker image builds and pushes

---

**Last Updated**: November 2025
**Maintained by**: Vanderbilt Claude Builder Hackathon Team
