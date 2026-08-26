# Pagiera Template Authoring Prompt

Paste everything below into the model that will generate a template. It is the
complete contract: anything not described here is either ignored or silently
dropped by the validator.

---

You are authoring a **Pagiera template**: a complete, responsive multi-page
website expressed as JSON. Pagiera is a visual website builder; a template is a
bundle the builder installs to replace a site's pages.

Your output is JSON only — no code, no framework, no HTML. Every visual decision
is expressed as element tree + style values.

## 1. Repository layout

A template registry is a directory (typically a Git repo) shaped like this:

```
registry.json                  # catalog of every template
<template-id>/
  template.json                # the bundle: pages + shared components
  thumbnail.svg                # optional; generated from `preview` if absent
```

`registry.json` lists templates; each entry's `file` and `thumbnail` are
**relative** paths resolved against the registry URL. Keep the `./` prefix.

## 2. registry.json

```json
{
  "schemaVersion": 1,
  "updatedAt": "2026-08-23T18:30:00.000Z",
  "templates": [
    {
      "id": "cardiova-heart-specialist",
      "version": "1.0.0",
      "name": "Cardiova Heart Specialist",
      "description": "One sentence, max ~140 chars, describing what the site is for.",
      "category": "Medical",
      "tags": ["Cardiology", "Doctor", "Healthcare", "Light"],
      "pages": ["Home", "Services", "Contact"],
      "file": "./cardiova-heart-specialist/template.json",
      "thumbnail": "./cardiova-heart-specialist/thumbnail.svg",
      "featured": true,
      "font": { "title": "Inter", "family": "\"Inter\", sans-serif" },
      "preview": {
        "background": "#FAF7F5",
        "foreground": "#351D1D",
        "accent": "#B33A3A",
        "eyebrow": "CARDIOVA / HEART CENTER",
        "headline": "SMARTER DECISIONS FOR A HEALTHIER HEART."
      }
    }
  ]
}
```

Rules:

- `id` — `^[a-z0-9][a-z0-9._-]{0,99}$`, unique, and **identical** to the bundle's `id`.
- `version` — must **exactly match** the bundle's `version`, or validation fails.
- `pages` — display labels for the catalog card. Purely cosmetic; the real pages
  live in the bundle.
- `preview` — drives the generated card art. `eyebrow` and `headline` are shown
  in caps; keep the headline under ~48 chars. Colors must be real CSS colors.
- `font.url` — only set it when the font is actually served; otherwise omit and
  give `family` a stack that resolves on its own.
- Max 12 breakpoints, max 20 pages, max 2000 elements per page.

## 3. template.json (the bundle)

```json
{
  "schemaVersion": 1,
  "id": "cardiova-heart-specialist",
  "version": "1.0.0",
  "pages": [ /* Page[] — at least one, and one MUST have slug "home" */ ],
  "components": [ /* optional CanvasElement[] — shared masters */ ]
}
```

A **Page**:

```json
{
  "name": "Home",
  "slug": "home",
  "elements": [ /* CanvasElement[] */ ],
  "rootStyle": { /* RootStyle */ },
  "dataSources": [ /* optional DataSource[] */ ]
}
```

- `slug` — lowercase, `/`-separated. Static segments are `[a-z0-9-]`. A segment
  may be a parameter: `journal/:slug`. Duplicate slugs or duplicate parameter
  names within one slug are rejected. The home page's slug is exactly `home`.
- `name` — 1–120 chars, free text.

## 4. RootStyle — the page shell

Every key is optional; the listed default applies when omitted.

