# Mawthūq

Mawthūq is an AI-assisted Vendor Prequalification & Risk Engine for Saudi construction procurement. This MVP demonstrates one end-to-end workflow:

Vendor upload -> AI extraction -> deterministic scorecard -> human review -> Approved Vendor List -> WhiteHelmet Bid Analysis handoff

## Run locally

```bash
npm install
npm run dev -- --port 5174
```

This starts:

- the React frontend
- the lightweight Express API used for persistence and report generation

The frontend proxies `/api` requests to the local API server.

## Build

```bash
npm run build
```

## MVP notes

- frontend: React + TypeScript + Tailwind
- backend: Express + OpenAI + optional Supabase
- persistence: local JSON by default, optional Supabase-backed app state
- file storage: local uploads by default, optional Supabase Storage
- live extraction scope: Commercial Registration, Contractor Classification, ZATCA Certificate, Audited Financial Statements, ISO Certificates, Project References
- unsupported or weak fields: fallback evidence mode with audit logging

## Walkthrough

See [docs/WHITEHELMET_MVP_WALKTHROUGH.md](/Users/aliraza/Documents/Mawthuq/docs/WHITEHELMET_MVP_WALKTHROUGH.md) for the interview-facing product narrative mapped to the WhiteHelmet take-home structure.

## Environment

Copy `.env.example` to `.env` and add:

- `OPENAI_API_KEY` for working AI extraction
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for cloud persistence

If Supabase is not configured, Mawthūq still works locally using the file-backed store in `server/data/store.json`.

## Supabase setup

Apply [supabase/schema.sql](/Users/aliraza/Documents/Mawthuq/supabase/schema.sql) and create a Storage bucket named `vendor-packages`.

## Demo controls

- Hidden debug/reset route: `/demo-ops`
- AI extraction route: `/ai-extraction`
- One-click seeded reset is available inside Demo Ops
