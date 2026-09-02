# Vercel Deployment Guide

## Dashboard Settings

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite (or Other) |
| **Root Directory** | *(leave blank / repository root)* |
| **Node.js Version** | 20.x *(or leave default — the config now accepts ≥20)* |
| **Install Command** | `corepack enable && corepack pnpm install --frozen-lockfile --prod=false` |
| **Build Command** | `corepack pnpm --filter kendra build` |
| **Output Directory** | `apps/kendra/dist` |

## Why `corepack pnpm` instead of bare `pnpm`

Vercel ships a system-level `pnpm` binary (v6.35.1) that shadows corepack's shim in `$PATH`, even after `corepack prepare --activate`. Using `corepack pnpm` invokes pnpm directly through corepack, bypassing the stale system binary and honoring the `packageManager` field.

## After pushing

Deploy using **"Redeploy without cache"** to ensure the new lockfile and config are picked up.
