# Mawthuq — Claude Code Context

## What This Is
Mawthūq is a **vendor prequalification platform** for Saudi construction procurement, built by WhiteHelmet (a skill of ASIF). It lets procurement teams invite contractors, collect documents, run AI extraction, score vendors against rules, conduct human review, and produce a defensible shortlist before tender.

## Tech Stack
- **Frontend:** React 19 + React Router 7, Vite, TypeScript (strict), Tailwind CSS, Sonner toasts, Lucide icons
- **Backend:** Express.js 5, tsx (runs TS directly), Node.js v22
- **AI:** OpenAI GPT-4.1-mini — document classification + field extraction with citation discipline
- **Email:** Resend API — transactional vendor invitation emails
- **Storage:** Supabase (primary — single JSONB row in `mawthuq_app_state` + `vendor-packages` bucket for files); local `server/data/store.json` as fallback when Supabase env vars are absent
- **Deploy:** Railway (auto-deploys on push to `main`)

## Running Locally
```bash
npm install
npm run dev          # starts both Express (port 8787) + Vite (port 5173) concurrently
```
Vite proxies `/api/*` to `http://localhost:8787` in dev — no CORS issues locally.

## Key Scripts
```bash
npm run dev          # local development
npm run build        # tsc type-check (3 configs) + vite build
npm start            # production: tsx server/index.ts (Railway uses this)
```

## Architecture

### State Storage
`server/store.ts` — single source of truth:
- If `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set → reads/writes Supabase `mawthuq_app_state` table (JSONB)
- Otherwise → reads/writes `server/data/store.json` (ephemeral on Railway, fine for local dev)

The `mawthuq_app_state` table must exist in Supabase:
```sql
create table mawthuq_app_state (id text primary key, state_json jsonb);
```

### File Storage
`server/file-storage.ts` — uploaded vendor documents:
- Supabase configured → stored in `vendor-packages` bucket
- Otherwise → `server/uploads/` (local, ephemeral on Railway)

### Frontend → Backend
- Dev: Vite proxy (`/api → localhost:8787`)
- Production: Express serves the Vite `dist/` build AND the API on the same port (`process.env.PORT` from Railway)
- All frontend API calls use **relative paths** (`/api/vendors`, not `http://localhost:8787/api/vendors`)

### Path Aliases
`@/` maps to `src/` — configured in `vite.config.ts` and `tsconfig.app.json`. Server-imported files (`src/data/seed.ts`, `src/lib/scorecard.ts`) use **relative imports** (not `@/`) because tsx doesn't resolve Vite aliases at runtime.

## Domain Concepts

| Concept | Description |
|---------|-------------|
| `BackendProject` | A procurement project (e.g., "North Riyadh Integrated Development") |
| `BackendPackage` | A work package within a project (e.g., "MEP Subcontractors") |
| `VendorRecord` | A contractor — either seeded demo data or self-registered via portal |
| `BackendInvitation` | An invitation sent to a vendor to self-register |
| `VendorPackageApplication` | A vendor's application to a specific package (tracks invite → submit → qualify → shortlist) |
| `VendorDocument` | An uploaded document with metadata, expiry, confidence score, storage path |
| `VendorExtraction` | AI-extracted fields from a vendor's documents (with evidence citations) |
| `VendorScorecard` | Deterministic rules output: PASS / CONDITIONAL / FAIL + 5-dimension scores |

## Key File Locations

```
src/pages/           — all page components (one file per route)
src/hooks/           — data fetching hooks (use-demo-vendors, use-invitations, etc.)
src/lib/
  api.ts             — all frontend → backend API calls
  scorecard.ts       — deterministic scoring logic (shared frontend + server)
src/data/seed.ts     — seeded demo state (vendors, projects, packages, invitations)
src/types.ts         — all TypeScript interfaces

server/index.ts      — all Express routes (~980 lines)
server/store.ts      — readState / writeState (Supabase ↔ local JSON)
server/extraction.ts — AI extraction pipeline
server/portfolio.ts  — domain builders (buildInvitation, buildProject, etc.)
server/config.ts     — env var config (OpenAI, Supabase, Resend, APP_URL)
```

## Routing
- `/` Dashboard, `/projects`, `/vendors`, `/ai-extraction`, `/scorecard`, `/human-review`, `/approved-vendor-list` — all under `PageShell` (authenticated layout with top nav)
- `/register/:token` — public vendor self-registration portal (no nav, no auth)

## Railway Environment Variables
| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Sends vendor invitation emails |
| `FROM_EMAIL` | Sender address (e.g., `Mawthuq <onboarding@resend.dev>`) |
| `APP_URL` | Full deployment URL — **no trailing slash** (e.g., `https://mawthuq-production.up.railway.app`) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS) |
| `SUPABASE_BUCKET` | Storage bucket name (default: `vendor-packages`) |
| `OPENAI_API_KEY` | GPT-4.1-mini for document extraction |

## Common Pitfalls
- **`@/` in server-imported files** → tsx crashes at runtime. Use relative imports in `src/data/seed.ts` and `src/lib/scorecard.ts`.
- **`app.get("*", ...)` in Express 5** → path-to-regexp v8 requires named wildcards: use `"*path"`.
- **`APP_URL` trailing slash** → produces `//register/token` in emails. Config strips it: `.replace(/\/+$/, "")`.
- **Invitation 404 on send-email** — was caused by two-request race (create then send-email read stale state). Now fixed with single `POST /api/invitations/invite-and-send` atomic endpoint.
- **Supabase not configured** → server falls back to local JSON automatically. Data persists within a Railway deploy but resets on redeploy.

## TypeScript Configs
Three separate tsconfigs to keep strict isolation:
- `tsconfig.app.json` — frontend (Vite, browser)
- `tsconfig.server.json` — Express server (Node, ESM)
- `tsconfig.node.json` — Vite config file itself

Always run all three before committing: `npm run build` covers all.