| Key | Default | Notes |
| --- | --- | --- |
| `documentMode` | `"page"` | Always `"page"` for templates. |
| `maxWidth` | `1280` | 1–4000. Content width when `fullWidth` is false. |
| `canvasHeight` | `800` | 1–12000. With `layout: "stack"` this is the editor surface only and the live page grows with content. With `layout: "absolute"` it also sets the published page's height — free-placed children are out of flow, so nothing else can. Either way, set it to roughly the real page height. |
| `fullWidth` | `false` | See §7. |
| `bg` | `"#ffffff"` | Page background. |
| `layout` | `"stack"` | Use `"stack"` for pages. `"absolute"` makes the page a free canvas. |
| `direction` | `"column"` | |
| `gap` | `0` | 0–999. Gap between top-level sections. |
| `padT/padR/padB/padL` | `0` | 0–9999. |
| `align` | `"stretch"` | Keep `"stretch"` so sections span the width. |
| `fontFamily` | `"inherit"` | A full CSS font stack, e.g. `"\"Inter\", sans-serif"`. |
| `pageTransition` | `"smooth"` | `smooth \| fade \| slide \| none`. |
| `pageTransitionDuration` | `380` | 120–1200 ms. |
| `breakpoints` | 1280/768/375 | See §8. |
| `baseBreakpointId` | widest | See §8. |
| `customFonts` | – | `[{ id, name, url, weight, style }]`; emitted as `@font-face`. |
| `variables` | – | `[{ id, name, type: "color"\|"number", value }]`. |

Keep `rootStyle` **identical across all pages of one template** except
`canvasHeight`. Differing fonts or backgrounds per page look like a bug.

## 5. CanvasElement

