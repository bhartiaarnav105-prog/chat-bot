# Vercel Deployment Guide

This repository contains the `kendra` Vite frontend and a Fastify API exposed through
the root `api/server.ts` Vercel Function. The Vercel project root must remain the
repository root so the workspace lockfile, frontend output, and API function are all
available to the build.

## Dashboard Settings

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite (or Other) |
| **Root Directory** | *(leave blank / repository root)* |
| **Node.js Version** | 20.x *(or leave default — the config now accepts ≥20)* |
| **Install Command** | `corepack enable && corepack pnpm install --frozen-lockfile --prod=false` |
| **Build Command** | `corepack pnpm --filter kendra build` |
| **Output Directory** | `apps/kendra/dist` |

## Emergent preview runtime

The preview pod uses the repository root as the working directory:

- `frontend`: `corepack pnpm --filter kendra exec vite --host 0.0.0.0 --port 3000`
- `backend`: `corepack pnpm --filter @sahakaar-sathi/api start` with `PORT=8001`
- Vite proxies `/api/*` to `http://localhost:8001`

Both services must be RUNNING in supervisor before testing the public preview.
The installable supervisor template is tracked at `ops/supervisor/sahakaar-sathi.conf`.

## Environment variables

Add the following variable to the Vercel Project Settings for Preview and Production:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string used by scheme, knowledge, and grievance routes |

The assistant health and text-query flows use the repository's mock providers and do
not require an AI key. Never commit the real database connection string.

## Why `corepack pnpm` instead of bare `pnpm`

Vercel ships a system-level `pnpm` binary (v6.35.1) that shadows corepack's shim in `$PATH`, even after `corepack prepare --activate`. Using `corepack pnpm` invokes pnpm directly through corepack, bypassing the stale system binary and honoring the `packageManager` field.

## After pushing

Deploy using **"Redeploy without cache"** to ensure the new lockfile and config are picked up.

Verify both surfaces after deployment:

```bash
curl -fsS https://YOUR_PROJECT.vercel.app/api/v1/health
curl -fsS -X POST https://YOUR_PROJECT.vercel.app/api/v1/assistant/query \
  -H 'content-type: application/json' \
  --data '{"question":"What is crop insurance?","language":"en"}'
```
