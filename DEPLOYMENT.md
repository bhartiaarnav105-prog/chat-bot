# Deployment Guide

This repository is a pnpm monorepo containing a Fastify backend API (`apps/api`) and a React/Vite frontend (`apps/kendra`).

## Prerequisites

- **Node.js**: v20 or later is recommended.
- **Package Manager**: pnpm (v9.10.0 or compatible).

Ensure `corepack` is enabled to automatically use the pinned `pnpm` version:
```bash
corepack enable pnpm
```

## Local Development

1. **Install Dependencies**:
   ```bash
   pnpm install
   ```

2. **Run Development Servers**:
   ```bash
   pnpm -r dev
   ```

3. **Build Locally**:
   ```bash
   pnpm -r build
   ```

## Vercel Configuration

This monorepo uses a Zero-Config inspired deployment strategy on Vercel, utilizing `vercel.json` for routing and build overrides.

### Vercel Dashboard Settings

- **Framework Preset**: Other (or Vite)
- **Root Directory**: `.` (Leave empty / default root)
- **Build Command**: `pnpm -r build` (Managed by `vercel.json`)
- **Output Directory**: `apps/kendra/dist` (Managed by `vercel.json`)
- **Install Command**: `pnpm install --frozen-lockfile --prod=false` (Managed by `vercel.json`)

### Why devDependencies are Required at Build Time

Vercel defaults to setting `NODE_ENV=production` during the build phase. For standard npm/pnpm setups, this causes `devDependencies` to be skipped. However, tools like `typescript` and `vite` (which reside in `apps/kendra/devDependencies`) are strictly required to build the frontend.

To fix this, our `vercel.json` explicitly forces the installation of all dependencies by using `--prod=false`.

### Serverless Functions (API)

The Fastify API in `apps/api` is exposed to Vercel via the `api/server.ts` entry point. Vercel automatically compiles files in the `api/` directory into serverless functions. 
The `vercel.json` rewrites rules forward any `/api/*` traffic directly to this function, while serving static frontend files from `apps/kendra/dist`.