```json
{
  "id": "hero-title",
  "type": "Heading",
  "name": "Hero title",
  "parentId": "hero-inner",
  "z": 2,
  "content": "Smarter decisions for a healthier heart.",
  "base": { /* partial ElementStyle */ },
  "overrides": { "mobile": { "fontSize": 34 } },
  "hover": { "color": "#B33A3A" }
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Unique within the page. Duplicates are dropped. Any stable string. |
| `type` | yes | One of the types in §9. Unknown types drop the element. |
| `z` | yes | **0–2000. This is what orders siblings, not array position.** |
| `parentId` | no | Omit for a top-level element. A `parentId` that names no element is severed (the element becomes top-level). Cycles are broken. |
| `name` | no | Layer name shown in the editor. Always set it — an unnamed tree is unusable. |
| `base` | yes | Partial `ElementStyle`; missing keys fall back to the defaults in §6. |
| `overrides` | no | `{ [breakpointId]: Partial<ElementStyle> }`. See §8. |
| `hover` / `press` | no | Partial `ElementStyle` applied on pointer hover / press. |
| `locked` | no | |
| `loop` | no | `{ type: "pulse"\|"float"\|"spin", duration }` — continuous motion. |

Content fields, by element type:

| Field | Used by | Notes |
| --- | --- | --- |
| `content` | Heading, Text, Button | Max 10 000 chars. Plain text, no HTML. |
| `src`, `alt`, `objectFit` | Image, Video | `objectFit`: `cover\|contain\|fill\|none`. |
| `iconName` | Icon | Must be a known Pagiera icon name. |
| `href`, `target` | Button, any linkable | `target`: `_self\|_blank`. |
| `placeholder`, `fieldName`, `inputType`, `required` | Input, Textarea | `inputType`: `text\|email\|password\|number\|tel\|url\|search`. |
| `buttonType` | Button | `button\|submit\|reset`. Use `submit` inside a Form. |
| `formAction`, `formMethod`, `formSubmitMode`, `formContentType`, `formBody`, `formHeaders`, `formSuccessMessage`, `formErrorMessage`, `formResetOnSuccess` | Form | See §10. |
| `sourceId`, `binding` | Request, Repeat, and bound leaves | See §10. |
| `interaction` | any | `{ trigger: "click", action, value, target? }` where action is `navigate \| scroll-to \| toggle-layer \| show-layer \| hide-layer`. |

## 6. ElementStyle

All 57 keys, with the default used when the key is absent. Write only what
differs from the default — the validator fills the rest.

> **There are no per-type defaults in a bundle.** When the builder installs a
> template, every missing key falls back to the single table below — *not* to
> the sensible starting values the editor gives a freshly dropped Section or
> Grid. An element whose `base` omits `layout` and `widthMode` becomes
> `layout: "absolute"`, `widthMode: "fixed"`, `w: 200`, `h: 100`, which is
> almost never what a section wants. **Spell out `layout`, `direction`,
> `widthMode` and `heightMode` on every container you author.**

**Box** (`x`/`y` are read **only** inside an `absolute` parent)

| Key | Default | Range / values |
| --- | --- | --- |
| `x`, `y` | `0` | ±100000 |
| `constraintX`, `constraintY` | `"start"` | `start\|center\|end\|stretch` |
| `w`, `h` | `200`, `100` | 1–100000 |
| `widthMode`, `heightMode` | `"fixed"` | `fixed\|fill\|auto` |

**Own layout** (how this element arranges its children)

| Key | Default | Range / values |
| --- | --- | --- |
| `layout` | `"absolute"` | `absolute\|stack` |
| `direction` | `"column"` | `row\|column` |
| `gap` | `0` | 0–999 |
| `padT`,`padR`,`padB`,`padL` | `0` | 0–9999 |
| `justify` | `"start"` | `start\|center\|end\|between` |
| `align` | `"start"` | `start\|center\|end\|stretch` |
| `wrap` | `false` | |
| `columns` | `3` | 1–12; only on a Grid with `layout: "stack"` |

**Appearance**

| Key | Default | Range / values |
| --- | --- | --- |
| `bg` | `"transparent"` | CSS color |
| `gradient` | `""` | full CSS gradient; painted over `bg` |
| `color` | `"#27272a"` | text color |
| `radius` | `0` | 0–9999 |
| `opacity` | `100` | 0–100 |
| `borderW` | `0` | 0–999 |
| `borderC` | `"transparent"` | CSS color |
| `borderStyle` | `"solid"` | `solid\|dashed\|dotted` |
| `shadow` | `""` | full CSS box-shadow |
| `rotate` | `0` | −360–360 |

**Typography**

| Key | Default | Range / values |
| --- | --- | --- |
| `fontFamily` | `"inherit"` | CSS stack |
| `fontSize` | `16` | 1–999 |
| `fontWeight` | `"normal"` | e.g. `"600"` |
| `lineHeight` | `1.5` | 0.5–10 (unitless) |
| `letterSpacing` | `0` | −50–50 (px) |
| `textAlign` | `"left"` | `left\|center\|right\|justify` |
| `textTransform` | `"none"` | `none\|uppercase\|lowercase\|capitalize` |

**Composition**

| Key | Default | Range / values |
| --- | --- | --- |
| `overflow` | `"visible"` | `visible\|hidden\|auto\|scroll` |
| `position` | `"static"` | `static\|sticky` |
| `zIndex` | `0` | −9999–9999 (CSS stacking, separate from `z`) |
| `stickyOffset` | `0` | −9999–9999; only read when `position: "sticky"` |
| `bgImage` | `""` | plain URL — **no** quotes, parentheses or backticks |
| `bgSize` | `"cover"` | `cover\|contain\|auto` |
| `bgPosition` | `"center"` | |
| `blur` | `0` | 0–200 px, blurs own content |
| `backdropBlur` | `0` | 0–200 px, the glass effect |
| `blendMode` | `"normal"` | `normal\|multiply\|screen\|overlay\|darken\|lighten\|difference\|luminosity` |
| `scale` | `100` | percent |
| `aspectRatio` | `""` | must match `\d{1,3}/\d{1,3}`, e.g. `"16/9"`; anything else becomes `""` |

**Motion & state**

| Key | Default | Range / values |
| --- | --- | --- |
| `entrance` | `"none"` | `none\|fade\|up\|down\|left\|right\|zoom` |
| `entranceDuration` | `600` | ms |
| `entranceDelay` | `0` | ms |
| `entranceCurve` | `"ease"` | `ease\|spring` |
| `entranceBezier` | `"0.44, 0, 0.56, 1"` | |
| `springStiffness` | `300` | |
| `springDamping` | `30` | |
| `cursor` | `"auto"` | `auto\|default\|pointer\|text\|grab\|zoom-in\|none` |
| `hidden` | `false` | hides the element at this breakpoint |

**Sanitisation.** `bg`, `color`, `gradient`, `shadow`, `borderC`, `fontFamily`,
`fontWeight`, `bgPosition` are passed through a CSS sanitiser that strips
`; { } < > \` and `@import`. `bgImage` additionally rejects `" ' ( )` and
backticks. Write plain values.

## 7. Layout model — the part that decides whether it looks designed

**Two positioning modes.** A parent's `layout` decides how its children are
placed:

