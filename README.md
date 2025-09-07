# Music Auction – Next.js on Cloudflare

A Next.js app (App Router) prepared to run on Cloudflare (Pages/Workers) and use serverless Postgres (Neon).

## Quick start

1) Install dependencies

```
npm install
# or: pnpm install / yarn install
```

2) Configure environment

- Copy `.env.example` to `.env.local` and set `DATABASE_URL` to your Neon connection string.

3) Run locally

```
npm run dev
```

- Health check: GET http://localhost:3000/api/health
- DB health (requires `DATABASE_URL`): GET http://localhost:3000/api/db-health

## Cloudflare (Next on Pages)

This repo includes scripts to build for Cloudflare Pages using the official adapter.

- Build + adapt output for Pages:

```
npm run cf:build
```

This produces `.vercel/output/**` and adapts it for Pages Functions.

- Preview locally with Wrangler (simulates Pages):

```
npm run cf:preview
```

Notes:
- Ensure `wrangler` is installed via devDependencies (already in package.json).
- If your project runs into Node API needs, `compatibility_flags = ["nodejs_compat"]` is set in `wrangler.toml`.

## Database (Neon)

- This app uses `@neondatabase/serverless` for an edge-compatible Postgres client.
- See `lib/db.ts` for a minimal setup and `app/api/db-health/route.ts` for an example query.

## Next steps

- Run migrations (development):

```
curl -X POST http://localhost:3000/api/migrate -H "x-migrate-token: $MIGRATION_TOKEN"
```

- Auth endpoints (Edge):
  - POST /api/auth/signup { email, password }
  - POST /api/auth/login { email, password }
  - POST /api/auth/logout

- Items endpoints:
  - GET /api/items?search=...&page=1&pageSize=20
  - POST /api/items { title, short_description, long_description, image_url, sale_type, reserve_price?, buy_now_price? }
  - GET /api/items/[id]

- Notes:
  - Auctions are automatically set to end in 7 days; reserve price optional.
  - Fixed-price items require buy_now_price.
  - `MIGRATION_TOKEN` can protect the migration route in production.

