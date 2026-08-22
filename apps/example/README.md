# Pagiera package example

This app consumes the `pagiera` package through the repository's Bun workspace.

```bash
cp .env.example .env.local
cd ../..
bun install
bun run dev
```

Set `PAGIERA_POSTGRES_URL`, `PAGIERA_REDIS_URL`, `OPENROUTER_API_KEY`, and
`OPENROUTER_MODEL`. Open `/editor` after PostgreSQL and Redis are reachable.
The package creates its tables automatically. `/api/pagiera/health` verifies
the backend.

Routes:

- `/` — published `home` page
- `/editor` — full Pagiera editor
- `/preview/:pageId` — draft renderer
- `/[slug]` — every other published page (`/work`, `/contact`, ...)
- `/api/pagiera/*` — package-owned backend
