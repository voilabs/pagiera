# Graph Report - pagiera  (2026-10-29)

## Corpus Check
- 255 files · ~795,916 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: .css 5, (none) 4, .example 3)

## Summary
- 2264 nodes · 5555 edges · 111 communities (98 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 71 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c3c1fb66`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- pages.ts
- history-panel.tsx
- presets.ts
- inspector.tsx
- types.ts
- CanvasElement
- ai-design/route.ts
- DragSession
- cascade.ts
- web/package.json
- source.ts
- editor/validate.ts
- dsl.ts
- [[...slug]].tsx
- showcase.tsx
- page-render.tsx
- example/package.json
- ref_next
- pagiera/package.json
- localizedHref
- theme.ts
- create-forma.ts
- Pagiera
- site-templates.ts
- useI18n
- structured-data.ts
- package.json
- editor/editor.tsx
- published-page.tsx
- src/index.ts
- compose.ts
- example/biome.json
- web/biome.json
- server-source.ts
- dependencies
- site-bar.tsx
- guides/[slug].tsx
- editor/style.ts
- faq.tsx
- template-catalog.ts
- compilerOptions
- web/scripts/check-i18n.cjs
- ref_node_path
- exports
- Build and launch websites with Pagiera
- compilerOptions
- server.d.ts
- expression.ts
- Group
- pagiera-editor.tsx
- layout.tsx
- library.tsx
- src/page.tsx
- compilerOptions
- editor/actions.ts
- templates-panel.tsx
- custom.ts
- cn
- check-docs.cjs
- group.tsx
- drag-session.ts
- build-extra.ts
- css.ts
- audit-responsive.ts
- ContentTab
- SelectInput
- parseStyle
- shaders.ts
- compilerOptions
- scripts
- icons-panel.tsx
- Pagiera Template Authoring Prompt
- template-registry.ts
- test-text-effects.ts
- devDependencies
- check-docs.mjs
- format.ts
- sitemap.xml.ts
- test-binding-format.ts
- Contributing to Pagiera
- AI workspace
- web/README.md
- PULL_REQUEST_TEMPLATE.md
- full-editor.d.ts
- repository
- binding-format.tsx
- Security policy
- Next.js setup
- mcp-test-server.mjs
- Troubleshooting
- example/AGENTS.md
- example/postcss.config.mjs
- build-full.mjs
- web/AGENTS.md
- web/postcss.config.mjs
- peerDependencies
- createPagieraClient
- data-modal.tsx
- Pagiera template registry
- assets.d.ts
- { GET, POST, PUT, PATCH, DELETE }
- PagieraStudio
- RenderedPage
- menu.tsx
- runtime.d.ts
- test-ai-scope.ts
- build-full-css.mjs
- use-canvas-view.ts

## God Nodes (most connected - your core abstractions)
1. `Editor()` - 112 edges
2. `useI18n()` - 66 edges
3. `localizedHref()` - 47 edges
4. `CanvasElement` - 45 edges
5. `Icon()` - 43 edges
6. `parseElements()` - 42 edges
7. `resolveStyle()` - 36 edges
8. `Group()` - 34 edges
9. `SelectInput()` - 33 edges
10. `stylesheetFor()` - 32 edges

## Surprising Connections (you probably didn't know these)
- `10. Data sources, Repeat and bindings` --references--> `Button()`  [INFERRED]
  templates/AUTHORING-PROMPT.md → apps/web/src/components/ui/button.tsx
- `9. Element types` --references--> `Icon()`  [INFERRED]
  templates/AUTHORING-PROMPT.md → apps/web/src/components/icons.tsx
- `9. Element types` --references--> `Button()`  [INFERRED]
  templates/AUTHORING-PROMPT.md → apps/web/src/components/ui/button.tsx
- `English and Turkish parity` --references--> `useI18n()`  [INFERRED]
  AGENTS.md → apps/web/src/lib/i18n.ts
- `9. Element types` --references--> `Heading`  [INFERRED]
  templates/AUTHORING-PROMPT.md → apps/web/src/pages/docs/[[...slug]].tsx

## Import Cycles
- None detected.

## Communities (111 total, 13 thin omitted)

### Community 0 - "pages.ts"
Cohesion: 0.07
Nodes (64): applied, changed, content, layout, nested, own, parked, slot (+56 more)

### Community 1 - "history-panel.tsx"
Cohesion: 0.67
Nodes (3): formatWhen(), HistoryPanel(), Revision

### Community 2 - "presets.ts"
Cohesion: 0.18
Nodes (41): Heading, bento(), body(), box(), button(), C, card(), ctaBanner() (+33 more)

### Community 3 - "inspector.tsx"
Cohesion: 0.12
Nodes (20): ALIGN_LABELS, AlignChoice, BezierEditor(), bezierValues(), CLICK_ACTIONS, ClickAction, Ctx, CurveValue (+12 more)

### Community 4 - "types.ts"
Cohesion: 0.04
Nodes (43): ASPECT_RATIOS, BgSize, BlendMode, BorderStyle, BREAKPOINT_CHAIN, BREAKPOINT_WIDTHS, BREAKPOINTS, ComponentSlotProps (+35 more)

### Community 5 - "CanvasElement"
Cohesion: 0.13
Nodes (23): AiDesignGenerator, AiDesignRequest, AiFocus, AiPanel(), AiRunEvent, Chat, key(), now() (+15 more)

### Community 6 - "ai-design/route.ts"
Cohesion: 0.07
Nodes (34): AiStreamEvent, attemptStructured(), Channel, childrenOf(), clearPage(), contentSchema, DEFAULT_THEME, describeSection() (+26 more)

### Community 7 - "DragSession"
Cohesion: 0.20
Nodes (3): DragSession, DropPlan, 2. registry.json

### Community 8 - "cascade.ts"
Cohesion: 0.12
Nodes (23): artboardOf(), draggedBox(), DropGeometry, edgeBand(), idOf(), LIVE, orderWithin(), resolveDrop() (+15 more)

### Community 9 - "web/package.json"
Cohesion: 0.05
Nodes (41): dependencies, framer-motion, marked, next, pagiera, react, react-dom, devDependencies (+33 more)

### Community 10 - "source.ts"
Cohesion: 0.13
Nodes (23): assertFetchableUrl(), BLOCKED_HOSTS, buildRequest(), DataSourceError, DEFAULT_REVALIDATE, EMPTY_CONTEXT, LoadOptions, loadSource() (+15 more)

### Community 11 - "editor/validate.ts"
Cohesion: 0.09
Nodes (31): CustomTag, DATA_SOURCE_NOT_FOUND_BEHAVIORS, DEFAULT_STATE_TRANSITION, ElementAttribute, FieldOption, INPUT_TYPES, STYLE_KEYS, URL_ATTRIBUTES (+23 more)

### Community 12 - "dsl.ts"
Cohesion: 0.07
Nodes (39): Align, ALIGNS, asBoolean(), asNumber(), BoxNode, BUTTON_KINDS, ButtonKind, ButtonNode (+31 more)

### Community 13 - "[[...slug]].tsx"
Cohesion: 0.10
Nodes (27): DocsCodeBlock(), highlighted(), KEYWORDS, DocsCommandMenu(), keyDown(), docLink(), DocsMarkdown(), render() (+19 more)

### Community 14 - "showcase.tsx"
Cohesion: 0.08
Nodes (39): metadata, ShowcasePage(), Arrow(), Mark(), projects, shader, Showcase(), customButton (+31 more)

### Community 15 - "page-render.tsx"
Cohesion: 0.14
Nodes (23): AiChanges(), display(), labels, cascadeOf(), isBand(), ElementTranslationKeys, RootStyle, bindPageContext() (+15 more)

### Community 16 - "example/package.json"
Cohesion: 0.05
Nodes (37): dependencies, next, pagiera, react, react-dom, devDependencies, @biomejs/biome, tailwindcss (+29 more)

### Community 17 - "ref_next"
Cohesion: 0.09
Nodes (21): nextConfig, nextConfig, ConversionFooter(), ConversionFooterProps, FooterHeading(), SocialLink(), Comparison, ComparisonRow (+13 more)

### Community 18 - "pagiera/package.json"
Cohesion: 0.05
Nodes (41): author, bin, pagiera, bugs, url, description, engines, node (+33 more)

### Community 19 - "localizedHref"
Cohesion: 0.16
Nodes (26): Codex + Claude development loop, Documentation is part of implementation, English and Turkish parity, ChoiceCard(), ComparisonView(), Icon(), templates, TemplatesSection() (+18 more)

### Community 20 - "theme.ts"
Cohesion: 0.16
Nodes (33): accentAsText(), alpha(), AXES, backdropFor(), clamp(), contrast(), CORNERS, DENSITY (+25 more)

### Community 21 - "create-forma.ts"
Cohesion: 0.07
Nodes (33): add(), art, button(), carousel, contact, document, elements, emphasis (+25 more)

### Community 22 - "Pagiera"
Cohesion: 0.15
Nodes (13): Client API, Dynamic routes and request data, Environment variables, Highlights, Installation, License, Lightweight editor, Package exports (+5 more)

### Community 23 - "site-templates.ts"
Cohesion: 0.14
Nodes (33): SKETCHES, addNocturneContactForm(), createNocturneShowcase(), createNocturneSiteTemplate(), enter(), nocturneInnerPage(), node(), responsive() (+25 more)

### Community 24 - "useI18n"
Cohesion: 0.17
Nodes (22): AiSection(), FeaturesSection(), HeroSection(), ProductDetails(), StudioSection(), WorkflowSection(), EASE, Reveal() (+14 more)

### Community 25 - "structured-data.ts"
Cohesion: 0.15
Nodes (25): localizeSchema(), Seo(), absoluteUrl(), IS_INDEXABLE_DEPLOYMENT, OG_IMAGE, REPO_URL, SITE_DESCRIPTION, SITE_LOCALE (+17 more)

### Community 26 - "package.json"
Cohesion: 0.06
Nodes (31): description, devDependencies, @biomejs/biome, typescript, engines, node, homepage, @biomejs/biome (+23 more)

### Community 27 - "editor/editor.tsx"
Cohesion: 0.05
Nodes (82): LumaMark(), PagieraMark(), Clipboard, ComponentAsset, ComponentAssetCards(), componentHasContent(), DragInfo, Editor() (+74 more)

### Community 28 - "published-page.tsx"
Cohesion: 0.12
Nodes (16): dynamic, handlers, maxDuration, dynamic, generateMetadata(), HomePage(), dynamic, generateMetadata() (+8 more)

### Community 29 - "src/index.ts"
Cohesion: 0.10
Nodes (29): 3. Design an editable website, PagieraAdapters, PagieraDataPreview, PagieraPageSummary, PagieraSaveResult, createDocument(), PagieraBreakpoint, PagieraDocument (+21 more)

### Community 30 - "compose.ts"
Cohesion: 0.10
Nodes (29): Builder, compose(), composeFragment(), composeSection(), Ctx, gridSteps(), make(), MEASURE (+21 more)

### Community 31 - "example/biome.json"
Cohesion: 0.07
Nodes (26): source, assist, actions, css, parser, next, react, files (+18 more)

### Community 32 - "web/biome.json"
Cohesion: 0.07
Nodes (26): source, assist, actions, css, parser, next, react, files (+18 more)

### Community 33 - "server-source.ts"
Cohesion: 0.13
Nodes (19): inspectMcpServer(), PagieraMcpServer, BUILTIN_TEMPLATE_IDS, BuiltinTemplateId, createPagieraRouteHandlers(), createPagieraServer(), getEditorBootstrap(), getPublishedDocument() (+11 more)

### Community 34 - "dependencies"
Cohesion: 0.07
Nodes (27): dependencies, ai, class-variance-authority, clsx, drizzle-orm, esbuild, @fontsource-variable/figtree, @iconify-json/lucide (+19 more)

### Community 35 - "site-bar.tsx"
Cohesion: 0.23
Nodes (10): IconName, paths, LanguageSwitcher(), LOCALES, getMegaMenus(), getNavLinks(), MegaLink, NavSection (+2 more)

### Community 36 - "guides/[slug].tsx"
Cohesion: 0.13
Nodes (17): GuideBlocks(), GuideBlockView(), Guide, GUIDE_SLUGS, GuideBlock, GUIDES, GuideSection, GuideStep (+9 more)

### Community 37 - "editor/style.ts"
Cohesion: 0.10
Nodes (29): AlignAction, alignElements(), Box, boxesOf(), DistributeAction, distributeElements(), baseOf(), chainFor() (+21 more)

### Community 38 - "faq.tsx"
Cohesion: 0.18
Nodes (13): ALL_FAQ, FAQ_GROUPS, FaqEntry, FaqGroup, ALL_FAQ_TR, FAQ_GROUPS_TR, productCapabilities, productFaq (+5 more)

### Community 39 - "template-catalog.ts"
Cohesion: 0.12
Nodes (19): getTemplateCatalog(), getTemplatePreviewDocument(), githubPath(), jsonCache, readGithubJson(), readLocalJson(), readTemplateJson(), Registry (+11 more)

### Community 40 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 41 - "web/scripts/check-i18n.cjs"
Cohesion: 0.11
Nodes (16): assert, cache, compareShape(), { createRequire }, { DOCS }, { DOCS_CATALOG_TR }, { DOCS_CONTENT_TR }, fs (+8 more)

### Community 42 - "ref_node_path"
Cohesion: 0.18
Nodes (5): run(), validate(), encoder, http, sse

### Community 43 - "exports"
Cohesion: 0.11
Nodes (19): import, types, exports, ./data, ./full, ./full.css, ./package.json, ./provider (+11 more)

### Community 44 - "Build and launch websites with Pagiera"
Cohesion: 0.13
Nodes (12): 2. Wire the server and studio, 4. Save safely and preview, 5. Publish / activate the website, Build and launch websites with Pagiera, Command-line workflow, Example user request an agent should fulfill, Understand the request, Verification and troubleshooting (+4 more)

### Community 45 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+9 more)

### Community 46 - "server.d.ts"
Cohesion: 0.11
Nodes (6): c, Server API, close(), PagieraServerConfig, pg, redis

### Community 47 - "expression.ts"
Cohesion: 0.18
Nodes (19): BINARY_PRECEDENCE, BLOCKED_KEYS, Callable, capList(), capString(), compare(), evaluate(), ExpressionError (+11 more)

### Community 48 - "Group"
Cohesion: 0.17
Nodes (30): BorderGroup(), ClickGroup(), CompositionGroup(), CurveFields(), EntranceGroup(), FillGroup(), FlexChildGroup(), fontOptionsFor() (+22 more)

### Community 49 - "pagiera-editor.tsx"
Cohesion: 0.21
Nodes (12): dynamic, EditorPage(), dynamic, EditorDocumentPage(), dynamic, EditorPanelPage(), EditorBootstrap, PagieraEditor() (+4 more)

### Community 50 - "layout.tsx"
Cohesion: 0.14
Nodes (14): figtree, geistMono, geistSans, manrope, metadata, pressStart2P, RootLayout(), syncopate (+6 more)

### Community 51 - "library.tsx"
Cohesion: 0.12
Nodes (25): BlockList(), CATEGORIES, DetailHeader(), ElementsThumbnail(), Empty(), Entry, LibraryHome(), LibraryPage (+17 more)

### Community 52 - "src/page.tsx"
Cohesion: 0.15
Nodes (22): ElementBody(), IconGlyph(), customTagOf(), markdownToHtml(), parser, ElementContent(), splitTextParts(), constraints() (+14 more)

### Community 53 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+8 more)

### Community 54 - "editor/actions.ts"
Cohesion: 0.07
Nodes (46): ACTION_ANIMATIONS, ACTION_DIRECTIONS, ACTION_STEP_KINDS, ACTION_TRIGGERS, ActionAnimation, ActionAnimationType, actionAttributes(), ActionDirection (+38 more)

### Community 55 - "templates-panel.tsx"
Cohesion: 0.11
Nodes (27): devicesFor(), FALLBACK_DEVICES, PreviewDevice, previewUrlFor(), TemplatePreview(), TemplatePreviewPage, TemplatePreviewStage(), useTemplatePreview() (+19 more)

### Community 56 - "custom.ts"
Cohesion: 0.21
Nodes (12): CarouselControl, carouselControlAttributes(), normalizeCarouselControl(), Disclosure, disclosureAttributes(), CUSTOM_TAGS, RESERVED_ATTRIBUTES, CUSTOM_TAG_SET (+4 more)

### Community 57 - "cn"
Cohesion: 0.13
Nodes (25): ChromeButton(), TOOL_SIZES, TOOL_TONES, ToolButton(), ToolTone, PanelAction(), PanelHeader(), PanelSearch() (+17 more)

### Community 58 - "check-docs.cjs"
Cohesion: 0.14
Nodes (12): cache, dir, { DOCS }, errors, fs, { getDocsContent }, load(), path (+4 more)

### Community 59 - "group.tsx"
Cohesion: 0.37
Nodes (9): Row(), ScrubInput(), HEIGHT_SIZE_OPTIONS, SIZE_OPTIONS, SizeChoice, FIELD, LABEL, LABEL_W (+1 more)

### Community 60 - "drag-session.ts"
Cohesion: 0.12
Nodes (13): DRAG_THRESHOLD, FlowInfo, flush(), flushAll(), idOf(), intersect(), later(), NO_OFFSET (+5 more)

### Community 61 - "build-extra.ts"
Cohesion: 0.28
Nodes (11): band(), builds, bundle(), Element, ledger(), main(), Palette, rise() (+3 more)

### Community 62 - "css.ts"
Cohesion: 0.05
Nodes (67): a, base, bouncy, childA, childB, css, custom, p (+59 more)

### Community 63 - "audit-responsive.ts"
Cohesion: 0.12
Nodes (17): SiteTemplateId, lines(), templateThumbnailSvg(), ThumbnailTemplate, xml(), DEFAULT_BREAKPOINTS, BUILTIN_IDS, failures (+9 more)

### Community 64 - "ContentTab"
Cohesion: 0.20
Nodes (15): AttributesEditor(), ContentTab(), FieldGroup(), HtmlGroup(), IconGroup(), ImageUpload(), InstanceGroup(), OptionsEditor() (+7 more)

### Community 65 - "SelectInput"
Cohesion: 0.25
Nodes (17): ActionsGroup(), AnimationFields(), blankStep(), OverlayGroup(), Props, StepList(), CarouselControlGroup(), FieldDesign() (+9 more)

### Community 66 - "parseStyle"
Cohesion: 0.18
Nodes (17): borderSide(), cornerRadius(), cssValue(), customCss(), customJs(), horizontalMargin(), lineHeightValue(), num() (+9 more)

### Community 67 - "shaders.ts"
Cohesion: 0.19
Nodes (15): element, html, [restored], overlayPreset(), add(), disclosureChildren(), child(), normalizeDisclosure() (+7 more)

### Community 68 - "compilerOptions"
Cohesion: 0.20
Nodes (9): compilerOptions, declaration, declarationMap, noEmit, outDir, rootDir, sourceMap, extends (+1 more)

### Community 69 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, build:full, build:full-css, check, copy:full-types, copy:styles, prepack

### Community 70 - "icons-panel.tsx"
Cohesion: 0.23
Nodes (10): IconsPanel(), cache, ICON_PACKS, iconNames(), IconPack, iconSvg(), loaders, loadIconPack() (+2 more)

### Community 71 - "Pagiera Template Authoring Prompt"
Cohesion: 0.12
Nodes (15): Pagiera package example, Local package example, Publishing pages, 10. Data sources, Repeat and bindings, 11. Shared components, 12. Hard limits and silent drops, 13. Checklist before you emit, 14. Design direction (+7 more)

### Community 72 - "template-registry.ts"
Cohesion: 0.26
Nodes (11): FALLBACK_TEMPLATE_REGISTRY, fetchJson(), isRegistry(), isSameOriginRegistry(), loadTemplateRegistry(), memory, readCache(), TemplatePreview (+3 more)

### Community 73 - "test-text-effects.ts"
Cohesion: 0.29
Nodes (7): disabled, el, html, rolled, normalizeTextEffects(), TextEffects, TextEffectsContent()

### Community 74 - "devDependencies"
Cohesion: 0.33
Nodes (6): devDependencies, @types/node, @types/pg, @types/react, @types/react-dom, typescript

### Community 75 - "check-docs.mjs"
Cohesion: 0.33
Nodes (4): checker, elementTypes, here, result

### Community 76 - "format.ts"
Cohesion: 0.20
Nodes (19): applyText(), DATE_PRESETS, decorate(), formatDate(), formatDatePattern(), formatNumber(), formatValue(), isEmpty() (+11 more)

### Community 77 - "sitemap.xml.ts"
Cohesion: 0.33
Nodes (5): COMPARISON_SLUGS, LOCALES, body(), getServerSideProps(), ROUTES

### Community 78 - "test-binding-format.ts"
Cohesion: 0.20
Nodes (9): row, t(), isPlainPath(), bindElement(), bindTemplate(), PageContext, Row, safeResolvedUrl() (+1 more)

### Community 79 - "Contributing to Pagiera"
Cohesion: 0.40
Nodes (4): Before opening a pull request, Commit and pull request guidance, Contributing to Pagiera, Development

### Community 80 - "AI workspace"
Cohesion: 0.40
Nodes (4): AI workspace, Host configuration, Implemented, Not yet implemented

### Community 81 - "web/README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 82 - "PULL_REQUEST_TEMPLATE.md"
Cohesion: 0.50
Nodes (3): Summary, Verification, Visual changes

### Community 83 - "full-editor.d.ts"
Cohesion: 0.29
Nodes (6): PagieraMutationResult, PagieraStudioAdapters, PagieraStudioDocument, PagieraStudioPage, PagieraStudioProps, PagieraTranslations

### Community 84 - "repository"
Cohesion: 0.50
Nodes (4): repository, directory, type, url

### Community 85 - "binding-format.tsx"
Cohesion: 0.22
Nodes (10): BindingFormatFields(), DATE_STYLES, editorLocale(), KINDS, LOCALES, tidy(), TIME_ZONES, TRANSFORMS (+2 more)

### Community 86 - "Security policy"
Cohesion: 0.50
Nodes (3): Deployment responsibility, Reporting a vulnerability, Security policy

### Community 87 - "Next.js setup"
Cohesion: 0.33
Nodes (6): 1. Import the editor stylesheet, 2. Add the font provider, 3. Mount the backend, 4. Load editor data on the server, 5. Mount the studio, Next.js setup

### Community 89 - "Troubleshooting"
Cohesion: 0.33
Nodes (6): AI generation fails, CSS says `@import` must precede other rules, PostgreSQL or Redis fails, Published API data is missing from HTML, `server.getEditorBootstrap is not a function`, Troubleshooting

### Community 92 - "build-full.mjs"
Cohesion: 0.40
Nodes (3): internalRoot, packageRoot, esbuild

### Community 95 - "peerDependencies"
Cohesion: 0.67
Nodes (3): peerDependencies, react, react-dom

### Community 96 - "createPagieraClient"
Cohesion: 0.48
Nodes (5): createPagieraClient(), jsonRequest(), PagieraClientOptions, PagieraRequestError, streamAi()

### Community 97 - "data-modal.tsx"
Cohesion: 0.18
Nodes (17): DataSourceModal(), Failure, FailureView(), formatCell(), listsIn(), PairTable(), ResponseView(), SourcePreview (+9 more)

### Community 98 - "Pagiera template registry"
Cohesion: 0.50
Nodes (3): Pagiera template registry, Publishing a template, Structure

### Community 106 - "menu.tsx"
Cohesion: 0.33
Nodes (7): MenuItem(), MenuLabel(), MenuLink(), rowContent(), RowProps, PopupSurface(), motion

### Community 108 - "test-ai-scope.ts"
Cohesion: 0.15
Nodes (12): child, elements, isolated, other, result, root, targeted, POST() (+4 more)

### Community 109 - "build-full-css.mjs"
Cohesion: 0.29
Nodes (4): from, packageRoot, scope, postcss

### Community 111 - "use-canvas-view.ts"
Cohesion: 0.40
Nodes (5): clamp(), MAX_ZOOM, MIN_ZOOM, useCanvasView(), ZOOM_STEPS

## Knowledge Gaps
- **45 isolated node(s):** `next`, `pagiera`, `react`, `react-dom`, `@biomejs/biome` (+40 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 880 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@tabler/icons-react` connect `CanvasElement` to `data-modal.tsx`, `history-panel.tsx`, `inspector.tsx`, `icons-panel.tsx`, `group.tsx`, `menu.tsx`, `pagiera/package.json`, `library.tsx`, `templates-panel.tsx`, `cn`, `editor/editor.tsx`, `src/index.ts`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `next`, `pagiera`, `react` to the rest of the system?**
  _45 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `pages.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06729264475743349 - nodes in this community are weakly interconnected._
- **Why does `Pagiera` connect `Pagiera` to `Pagiera Template Authoring Prompt`, `Build and launch websites with Pagiera`, `server.d.ts`, `Next.js setup`, `Troubleshooting`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Should `inspector.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11904761904761904 - nodes in this community are weakly interconnected._
- **Why does `CanvasElement` connect `compose.ts` to `pages.ts`, `presets.ts`, `inspector.tsx`, `types.ts`, `CanvasElement`, `ai-design/route.ts`, `cascade.ts`, `source.ts`, `editor/validate.ts`, `showcase.tsx`, `page-render.tsx`, `create-forma.ts`, `site-templates.ts`, `editor/editor.tsx`, `src/index.ts`, `editor/style.ts`, `library.tsx`, `editor/actions.ts`, `templates-panel.tsx`, `css.ts`, `audit-responsive.ts`, `SelectInput`, `shaders.ts`, `icons-panel.tsx`, `test-binding-format.ts`, `test-ai-scope.ts`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Should `types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.043478260869565216 - nodes in this community are weakly interconnected._