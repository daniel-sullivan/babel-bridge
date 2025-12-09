<div align="center">
  <img src="logo.svg" alt="BabelBridge Logo" width="128" height="128">
  
  # BabelBridge

  [![Tests & Coverage](https://github.com/daniel-sullivan/babel-bridge/actions/workflows/ci.yml/badge.svg)](https://github.com/daniel-sullivan/babel-bridge/actions/workflows/ci.yml)
  [![codecov](https://codecov.io/gh/daniel-sullivan/babel-bridge/branch/master/graph/badge.svg)](https://codecov.io/gh/daniel-sullivan/babel-bridge)

  **A modern web-based translation tool with live language identification and pluggable AI backends**
</div>

## ✨ Features

- 🌐 Translate text between multiple languages
- 🔍 Live language identification as you type
- 🔗 Multi-message context (chain mode)
- 🎯 Language variety buttons with responsive overflow
- ♿ Accessible, responsive, and mobile-friendly UI
- 🔌 Pluggable AI backend: OpenAI (public or local e.g.: Ollama) or Cohere
- 🧪 **Comprehensive test suite with 100% passing tests**
- 📊 **Full test coverage reporting**

## Getting Started

### Prerequisites

- Go 1.20+
- Node.js 18+
- (Optional) Docker

### Environment Variables

**Required (choose one backend):**

#### For Ollama (OpenAI local):

- `ENGINE=ollama`
- `OPENAI_HOST` (e.g. `localhost`)
- `OPENAI_PORT` (e.g. `11434`)
- `OPENAI_MODEL` (e.g. `aya-expanse:8b`)
- `OPENAI_API_KEY` (optional, for authentication)

#### For Cohere:

- `ENGINE=cohere`
- `COHERE_API_KEY` (required)
- `COHERE_MODEL` (e.g. `c4ai-aya-expanse-8b`)

**Optional:**

- `PORT` (default: 8080)

### Running Locally

1. Install Go dependencies:

   ```sh
   go mod tidy
   ```

2. Build the frontend:

   ```sh
   cd frontend
   npm install
   npm run build
   cd ..
   ```

3. Set environment variables for your backend (see above).
4. Run the server:

   ```sh
   go run main.go
   ```

5. Visit [http://localhost:8080](http://localhost:8080) in your browser.

## 🧪 Testing

BabelBridge has a comprehensive test suite covering both backend and frontend components.

### Test Coverage

- **Go Backend**: Unit tests, integration tests, and mock testing
- **Frontend**: Component tests, context tests, utility tests, and E2E tests
- **Coverage Target**: 70%+ for both backend and frontend
- **Status**: 100% passing tests ✅

### Running Tests

#### All Tests
```sh
make test-all          # Run all tests with coverage
npm run test:all       # Alternative using npm (frontend only)
```

#### Go Backend Tests
```sh
make test-go           # Run Go tests with coverage
go test -v ./...       # Basic test run
go test -cover ./...   # With coverage
```

#### Frontend Tests  
```sh
make test-frontend     # Run frontend tests with coverage
cd frontend && npm test               # Unit tests (watch mode)
cd frontend && npm run test:unit      # Unit tests (single run)
cd frontend && npm run test:coverage  # With coverage report
```

#### E2E Tests
```sh
make test-e2e          # Run end-to-end tests
cd frontend && npm run test:e2e       # Direct E2E run
cd frontend && npm run test:e2e:ui    # E2E with UI
```

### Coverage Reports

After running tests with coverage, reports are available at:
- **Go**: `coverage.html` (root directory)
- **Frontend**: `frontend/coverage/index.html`

### Continuous Integration

All tests run automatically on:
- ✅ Every push to main/develop branches
- ✅ Every pull request
- ✅ Coverage reports posted as PR comments
- ✅ Tests must pass before merging

### Test Structure

```
tests/
├── backend/
│   ├── unit/          # Go unit tests
│   ├── integration/   # Go integration tests  
│   └── mock/          # Mock implementations
└── frontend/
    ├── components/    # React component tests
    ├── context/       # Context/state tests
    ├── utils/         # Utility function tests
    └── e2e/          # End-to-end tests
```

### Docker

You can build and run BabelBridge with Docker:

1. Build the image:

   ```sh
   docker build -t babelbridge .
   ```

2. Create a `.env` file with the required environment variables for your backend.
3. Run the container:

   ```sh
   docker run -p 8080:8080 --env-file .env babelbridge
   ```

## Project Structure

- `frontend/` — React frontend (Vite + TypeScript)
- `babel/` — Translation logic and AI backend integration
- `api/` — API handlers and server
- `main.go` — Go entrypoint

## License

MIT
