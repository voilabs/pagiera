<div align="center">
  <a href="https://pagiera.com">
    <img src="https://raw.githubusercontent.com/voilabs/pagiera/main/packages/pagiera/thumbnail.png" alt="Pagiera visual website builder" width="100%" />
  </a>

  <h1>Pagiera</h1>
  <p><strong>Design freely. Publish real websites.</strong></p>
  <p>A full-stack visual website builder for React and Next.js.</p>

  <p>
    <a href="https://www.npmjs.com/package/pagiera"><img src="https://img.shields.io/npm/v/pagiera?color=5402E6" alt="npm version" /></a>
    <a href="https://github.com/voilabs/pagiera/actions/workflows/ci.yml"><img src="https://github.com/voilabs/pagiera/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-111111" alt="MIT license" /></a>
  </p>

  <p>
    <a href="https://pagiera.com">Website</a> ·
    <a href="./packages/pagiera/README.md">Documentation</a> ·
    <a href="https://github.com/voilabs/pagiera/issues">Issues</a>
  </p>
</div>

## Why Pagiera?

- Framer-style responsive canvas with breakpoints, components, variants, and motion
- Server-rendered publishing with semantic HTML and SEO-friendly API data
- OpenRouter-powered AI design workflow
- Dynamic pages such as `/blog/:slug` with Request and Repeat blocks
- PostgreSQL persistence, Redis caching, templates, preview, and publishing included
- GitHub-backed template registry—ship new templates without republishing npm
- One package—no separate editor repository or backend service

## Quick start

```bash
git clone https://github.com/voilabs/pagiera.git
cd pagiera
bun install
cp .env.example apps/example/.env.local
docker compose up -d
bun run dev
```

Open [localhost:3000/editor](http://localhost:3000/editor).

## Monorepo

```text
apps/example       Next.js development and integration app
packages/pagiera   Publishable npm package
templates/         CDN-backed community template catalog
```

```bash
bun run check          # type-check everything
bun run build          # production build
bun run package:pack   # create the npm tarball
```

Full installation, font provider, SSR, API, routing, and deployment instructions are in the [package documentation](./packages/pagiera/README.md).

## License

MIT © [Voi Labs](https://github.com/voilabs)