- `"stack"` — flexbox. Children flow along `direction`, spaced by `gap`,
  aligned by `justify`/`align`. `x`/`y` are ignored.
- `"absolute"` — children are placed at `x`/`y` and anchored by
  `constraintX`/`constraintY`.

**Default to `"stack"` everywhere.** Use `"absolute"` only for deliberate
overlap (a badge on an image, a decorative blob). An absolute-heavy template
cannot adapt to a narrow breakpoint.

A whole page can be freely placed by setting `rootStyle.layout: "absolute"` —
poster-like art direction where every section sits at its own coordinates. Two
things then become your responsibility, because nothing else can do them:
`canvasHeight` must cover the tallest content, and every breakpoint needs its
own `x`/`y` overrides, since free coordinates do not reflow. Elements pushed
fully past the left or right edge are treated as off-canvas notes and are
**excluded from the published page** — that is how authors park scratch content,
so keep real content inside the frame.

**Three sizing modes** per axis:

- `fixed` — exactly `w`/`h` px.
- `fill` — expands to the parent. Along the main axis this grows; on the cross
  axis it stretches.
- `auto` — hugs the content. **Every text element should use
  `heightMode: "auto"`**, or it will clip when the copy wraps at a narrow width.

**Full-bleed sections.** This is the single most important structural rule.

*Option A — capped page (`fullWidth: false`, the common choice).* Any `Section`
with `layout: "stack"` is treated as a **band**: it is split into an outer shell
that spans the whole viewport and an inner box capped at `rootStyle.maxWidth`
and centred. Set the Section's `bg`, padding and border for the full-width look;
its children automatically sit inside the content width. You do not add an inner
wrapper yourself.

*Option B — free page (`fullWidth: true`).* No splitting happens. Sections span
naturally, and you must add your own inner `Container` with a fixed width (e.g.
`w: 1180, widthMode: "fixed"`) to hold the content column.

Pick one and apply it consistently. Mixing them produces sections whose content
edges do not line up.

**Page skeleton (Option A), the shape to follow:**

```
Section  "Header"    layout stack, widthMode fill, heightMode auto, position sticky
Section  "Hero"      layout stack, widthMode fill, heightMode auto, padT/padB large
  Container "Hero copy"   layout stack, direction column, gap 20, widthMode fill
    Heading  z 0
    Text     z 1
    Button   z 2
Section  "Services"  layout stack, widthMode fill, heightMode auto
  Grid    "Cards"    layout stack, columns 3, gap 24, widthMode fill
    Container "Card" ×3
Section  "Footer"
```

Sibling order comes from `z`: `0, 1, 2, …` top to bottom.

### 7.1 Escape hatches: custom CSS and JS

Two `rootStyle` fields exist for what the element model cannot express.

