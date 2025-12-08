# BabelBridge

BabelBridge is a web-based translation tool with a modern UI, supporting live language identification, multi-message context, and a pluggable AI backend (Ollama or Cohere).

## Features

- Translate text between multiple languages
- Live language identification as you type
- Multi-message context (chain mode)
- Language variety buttons with responsive overflow
- Accessible, responsive, and mobile-friendly UI
- Pluggable AI backend: OpenAI (public or local e.g.: Ollama) or Cohere

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
