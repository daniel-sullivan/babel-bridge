# Repository Guidelines

## Project Structure & Module Organization
- `main.go` starts the Gin server, wiring `backend/` AI providers, `service/` translation logic, and `api/` HTTP handlers.
- `backend/` holds AI adapters (`openai.go`, `cohere_ai.go`) and translation context logic.
- `service/` wraps business rules and tokens used by the API layer; `mock_babel.go` supports tests.
- `api/` exposes endpoints (`/api/translate/*`), session/CSRF/rate-limit middleware, and static serving from `frontend/dist`.
- `frontend/` is a Vite + React + TypeScript SPA (`src/App.tsx`, `api.ts`, `styles.css`); build output lives in `frontend/dist`.

## Build, Test, and Development Commands
- Go server: `go run main.go` (requires backend env vars below).
- Go tests: `go test ./...` from repo root covers `backend/` and `api/` packages.
- Frontend dev: `cd frontend && npm install && npm run dev` for hot-reload.
- Frontend build: `cd frontend && npm run build` (runs `tsc -b` then Vite).
- Frontend tests: `cd frontend && npm test` (Vitest + JSDOM).
- Docker: `docker build -t babelbridge .` then `docker run -p 8080:8080 --env-file .env babelbridge`.

## Coding Style & Naming Conventions
- Go: run `gofmt` before committing; use idiomatic error returns (`if err != nil { ... }`) and keep handlers small. Package names are lower_snake (`backend`, `service`, `api`); exported types/functions use CamelCase.
- Frontend: TypeScript + React functional components; prefer hooks, `PascalCase` for components, `camelCase` for props/handlers, and keep styles in `styles.css`.
- Keep API paths explicit (`/api/translate/start|improve|preview|identify`) and align request/response shapes with `api/models.go`.

## Testing Guidelines
- Favor unit tests alongside code: `backend/backend_test.go`, `api/server_test.go` illustrate patterns (mocks via `service/mock_babel.go`).
- Name Go tests `TestThing` and keep table-driven where possible. For frontend, colocate tests near components if added.
- Run `go test ./...` and `cd frontend && npm test` before PRs; add focused cases for regressions (session/CSRF, rate limits, language identification, component interaction).

## Commit & Pull Request Guidelines
- Use concise, imperative commits (e.g., `backend: tighten language parsing`, `frontend: add chain mode test`).
- PRs should describe behavior change, linked issue, and include local test results/commands run. For UI changes, attach before/after screenshots or GIFs.
- Call out env/config impacts (ENGINE choice, model names, cookies/CSRF) and any new dependencies.

## Security & Configuration Tips
- Required env: `ENGINE` (`openai` or `cohere`), model vars, and API keys (`OPENAI_API_KEY` optional, `COHERE_API_KEY` required). `SECRET_KEY` seeds sessions/CSRF; omit it to autogenerate for dev only.
- CSRF tokens are cookie + header (`X-CSRF-Token`); session cookie is `session_token`. Keep TLS offload and `cookieSecure` aligned in production.
