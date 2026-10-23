# Graph Report - pagiera  (2026-10-23)

## Corpus Check
- 248 files · ~779,264 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: .css 5, (none) 4, .example 3)

## Summary
- 2135 nodes · 5215 edges · 114 communities (100 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 70 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `89be9334`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- pages.ts
- editor/editor.tsx
- presets.ts
- motion.ts
- types.ts
- ai-panel.tsx
- ai-design/route.ts
- DragSession
- Editor
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
- parts.tsx
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
- ref_node_fs
- exports
- .home
- compilerOptions
- server.d.ts
- group.tsx
- Group
- pagiera-editor.tsx
- layout.tsx
- library.tsx
- src/page.tsx
- compilerOptions
- RootStyle
- resolveStyle
- custom.ts
- ref_react
- check-docs.cjs
- use-editor.ts
- drag-session.ts
- build-extra.ts
- css.ts
- audit-responsive.ts
- ContentTab
- CanvasElement
- test-text-effects.ts
- shaders.ts
- compilerOptions
- scripts
- icons-panel.tsx
- test-motion.ts
- full-editor.d.ts
- check-docs.mjs
- devDependencies
- README.md
- EntranceGroup
- drop-target.ts
- use-canvas-view.ts
- Contributing to Pagiera
- AI workspace
- web/README.md
- PULL_REQUEST_TEMPLATE.md
- marquee-runtime.tsx
- runtime.d.ts
- shaderDocument
- Security policy
- Next.js setup
- mcp-test-server.mjs
- Troubleshooting
- example/AGENTS.md
- example/postcss.config.mjs
- icon.tsx
- web/AGENTS.md
- web/postcss.config.mjs
- parseRootStyle
- createPagieraClient
- ref_node_assert
- Pagiera template registry
- assets.d.ts
- { GET, POST, PUT, PATCH, DELETE }
- PagieraStudio
- RenderedPage
- motion-preview.ts
- translate.ts
- sitemap.xml.ts
- build-full-css.mjs
- build-full.mjs
- repository
- mountCarousel
- peerDependencies

## God Nodes (most connected - your core abstractions)
1. `Editor()` - 107 edges
2. `useI18n()` - 66 edges
3. `localizedHref()` - 47 edges
4. `Icon()` - 43 edges
5. `CanvasElement` - 43 edges
6. `parseElements()` - 38 edges
7. `resolveStyle()` - 36 edges
8. `cn()` - 32 edges
9. `Group()` - 31 edges
10. `stylesheetFor()` - 31 edges

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

## Communities (114 total, 14 thin omitted)

### Community 0 - "pages.ts"
Cohesion: 0.07
Nodes (64): applied, changed, content, layout, nested, own, parked, slot (+56 more)

### Community 1 - "editor/editor.tsx"
Cohesion: 0.06
Nodes (33): Clipboard, ComponentAsset, DragInfo, EditorAdapters, EditorPage, EMPTY_CHILDREN, INSERT_VIEWS, InsertView (+25 more)

### Community 2 - "presets.ts"
Cohesion: 0.18
Nodes (41): Heading, bento(), body(), box(), button(), C, card(), ctaBanner() (+33 more)

### Community 3 - "motion.ts"
Cohesion: 0.14
Nodes (15): AnimationLayer, clamp(), curves, frameToCss(), GEOMETRY, LEGACY_STATE_TRANSITION, LOOP_KEYFRAMES, loopAnimation() (+7 more)

### Community 4 - "types.ts"
Cohesion: 0.04
Nodes (61): ALIGN_LABELS, AlignChoice, BezierEditor(), bezierValues(), CLICK_ACTIONS, ClickAction, Ctx, CurveValue (+53 more)

### Community 5 - "ai-panel.tsx"
Cohesion: 0.11
Nodes (25): AiDesignGenerator, AiDesignRequest, AiFocus, AiPanel(), AiRunEvent, Chat, key(), now() (+17 more)

### Community 6 - "ai-design/route.ts"
Cohesion: 0.06
Nodes (37): AiStreamEvent, attemptStructured(), Channel, childrenOf(), clearPage(), contentSchema, DEFAULT_THEME, describeSection() (+29 more)

### Community 7 - "DragSession"
Cohesion: 0.16
Nodes (4): DragSession, intersect(), DropPlan, 2. registry.json

### Community 8 - "Editor"
Cohesion: 0.09
Nodes (40): SourcePreviewer, DataPanel(), hostOf(), SourceSample, ComponentAssetCards(), componentHasContent(), Editor(), isEditorTab() (+32 more)

### Community 9 - "web/package.json"
Cohesion: 0.05
Nodes (41): dependencies, framer-motion, marked, next, pagiera, react, react-dom, devDependencies (+33 more)

### Community 10 - "source.ts"
Cohesion: 0.09
Nodes (32): DataSourceModal(), Failure, FailureView(), formatCell(), PairTable(), ResponseView(), SourcePreview, Tab (+24 more)

### Community 11 - "editor/validate.ts"
Cohesion: 0.09
Nodes (37): CustomTag, DATA_SOURCE_NOT_FOUND_BEHAVIORS, DEFAULT_STATE_TRANSITION, ELEMENT_TYPES, ElementAttribute, FieldOption, INPUT_TYPES, STYLE_KEYS (+29 more)

### Community 12 - "dsl.ts"
Cohesion: 0.06
Nodes (42): Align, ALIGNS, asBoolean(), asNumber(), BoxNode, ButtonKind, ButtonNode, childArray() (+34 more)

### Community 13 - "[[...slug]].tsx"
Cohesion: 0.10
Nodes (27): DocsCodeBlock(), highlighted(), KEYWORDS, DocsCommandMenu(), keyDown(), docLink(), DocsMarkdown(), render() (+19 more)

### Community 14 - "showcase.tsx"
Cohesion: 0.27
Nodes (10): metadata, ShowcasePage(), Arrow(), Mark(), projects, shader, Showcase(), CarouselEditor() (+2 more)

### Community 15 - "page-render.tsx"
Cohesion: 0.24
Nodes (15): readBinding(), isBand(), bindElement(), bindPageContext(), bindTemplate(), PageContext, Row, rowsFor() (+7 more)

### Community 16 - "example/package.json"
Cohesion: 0.05
Nodes (37): dependencies, next, pagiera, react, react-dom, devDependencies, @biomejs/biome, tailwindcss (+29 more)

### Community 17 - "ref_next"
Cohesion: 0.09
Nodes (21): nextConfig, nextConfig, ConversionFooter(), ConversionFooterProps, FooterHeading(), SocialLink(), Comparison, ComparisonRow (+13 more)

### Community 18 - "pagiera/package.json"
Cohesion: 0.05
Nodes (43): author, bin, pagiera, bugs, url, description, engines, node (+35 more)

### Community 19 - "localizedHref"
Cohesion: 0.16
Nodes (26): Codex + Claude development loop, Documentation is part of implementation, English and Turkish parity, ChoiceCard(), ComparisonView(), Icon(), templates, TemplatesSection() (+18 more)

### Community 20 - "theme.ts"
Cohesion: 0.14
Nodes (32): accentAsText(), AXES, Backdrop, BACKDROPS, clamp(), contrast(), CORNERS, DENSITY (+24 more)

### Community 21 - "create-forma.ts"
Cohesion: 0.07
Nodes (33): add(), art, button(), carousel, contact, document, elements, emphasis (+25 more)

### Community 22 - "Pagiera"
Cohesion: 0.15
Nodes (13): Client API, Dynamic routes and request data, Environment variables, Highlights, Installation, License, Lightweight editor, Package exports (+5 more)

### Community 23 - "site-templates.ts"
Cohesion: 0.18
Nodes (31): addNocturneContactForm(), createNocturneShowcase(), createNocturneSiteTemplate(), enter(), nocturneInnerPage(), node(), responsive(), SiteTemplatePage (+23 more)

### Community 24 - "useI18n"
Cohesion: 0.17
Nodes (22): AiSection(), FeaturesSection(), HeroSection(), ProductDetails(), StudioSection(), WorkflowSection(), EASE, Reveal() (+14 more)

### Community 25 - "structured-data.ts"
Cohesion: 0.15
Nodes (25): localizeSchema(), Seo(), absoluteUrl(), IS_INDEXABLE_DEPLOYMENT, OG_IMAGE, REPO_URL, SITE_DESCRIPTION, SITE_LOCALE (+17 more)

### Community 26 - "package.json"
Cohesion: 0.06
Nodes (31): description, devDependencies, @biomejs/biome, typescript, engines, node, homepage, @biomejs/biome (+23 more)

### Community 27 - "parts.tsx"
Cohesion: 0.07
Nodes (37): Breadcrumbs(), BreakpointRow(), ContextMenu(), CORNERS, ELEMENT_GROUPS, ElementsPanel(), HANDLE_SPOTS, LayersPanel() (+29 more)

### Community 28 - "published-page.tsx"
Cohesion: 0.12
Nodes (16): dynamic, handlers, maxDuration, dynamic, generateMetadata(), HomePage(), dynamic, generateMetadata() (+8 more)

### Community 29 - "src/index.ts"
Cohesion: 0.14
Nodes (23): 3. Design an editable website, PagieraAdapters, PagieraDataPreview, PagieraPageSummary, PagieraSaveResult, createDocument(), PagieraBreakpoint, PagieraDocument (+15 more)

### Community 30 - "compose.ts"
Cohesion: 0.18
Nodes (20): Builder, compose(), composeFragment(), composeSection(), Ctx, gridSteps(), make(), MEASURE (+12 more)

### Community 31 - "example/biome.json"
Cohesion: 0.07
Nodes (26): source, assist, actions, css, parser, next, react, files (+18 more)

### Community 32 - "web/biome.json"
Cohesion: 0.07
Nodes (26): source, assist, actions, css, parser, next, react, files (+18 more)

### Community 33 - "server-source.ts"
Cohesion: 0.15
Nodes (18): inspectMcpServer(), PagieraMcpServer, BUILTIN_TEMPLATE_IDS, BuiltinTemplateId, createPagieraRouteHandlers(), createPagieraServer(), getEditorBootstrap(), getPublishedDocument() (+10 more)

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
Cohesion: 0.15
Nodes (16): ALIGN_CONTENT_MAP, ALIGN_MAP, ALIGN_SELF_MAP, applySize(), backgroundColorOf(), BoxContext, clearOverrides(), JUSTIFY_MAP (+8 more)

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

### Community 43 - "exports"
Cohesion: 0.11
Nodes (19): import, types, exports, ./data, ./full, ./full.css, ./package.json, ./provider (+11 more)

### Community 44 - ".home"
Cohesion: 0.09
Nodes (22): Pagiera package example, 4. Save safely and preview, 5. Publish / activate the website, Build and launch websites with Pagiera, Command-line workflow, Example user request an agent should fulfill, Understand the request, Verification and troubleshooting (+14 more)

### Community 45 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+9 more)

### Community 46 - "server.d.ts"
Cohesion: 0.11
Nodes (6): c, Server API, close(), PagieraServerConfig, pg, redis

### Community 47 - "group.tsx"
Cohesion: 0.30
Nodes (11): Field(), Row(), ScrubInput(), HEIGHT_SIZE_OPTIONS, SIZE_OPTIONS, SizeChoice, SizeField(), FIELD (+3 more)

### Community 48 - "Group"
Cohesion: 0.22
Nodes (29): BorderGroup(), CarouselControlGroup(), ClickGroup(), CompositionGroup(), FieldDesign(), FieldGroup(), FlexChildGroup(), fontOptionsFor() (+21 more)

### Community 49 - "pagiera-editor.tsx"
Cohesion: 0.21
Nodes (12): dynamic, EditorPage(), dynamic, EditorDocumentPage(), dynamic, EditorPanelPage(), EditorBootstrap, PagieraEditor() (+4 more)

### Community 50 - "layout.tsx"
Cohesion: 0.14
Nodes (14): figtree, geistMono, geistSans, manrope, metadata, pressStart2P, RootLayout(), syncopate (+6 more)

### Community 51 - "library.tsx"
Cohesion: 0.11
Nodes (26): BlockList(), CATEGORIES, DetailHeader(), ElementsThumbnail(), Empty(), Entry, LibraryHome(), LibraryPage (+18 more)

### Community 52 - "src/page.tsx"
Cohesion: 0.23
Nodes (17): customTagOf(), constraints(), declarationMap(), ElementContent(), fillOf(), formHeaders(), interactionDeclarationMap(), pageTransitionCss() (+9 more)

### Community 53 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+8 more)

### Community 54 - "RootStyle"
Cohesion: 0.12
Nodes (22): devicesFor(), FALLBACK_DEVICES, PreviewDevice, previewUrlFor(), TemplatePreview(), TemplatePreviewPage, TemplatePreviewStage(), useTemplatePreview() (+14 more)

### Community 55 - "resolveStyle"
Cohesion: 0.15
Nodes (22): AiChanges(), display(), labels, baseOf(), cascadeOf(), chainCache, chainFor(), DEFAULT_CASCADE (+14 more)

### Community 56 - "custom.ts"
Cohesion: 0.18
Nodes (14): customButton, CarouselControl, carouselControlAttributes(), normalizeCarouselControl(), Disclosure, disclosureAttributes(), normalizeDisclosure(), CUSTOM_TAGS (+6 more)

### Community 57 - "ref_react"
Cohesion: 0.08
Nodes (40): INSTALL_STEPS, InstallStage, RegistryState, TemplatesPanel(), templateThumbnailUrl(), wait(), ChromeButton(), TOOL_SIZES (+32 more)

### Community 58 - "check-docs.cjs"
Cohesion: 0.14
Nodes (12): cache, dir, { DOCS }, errors, fs, { getDocsContent }, load(), path (+4 more)

### Community 59 - "use-editor.ts"
Cohesion: 0.17
Nodes (15): Action, EditorDocument, EditorDocumentSaver, EditorSaveResult, HistoryState, pushPast(), reducer(), SaveStatus (+7 more)

### Community 60 - "drag-session.ts"
Cohesion: 0.14
Nodes (12): DRAG_THRESHOLD, FlowInfo, flush(), flushAll(), idOf(), later(), NO_OFFSET, Offset (+4 more)

### Community 61 - "build-extra.ts"
Cohesion: 0.28
Nodes (11): band(), builds, bundle(), Element, ledger(), main(), Palette, rise() (+3 more)

### Community 62 - "css.ts"
Cohesion: 0.16
Nodes (22): animationDeclarations(), loopAmount(), rootStyleToCss(), splitBand(), classFor(), declarationsToCss(), DEFAULT_PAGE_FONT, ENTRANCE_CSS (+14 more)

### Community 63 - "audit-responsive.ts"
Cohesion: 0.12
Nodes (17): SiteTemplateId, lines(), templateThumbnailSvg(), ThumbnailTemplate, xml(), DEFAULT_BREAKPOINTS, BUILTIN_IDS, failures (+9 more)

### Community 64 - "ContentTab"
Cohesion: 0.22
Nodes (14): AttributesEditor(), ContentTab(), HtmlGroup(), ImageUpload(), InstanceGroup(), stickyBlocker(), TranslationGroup(), LayerRow() (+6 more)

### Community 65 - "CanvasElement"
Cohesion: 0.14
Nodes (14): child, elements, isolated, other, result, root, targeted, POST() (+6 more)

### Community 66 - "test-text-effects.ts"
Cohesion: 0.29
Nodes (6): disabled, el, html, rolled, normalizeTextEffects(), TextEffects

### Community 67 - "shaders.ts"
Cohesion: 0.22
Nodes (9): element, html, [restored], FieldAppearance, fieldAppearanceCss(), normalizeFieldAppearance(), normalizeShader(), SHADER_PRESETS (+1 more)

### Community 68 - "compilerOptions"
Cohesion: 0.20
Nodes (9): compilerOptions, declaration, declarationMap, noEmit, outDir, rootDir, sourceMap, extends (+1 more)

### Community 69 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, build:full, build:full-css, check, copy:full-types, copy:styles, prepack

### Community 70 - "icons-panel.tsx"
Cohesion: 0.23
Nodes (10): IconsPanel(), cache, ICON_PACKS, iconNames(), IconPack, iconSvg(), loaders, loadIconPack() (+2 more)

### Community 71 - "test-motion.ts"
Cohesion: 0.13
Nodes (14): a, base, bouncy, childA, childB, css, custom, p (+6 more)

### Community 72 - "full-editor.d.ts"
Cohesion: 0.29
Nodes (6): PagieraMutationResult, PagieraStudioAdapters, PagieraStudioDocument, PagieraStudioPage, PagieraStudioProps, PagieraTranslations

### Community 73 - "check-docs.mjs"
Cohesion: 0.33
Nodes (4): checker, elementTypes, here, result

### Community 74 - "devDependencies"
Cohesion: 0.33
Nodes (6): devDependencies, @types/node, @types/pg, @types/react, @types/react-dom, typescript

### Community 75 - "README.md"
Cohesion: 0.29
Nodes (4): License, Monorepo, Quick start, Why Pagiera?

### Community 76 - "EntranceGroup"
Cohesion: 0.20
Nodes (16): CurveFields(), EntranceGroup(), FillGroup(), Inspector(), InteractTab(), LoopGroup(), makeOverridable(), PressGroup() (+8 more)

### Community 77 - "drop-target.ts"
Cohesion: 0.35
Nodes (10): artboardOf(), draggedBox(), DropGeometry, edgeBand(), idOf(), LIVE, orderWithin(), resolveDrop() (+2 more)

### Community 78 - "use-canvas-view.ts"
Cohesion: 0.40
Nodes (5): clamp(), MAX_ZOOM, MIN_ZOOM, useCanvasView(), ZOOM_STEPS

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

### Community 83 - "marquee-runtime.tsx"
Cohesion: 0.25
Nodes (9): MarqueePreview(), InteractiveSettings, mountDisclosures(), MarqueeContent(), mountMarquees(), MarqueeRuntime(), noSubscription(), PageScript() (+1 more)

### Community 85 - "shaderDocument"
Cohesion: 0.25
Nodes (8): ElementBody(), IconGlyph(), shaderDocument(), markdownToHtml(), parser, ElementContent(), splitTextParts(), TextEffectsContent()

### Community 86 - "Security policy"
Cohesion: 0.50
Nodes (3): Deployment responsibility, Reporting a vulnerability, Security policy

### Community 87 - "Next.js setup"
Cohesion: 0.33
Nodes (6): 1. Import the editor stylesheet, 2. Add the font provider, 3. Mount the backend, 4. Load editor data on the server, 5. Mount the studio, Next.js setup

### Community 89 - "Troubleshooting"
Cohesion: 0.33
Nodes (6): AI generation fails, CSS says `@import` must precede other rules, PostgreSQL or Redis fails, Published API data is missing from HTML, `server.getEditorBootstrap is not a function`, Troubleshooting

### Community 92 - "icon.tsx"
Cohesion: 0.33
Nodes (5): GlyphComponent, ICON_CATALOG, ICON_COMPONENTS, IconCatalogEntry, IconCategory

### Community 95 - "parseRootStyle"
Cohesion: 0.24
Nodes (10): customCss(), customJs(), imageUrl(), parseAttributes(), parseComponentProps(), parseRootStyle(), safeImageSource(), safeUrl() (+2 more)

### Community 96 - "createPagieraClient"
Cohesion: 0.36
Nodes (6): 2. Wire the server and studio, createPagieraClient(), jsonRequest(), PagieraClientOptions, PagieraRequestError, streamAi()

### Community 97 - "ref_node_assert"
Cohesion: 0.33
Nodes (3): encoder, http, sse

### Community 98 - "Pagiera template registry"
Cohesion: 0.50
Nodes (3): Pagiera template registry, Publishing a template, Structure

### Community 106 - "motion-preview.ts"
Cohesion: 0.43
Nodes (7): animate(), playAllEntrances(), playEntrance(), entranceFrom(), entranceTiming(), entranceTo(), MotionFrame

### Community 107 - "translate.ts"
Cohesion: 0.29
Nodes (7): ElementTranslationKeys, lookupTranslation(), resolverFor(), TRANSLATABLE_FIELDS, translationKeys(), TranslationResolver, Translations

### Community 108 - "sitemap.xml.ts"
Cohesion: 0.33
Nodes (5): COMPARISON_SLUGS, LOCALES, body(), getServerSideProps(), ROUTES

### Community 109 - "build-full-css.mjs"
Cohesion: 0.29
Nodes (4): from, packageRoot, scope, postcss

### Community 110 - "build-full.mjs"
Cohesion: 0.40
Nodes (3): internalRoot, packageRoot, esbuild

### Community 111 - "repository"
Cohesion: 0.50
Nodes (4): repository, directory, type, url

### Community 112 - "mountCarousel"
Cohesion: 0.67
Nodes (3): mountCarousel(), schedule(), show()

### Community 113 - "peerDependencies"
Cohesion: 0.67
Nodes (3): peerDependencies, react, react-dom

## Knowledge Gaps
- **45 isolated node(s):** `next`, `pagiera`, `react`, `react-dom`, `@biomejs/biome` (+40 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 848 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DragSession` connect `DragSession` to `Editor`, `editor/editor.tsx`, `drag-session.ts`, `.home`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **What connects `next`, `pagiera`, `react` to the rest of the system?**
  _45 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `pages.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06690140845070422 - nodes in this community are weakly interconnected._
- **Why does `@tabler/icons-react` connect `ai-panel.tsx` to `editor/editor.tsx`, `types.ts`, `icons-panel.tsx`, `Editor`, `source.ts`, `group.tsx`, `pagiera/package.json`, `library.tsx`, `ref_react`, `parts.tsx`, `icon.tsx`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Should `editor/editor.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06341463414634146 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `dependencies` to `pagiera/package.json`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Should `motion.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14166666666666666 - nodes in this community are weakly interconnected._