`customCss` is appended **after** the generated stylesheet, so a rule wins
against the builder's own at equal specificity — no `!important` needed. Target
elements through the classes the renderer emits: `.pg-root` (the page),
`.pg-node` (every element), `.pg-inner` (a band's content box), `.pg-link`.

```json
"customCss": ".pg-root h1{text-wrap:balance}
@media (min-width:1600px){.pg-root{font-size:18px}}"
```

Use it for what has no field: `text-wrap`, `clip-path`, `mask-image`,
`@supports`, `:has()`, container queries, custom `@keyframes`, print styles.
Do **not** use it to restate values that already have fields — those stop
tracking the design and never respond to breakpoint overrides.

`customJs` runs on the published page after the document parses, once the
builder's own behaviour is wired up. It never runs in the editor or in the
template preview, so it cannot be verified before publishing — keep it small and
defensive.

```json
"customJs": "document.querySelectorAll('[data-count]').forEach(function(n){/* … */});"
```

Both are limited (40 000 chars of CSS, 20 000 of JS) and narrowed on save: a
closing `</style>` or `</script>` is neutralised so the source cannot break out
of its own tag, and `@import` is removed — it would make every visitor's browser
announce itself to a third-party host.

**Prefer the element model.** A template that leans on `customCss` for layout is
one the site owner cannot edit visually, which defeats the point of a builder.
Reach for these only for the last 5%.

## 8. Responsive: breakpoints and overrides

Declare the viewports on `rootStyle`:

```json
"breakpoints": [
  { "id": "desktop", "name": "Desktop", "width": 1280 },
  { "id": "tablet",  "name": "Tablet",  "width": 768 },
  { "id": "mobile",  "name": "Mobile",  "width": 375 }
],
"baseBreakpointId": "desktop"
```

- `id` — `[a-zA-Z0-9_-]`, 1–60 chars. `width` — 240–4000. Max 12 entries.
- `baseBreakpointId` names the breakpoint whose values live in every element's
  `base`. It must name one of the declared breakpoints, or it is dropped and the
  **widest** one is used. Default to the widest and design desktop-first.

**Cascade.** `base` holds the base breakpoint's values. `overrides[id]` holds
only the deltas for other breakpoints, applied outward from the base — narrower
breakpoints inherit downward, wider ones upward, and the entry nearest the
target wins. With a desktop base, `mobile` inherits `tablet`'s overrides.

**The base breakpoint must never appear in `overrides`** — it owns `base`, and
such an entry is discarded.

Published CSS emits a media query per breakpoint: narrower ones become
`max-width: (next wider − 1)px`, wider ones `min-width: (own width)px`.

**What actually needs overriding.** At `mobile`, expect to override on most
sections: `direction` (`row` → `column`), `columns` (3 → 1), `fontSize`,
`gap`, `padL`/`padR`, and `hidden` for decorative elements. Write nothing else —
every unnecessary override is a value that stops tracking the design.

```json
"overrides": {
  "tablet": { "columns": 2, "fontSize": 44 },
  "mobile": { "columns": 1, "fontSize": 32, "direction": "column", "padL": 20, "padR": 20 }
}
```

## 9. Element types

| Type | Purpose | Key fields |
| --- | --- | --- |
| `Section` | Top-level band. Full-bleed under Option A. | style only |
| `Container` | General grouping box. | style only |
| `Stack` | Container that defaults to flex layout. | style only |
| `Grid` | Column grid; set `columns` with `layout: "stack"`. | `columns` |
| `Frame` | Fixed, clipped box — cards, media wells. | style only |
| `Heading` | Headings. | `content` |
| `Text` | Body copy. | `content` |
| `Button` | Link or form control. | `content`, `href`, `target`, `buttonType` |
| `Image` | Picture. | `src`, `alt`, `objectFit` |
| `Video` | Video. | `src` |
| `Icon` | Built-in vector icon. | `iconName` (see below) |
| `Form` | Form wrapper with submit handling. | see §10 |
| `Input` | Single-line field. | `fieldName`, `inputType`, `placeholder`, `required` |
| `Textarea` | Multi-line field. | `fieldName`, `placeholder`, `required` |
| `Request` | Binds one record from a source to its subtree. | `sourceId` |
| `Repeat` | Repeats its subtree once per row. | `sourceId` |

`iconName` must come from Pagiera's built-in set (76 names) — an unknown name
renders nothing. Safe, commonly used ones: `star`, `heart`, `check`, `x`,
`plus`, `minus`, `search`, `menu`, `dots`, `arrow-left`, `arrow-right`,
`arrow-up`, `arrow-down`, `chevron-left`, `chevron-right`. If you need one that
is not obviously in the set, use an `Image` instead of guessing.

## 10. Data sources, Repeat and bindings

Declare sources on the page:

```json
"dataSources": [
  {
    "id": "articles",
    "name": "Articles",
    "url": "https://api.example.com/posts",
    "path": "data.items",
    "method": "GET",
    "params": [{ "key": "slug", "value": "{{params.slug}}" }],
    "headers": [{ "key": "Accept", "value": "application/json" }],
    "onNotFound": "empty"
  }
]
```

- `path` — dotted path to the array inside the payload; `""` when the payload is
  the array itself.
- `method` — `GET\|POST\|PUT\|PATCH\|DELETE`. `body` is only sent for
  POST/PUT/PATCH.
- Tokens: `{{query.x}}` (visitor query string), `{{params.x}}` (dynamic slug
  segment), `{{page.slug}}`. Unknown tokens resolve to an empty string.
- Max 25 `params` and 25 `headers`.
- `onNotFound` — `"empty"` (source yields no rows) or `"page-404"`.

To render rows: give a `Repeat` element a `sourceId`, build one row's layout as
its children, and put `binding` on the leaves that should read a field:

```json
{ "id": "card-title", "type": "Heading", "parentId": "article-card",
  "z": 0, "binding": "title", "content": "Article title", "base": {} }
```

`binding` accepts dotted paths (`author.name`) and must match
`^[A-Za-z0-9_$][A-Za-z0-9_$.-]*$`. Keep `content` filled with realistic
placeholder text: when a source returns nothing, a Repeat renders exactly one
placeholder row using the authored content — that is also what the template
preview shows, so it must look right on its own.

**Do not point a template at an API that needs a secret.** Headers in a bundle
are visible to anyone who can edit the site.

Forms: set `formSubmitMode: "request"` with `formAction`, `formMethod`,
`formContentType` (`json\|form-data\|urlencoded`) and optionally `formBody`
using `{{form.<fieldName>}}` tokens. Give each `Input`/`Textarea` a `fieldName`,
and the submit `Button` `buttonType: "submit"`.

## 11. Shared components

`components` in the bundle holds reusable masters — a navbar or footer shared by
every page. A master carries `componentRole: "master"` and a `componentId`;
instances on a page carry `componentRole: "instance"` with the same
`componentId` and a `componentSourceId` pointing at the master's id. If you
supply `components` at all, at least one entry must be a master. When in doubt,
omit `components` and repeat the markup per page.

## 12. Hard limits and silent drops

The validator never errors on a bad element — it removes it. Watch for:

- Unknown `type` → element dropped.
- Duplicate `id` → later one dropped.
- `parentId` that names nothing → the link is severed, element goes top-level.
- Override keyed by the base breakpoint → dropped.
- `aspectRatio` not matching `\d{1,3}/\d{1,3}` → becomes `""`.
- Out-of-range numbers → clamped, not rejected.
- Bundle `id`/`version` differing from the registry entry → **whole template
  rejected**.
- No page with slug `home` → **whole template rejected**.
- Limits: 2000 elements/page, 20 pages, 12 breakpoints, 10 000 chars of
  `content`, 2048-char URLs, 200-char short strings.

## 13. Checklist before you emit

1. Bundle `id` and `version` match the registry entry exactly.
2. Exactly one page has `slug: "home"`; all slugs are unique.
3. Every element has a unique `id`, a `z`, and a human `name`.
4. Every `parentId` resolves.
5. Every text element uses `heightMode: "auto"`.
6. Every top-level element is a `Section` with `widthMode: "fill"`.
7. Sibling order reads correctly by ascending `z`.
8. `tablet` and `mobile` overrides exist wherever a row layout or multi-column
   grid appears, and nowhere else.
9. No override is keyed by the base breakpoint.
10. `rootStyle` is consistent across pages except `canvasHeight`.
11. Colors have real contrast: check body text against its section `bg`.
12. No secrets in `dataSources`.

## 14. Design direction

Produce something that looks art-directed, not a bootstrap page:

- Commit to a real palette — one background family, one accent, one deep text
  colour. Set them explicitly on every section rather than relying on defaults.
- Use scale: hero headings at 56–96px on desktop, body at 15–17px, and drop
  headings roughly 40% at mobile.
- Give sections generous vertical padding (`padT`/`padB` 80–160 on desktop,
  48–72 on mobile) — spacing is what reads as premium.
- Use `entrance: "up"` with staggered `entranceDelay` (0, 80, 160 ms) on the
  main content of each section. Leave `entrance: "none"` on headers and footers.
- Reach for `radius`, `shadow`, `gradient`, `backdropBlur` and `aspectRatio`
  deliberately; a template that only uses solid rectangles looks unfinished.

## 15. Output format

Emit two fenced JSON blocks and nothing else:

1. The `registry.json` entry for this template (the object only, not the whole
   file).
2. The complete `template.json`.

Both must be valid JSON — no comments, no trailing commas.

After the files are in place, the registry can be checked with:

```bash
bun run templates/scripts/validate.ts
```

It verifies id/version agreement, the `home` page, slug uniqueness and the
component rules — but it does **not** catch layout mistakes. Those only show up
in the template preview.
