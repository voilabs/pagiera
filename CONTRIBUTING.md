# Contributing to Pagiera

Thank you for contributing to Pagiera.

## Development

1. Fork and clone `voilabs/pagiera`.
2. Create a focused branch from `main`.
3. Run `bun install`.
4. Copy `.env.example` to `apps/example/.env.local`.
5. Start PostgreSQL and Redis with `docker compose up -d`.
6. Run `bun run dev`.

## Before opening a pull request

```bash
bun run check
bun run build
```

Keep changes scoped, preserve backward compatibility where practical, and include documentation for public API changes. Do not commit environment files, credentials, build output, package tarballs, or database volumes.

## Commit and pull request guidance

- Use a concise imperative commit title.
- Explain the user-visible outcome and implementation tradeoffs.
- Include reproduction steps for bug fixes.
- Include screenshots or recordings for editor UI changes.
- Call out schema, environment, or public API changes explicitly.

By contributing, you agree that your contribution is licensed under the repository's MIT license.
