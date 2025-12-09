# BabelBridge Frontend Test Suite

This document describes the complete test setup for the BabelBridge frontend application.

## Test Types

### 1. Unit Tests (Vitest)
- **Location**: `frontend/tests/components/`
- **Runner**: Vitest with jsdom environment
- **Configuration**: `frontend/vitest.config.ts`
- **Setup File**: `frontend/src/test-setup.ts`
- **Command**: `npm run test:unit`

**Tests Included:**
- `LanguageSelector.spec.tsx`: Tests the main language selector component rendering

### 2. End-to-End Tests (Playwright)
- **Location**: `frontend/tests/e2e/`
- **Runner**: Playwright
- **Configuration**: `frontend/tests/e2e/playwright.config.ts`
- **Command**: `npm run test:e2e`

**Global Setup:**
- Automatically starts two Go backend servers:
  - Primary server on port 8080 (rate limiting disabled)
  - Secondary server on port 8081 (rate limiting enabled)
- Uses mock AI backend (`ENGINE=mock`)
- Servers are automatically terminated after tests complete

**Tests Included:**

#### Basic E2E Tests (`basic.spec.ts`)
- Session endpoint responds correctly
- SPA loads and renders properly
- Language identification API works
- Translation start API works with mock backend

#### Rate Limiting Tests (`rate-limit.spec.ts`)
- Session endpoint produces 429s when rate limited
- API endpoints are rate limited under burst load
- Rate limiting configuration verification

## Running Tests

### Individual Test Types
```bash
# Unit tests only
npm run test:unit

# E2E tests only
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui
```

### All Tests
```bash
npm run test:all
```

## Key Features

1. **Automatic Backend Management**: E2E tests automatically start and stop Go backend servers
2. **Rate Limiting Testing**: Dedicated server for testing rate limiting functionality
3. **Real API Testing**: Tests use actual Go backend with mock AI engine
4. **Proper Isolation**: Vitest and Playwright use separate configurations to avoid conflicts
5. **Session Handling**: Tests properly handle session authentication
6. **Cross-platform**: Works on Windows (uses `taskkill` for process cleanup)

## Test Coverage

The test suite covers:
- Component rendering and basic functionality
- API endpoint functionality with mock backend
- Session management and authentication
- Rate limiting behavior
- SPA loading and static file serving
- Error handling (401, 429 responses)

### Coverage Statistics

#### Frontend Coverage (Vitest + V8)
- **Overall**: 16.72% statement coverage
- **LanguageSelector.tsx**: 87.31% statement coverage (our main tested component)
- **Utils (flags.ts, languages.ts)**: 78.26% average coverage
- **Other components**: 0% (not yet tested - opportunity for expansion)

#### Backend Coverage (Go)
- **API Package**: 62.7% statement coverage
- **Backend Package**: 67.0% statement coverage
- **Overall Backend**: ~65% average coverage

#### E2E Coverage
- **Real API Integration**: 100% of core translation endpoints tested
- **Rate Limiting**: 100% of rate limiting scenarios tested
- **Session Management**: 100% of authentication flows tested

### Coverage Improvement Opportunities
1. **Frontend**: Add unit tests for remaining components (App.tsx, TranslationComposer.tsx, etc.)
2. **Backend**: Add tests for service layer and additional edge cases
3. **Integration**: Add more complex E2E scenarios

## CI/CD Integration

### GitHub Actions Workflows

The project includes comprehensive CI/CD pipelines:

#### 1. Main CI Pipeline (`.github/workflows/ci.yml`)
- **Triggers**: Push to main/develop, Pull requests
- **Jobs**:
  - Backend tests with Go coverage reporting
  - Frontend unit tests with coverage
  - E2E tests with real backend integration
  - Build validation and artifact creation
- **Coverage**: Uploads coverage to Codecov
- **Artifacts**: Stores build outputs and Playwright reports

#### 2. Release Pipeline (`.github/workflows/release.yml`)
- **Triggers**: Git tags (v*.*.*) or manual dispatch
- **Jobs**:
  - Full test suite execution
  - Multi-platform Docker image build and push
  - Binary compilation for multiple platforms
  - GitHub release creation with changelog
- **Outputs**: Docker images, platform binaries, frontend distribution

#### 3. Security & Maintenance (`.github/workflows/security.yml`)
- **Triggers**: Weekly schedule, manual dispatch
- **Jobs**:
  - Go security scanning (Gosec, govulncheck)
  - Node.js security auditing
  - CodeQL static analysis
  - Automated dependency updates with PR creation
- **Security**: Continuous vulnerability monitoring

### Deployment Features
- **Multi-platform support**: Linux (amd64, arm64), Windows, macOS
- **Container registry**: GitHub Container Registry integration
- **Automated releases**: Tag-based releases with changelogs
- **Security monitoring**: Weekly security scans and updates

## Dependencies

- **Vitest**: Unit test runner
- **Playwright**: E2E test runner
- **@testing-library/react**: React testing utilities
- **@testing-library/jest-dom**: Additional matchers
- **cross-env**: Environment variable management
- **jsdom**: DOM simulation for unit tests

## Notes

- Tests use the mock AI backend to ensure consistent, predictable responses
- Rate limiting tests specifically target the secondary server on port 8081
- Global setup ensures servers are ready before tests begin
- Global teardown properly cleans up spawned processes
- Tests are designed to be resilient to timing and authentication issues
