# Documentation is part of implementation

When changing user-visible behavior, a public API, native blocks, configuration,
CLI commands or operational requirements, update the relevant documentation and
the Unreleased changelog in the same change. Do not defer documentation to a
separate task or claim an unpublished feature is released.

- Source of truth: implemented code and verified behavior, not GitHub README sync.
- Website catalog: `apps/web/src/lib/docs-catalog.ts`.
- Handbook content: `apps/web/src/lib/docs-content.ts` and `docs-systems.ts`.
- Changelog: the `changelog` entry in `docs-systems.ts`.
- Add new pages to the catalog; navigation, search and sitemap derive from it.
- Explain prerequisites, ordered steps, expected outcomes, failure cases and
  security boundaries. Verify commands and examples against the implementation.
- Run `node scripts/check-docs.cjs` and the relevant type checks/tests before
  handing off. Structural checks do not prove prose is semantically current.
- For an actual release, move verified Unreleased entries under the real version
  and date. Do not invent release history.

This policy keeps docs maintained during repository work; it does not imply a
background writer or scheduled service exists.

## English and Turkish parity

Public website changes must preserve both locales. English uses the unprefixed
route; Turkish uses `/tr`. Translate new interface copy with `useI18n`, preserve
internal link locales with `localizedHref`, and update matching `*-tr.ts`
content alongside English. Do not translate executable examples, API identifiers,
stable slugs or user-authored external templates. Run `node scripts/check-i18n.cjs`
to check dataset coverage, code-example parity and locale routing helpers.

## Codex + Claude development loop

`packages/pagiera` is developed with a split-role loop:

- **Codex (`gpt-6-sol`, limited/low reasoning, read-only sandbox) is the
  tester and reviewer.** It runs the checks below, reads the code and reports
  bugs, type errors, regressions and missing pieces as a numbered list with
  `file:line`, a concrete failure scenario and a suggested fix. Codex does not
  edit files.
- **Claude is the only writer.** It applies fixes for Codex's findings, keeps
  the change minimal and in the surrounding code style, then hands back to
  Codex for another pass. The loop ends when Codex reports no actionable
  findings.

Checks Codex runs on every pass:

```sh
bun run package:check          # tsc --noEmit for packages/pagiera
node scripts/check-docs.cjs
node scripts/check-i18n.cjs
```

Rules for both agents:

- Do not touch `packages/pagiera/AGENTS.md`; it ships to package consumers.
- Never call the live Pagiera save API without re-reading the page and keeping
  site masters; a page save replaces site components.
- Findings without a reproducible scenario are reported as "unverified" and
  are not fixed blindly.
- User-visible changes still follow the documentation and EN/TR parity rules
  above.
