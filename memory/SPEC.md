# Sahakaar Sathi Deployment Spec

## Application

Sahakaar Sathi is a Vite React farmer-service frontend (`apps/kendra`) backed by a
Fastify API (`apps/api`). The farmer flow supports consent, text and browser voice
questions, language selection, cited mock scheme answers, grievance submission,
profile rights, and saved-guidance history. The admin components cover scheme and
knowledge-document operations.

## Runtime and deployment

- Package manager: npm (with npm workspaces) from the repository root
- Frontend build: `npm run build --workspace=apps/kendra`
- Vercel output: `apps/kendra/dist`
- API entrypoint: root `api/server.ts`, with `/api/*` rewritten to that function
- Emergent preview runtime: Vite dev server on port 3000 proxies `/api/*` to the
  Fastify process on port 8001; supervisor programs run from `/app`
- Required production variable: `DATABASE_URL`
- Authentication: no authentication flow is currently implemented; the farmer UI
  uses a demo farmer identifier and an in-memory consent gate

## API flows

- `GET /api/v1/health` reports service and provider readiness
- `POST /api/v1/assistant/query` accepts JSON text questions or multipart audio
- `GET /api/v1/assistant` reports the assistant query endpoint for ingress smoke checks
- Scheme, knowledge-document, and grievance routes are registered under `/api/v1`
- AI, embedding, and vector providers are intentionally MOCKED and use seeded demo
  responses; database-backed routes require a reachable PostgreSQL instance