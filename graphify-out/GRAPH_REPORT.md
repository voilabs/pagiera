# Graph Report - pagiera  (2026-11-01)

## Corpus Check
- 291 files · ~469,025 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 15 file(s) not represented in the graph (top: .css 5, (none) 4, .example 3)

## Summary
- 2624 nodes · 5619 edges · 173 communities (154 shown, 19 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 93 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fcaf35f0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- pages.ts
- action-graph.ts
- presets.ts
- check-docs.cjs
- types.ts
- CanvasElement
- ai-design/route.ts
- DragSession
- editor/editor.tsx
- web/package.json
- source.ts
- editor/validate.ts
- dsl.ts
- docs-catalog.ts
- showcase.tsx
- page-render.tsx
- example/package.json
- en/data-binding.mdx
- pagiera/package.json
- en/deployment.mdx
- theme.ts
- create-forma.ts
- Pagiera
- site-templates.ts
- variables-panel.tsx
- documentation-page.tsx
- package.json
- parts.tsx
- published-page.tsx
- src/index.ts
- compose.ts
- example/biome.json
- web/biome.json
- server-source.ts
- dependencies
- test-keyframes.ts
- docs-source.ts
- keyframes.ts
- SliderInput
- dependencies
- compilerOptions
- motion-timeline.tsx
- exports
- .home
- compilerOptions
- server.d.ts
- expression.ts
- inspector.tsx
- pagiera-editor.tsx
- layout.tsx
- library.tsx
- src/page.tsx
- compilerOptions
- editor/actions.ts
- ref_react
- custom.ts
- ref_react
- test-motion.ts
- css.ts
- drag-session.ts
- build-extra.ts
- cascade.ts
- ref_node_fs
- Group
- scripts
- motion-editor.tsx
- shaders.ts
- compilerOptions
- scripts
- icons-panel.tsx
- effect-presets.ts
- ref_react
- test-text-effects.ts
- devDependencies
- custom-animation.ts
- format.ts
- render/actions.ts
- test-binding-format.ts
- Contributing to Pagiera
- AI workspace
- web/README.md
- PULL_REQUEST_TEMPLATE.md
- templates-panel.tsx
- repository
- en/document-model.mdx
- Security policy
- Next.js setup
- mcp-test-server.mjs
- Troubleshooting
- example/AGENTS.md
- example/postcss.config.mjs
- interactive.ts
- web/AGENTS.md
- web/postcss.config.mjs
- peerDependencies
- binding-format.tsx
- data-modal.tsx
- Pagiera template registry
- assets.d.ts
- { GET, POST, PUT, PATCH, DELETE }
- PagieraStudio
- RenderedPage
- scripts/check-i18n.cjs
- icon.tsx
- ref_node_assert
- createPagieraClient
- tree.ts
- README.md
- full-editor.d.ts
- docs-layout.tsx
- wiggledAt
- settings-nav.tsx
- en/motion-editor.mdx
- en/security.mdx
- build-full-css.mjs
- tr/motion-editor.mdx
- ref_next
- tr/security.mdx
- arrange.ts
- marquee-runtime.tsx
- en/action-workflow.mdx
- en/nextjs-setup.mdx
- tr/action-workflow.mdx
- tr/nextjs-setup.mdx
- devDependencies
- test-cli.mjs
- en/agents.mdx
- en/components-layouts.mdx
- en/fonts-assets.mdx
- en/forms.mdx
- en/interactions.mdx
- en/troubleshooting.mdx
- tr/agents.mdx
- tr/components-layouts.mdx
- tr/fonts-assets.mdx
- tr/forms.mdx
- tr/interactions.mdx
- tr/troubleshooting.mdx
- en/blocks.mdx
- en/cli.mdx
- en/getting-started.mdx
- en/publishing.mdx
- en/revisions.mdx
- en/studio.mdx
- en/templates.mdx
- tr/blocks.mdx
- tr/cli.mdx
- tr/getting-started.mdx
- tr/publishing.mdx
- tr/revisions.mdx
- tr/templates.mdx
- source.config.ts
- en/ai-mcp.mdx
- en/architecture.mdx
- en/responsive-design.mdx
- tr/ai-mcp.mdx
- tr/architecture.mdx
- tr/responsive-design.mdx
- Website and inline documentation
- easeAt
- Unreleased
- en/index.mdx
- Unreleased
- tr/index.mdx
- en/translations.mdx
- tr/translations.mdx
- StepList
- docs-catalog-tr.ts

## God Nodes (most connected - your core abstractions)
1. `Editor()` - 121 edges
2. `CanvasElement` - 48 edges
3. `parseElements()` - 44 edges
4. `Group()` - 37 edges
5. `resolveStyle()` - 36 edges
6. `stylesheetFor()` - 36 edges
7. `SelectInput()` - 35 edges
8. `cn()` - 32 edges
9. `MotionTimeline()` - 31 edges
10. `createElement()` - 30 edges

## Surprising Connections (you probably didn't know these)
- `A native document` --references--> `createDocument()`  [INFERRED]
  apps/web/content/docs/en/document-model.mdx → packages/pagiera/src/document.ts
- `Yerel belge yapısı` --references--> `createDocument()`  [INFERRED]
  apps/web/content/docs/tr/document-model.mdx → packages/pagiera/src/document.ts
- `Find your tools` --references--> `editorPath()`  [INFERRED]
  apps/web/content/docs/en/studio.mdx → packages/pagiera/src/editor-panels.ts
- `The editor has no styles` --references--> `editorPath()`  [INFERRED]
  apps/web/content/docs/en/troubleshooting.mdx → packages/pagiera/src/editor-panels.ts
- `Düzenleyicide stiller görünmüyor` --references--> `editorPath()`  [INFERRED]
  apps/web/content/docs/tr/troubleshooting.mdx → packages/pagiera/src/editor-panels.ts

## Import Cycles
- None detected.

## Communities (173 total, 19 thin omitted)

### Community 0 - "pages.ts"
Cohesion: 0.07
Nodes (65): applied, changed, content, layout, nested, own, parked, slot (+57 more)

### Community 1 - "action-graph.ts"
Cohesion: 0.08
Nodes (40): every, graph, ActionGraphEditor(), CATEGORY, EMPTY, Gesture, GraphButton(), Layer (+32 more)

### Community 2 - "presets.ts"
Cohesion: 0.22
Nodes (36): bento(), body(), box(), button(), C, card(), ctaBanner(), ctaNewsletter() (+28 more)

### Community 3 - "check-docs.cjs"
Cohesion: 0.25
Nodes (7): assert, dir, esbuild, fs, path, root, routes

### Community 4 - "types.ts"
Cohesion: 0.05
Nodes (37): ASPECT_RATIOS, BgSize, BlendMode, BorderStyle, BREAKPOINT_CHAIN, BREAKPOINT_WIDTHS, BREAKPOINTS, ComponentSlotProps (+29 more)

### Community 5 - "CanvasElement"
Cohesion: 0.07
Nodes (40): child, elements, isolated, other, result, root, targeted, AiDesignGenerator (+32 more)

### Community 6 - "ai-design/route.ts"
Cohesion: 0.07
Nodes (35): AiStreamEvent, attemptStructured(), Channel, childrenOf(), clearPage(), contentSchema, DEFAULT_THEME, describeSection() (+27 more)

### Community 7 - "DragSession"
Cohesion: 0.16
Nodes (4): DragSession, intersect(), DropPlan, 2. registry.json

### Community 8 - "editor/editor.tsx"
Cohesion: 0.06
Nodes (45): LumaMark(), PagieraMark(), Clipboard, ComponentAsset, ComponentAssetCards(), componentHasContent(), DragInfo, Editor() (+37 more)

### Community 9 - "web/package.json"
Cohesion: 0.10
Nodes (20): ignoreScripts, @biomejs/biome, marked, next, pagiera, react, react-dom, tailwindcss (+12 more)

### Community 10 - "source.ts"
Cohesion: 0.13
Nodes (23): assertFetchableUrl(), BLOCKED_HOSTS, buildRequest(), DataSourceError, DEFAULT_REVALIDATE, EMPTY_CONTEXT, LoadOptions, loadSource() (+15 more)

### Community 11 - "editor/validate.ts"
Cohesion: 0.08
Nodes (48): CustomTag, DATA_SOURCE_NOT_FOUND_BEHAVIORS, DEFAULT_STATE_TRANSITION, ElementAttribute, FieldOption, INPUT_TYPES, STYLE_KEYS, URL_ATTRIBUTES (+40 more)

### Community 12 - "dsl.ts"
Cohesion: 0.07
Nodes (38): Align, ALIGNS, asBoolean(), asNumber(), BoxNode, BUTTON_KINDS, ButtonKind, ButtonNode (+30 more)

### Community 14 - "showcase.tsx"
Cohesion: 0.14
Nodes (23): metadata, ShowcasePage(), Arrow(), Mark(), projects, shader, Showcase(), CarouselEditor() (+15 more)

### Community 15 - "page-render.tsx"
Cohesion: 0.11
Nodes (27): ElementBody(), IconGlyph(), shaderDocument(), isBand(), ElementTranslationKeys, bindPageContext(), rowsFor(), customTagOf() (+19 more)

### Community 16 - "example/package.json"
Cohesion: 0.05
Nodes (37): dependencies, next, pagiera, react, react-dom, devDependencies, @biomejs/biome, tailwindcss (+29 more)

### Community 17 - "en/data-binding.mdx"
Cohesion: 0.10
Nodes (19): A concrete source definition, Bind returned fields, Choose Request or Repeat, Formatting bound values, Handle loading and failure, Keep pages indexable, Source configuration and limits, Troubleshooting by symptom (+11 more)

### Community 18 - "pagiera/package.json"
Cohesion: 0.05
Nodes (41): author, bin, pagiera, bugs, url, description, engines, node (+33 more)

### Community 19 - "en/deployment.mdx"
Cohesion: 0.12
Nodes (15): Data and cache lifecycle, Environment reference, Provision the host, Recovery exercise, Release checklist, Runtime requirements, Server configuration, Ana uygulama ortamını hazırlayın (+7 more)

### Community 20 - "theme.ts"
Cohesion: 0.16
Nodes (33): accentAsText(), alpha(), AXES, backdropFor(), clamp(), contrast(), CORNERS, DENSITY (+25 more)

### Community 21 - "create-forma.ts"
Cohesion: 0.07
Nodes (32): add(), art, button(), carousel, contact, document, elements, emphasis (+24 more)

### Community 22 - "Pagiera"
Cohesion: 0.15
Nodes (13): Client API, Dynamic routes and request data, Environment variables, Highlights, Installation, License, Lightweight editor, Package exports (+5 more)

### Community 23 - "site-templates.ts"
Cohesion: 0.12
Nodes (40): addNocturneContactForm(), createNocturneShowcase(), createNocturneSiteTemplate(), enter(), nocturneInnerPage(), node(), responsive(), SiteTemplatePage (+32 more)

### Community 24 - "variables-panel.tsx"
Cohesion: 0.19
Nodes (12): SelectShell(), SizeField(), COLOR_PROPERTIES, NUMBER_PROPERTIES, VariablesPanel(), SelectContent(), SelectItem(), SelectLabel() (+4 more)

### Community 25 - "documentation-page.tsx"
Cohesion: 0.23
Nodes (10): generateMetadata(), Page(), Props, generateMetadata(), Page(), Props, docsMetadata(), DocumentationPage() (+2 more)

### Community 26 - "package.json"
Cohesion: 0.06
Nodes (33): description, devDependencies, @biomejs/biome, typescript, engines, node, homepage, @biomejs/biome (+25 more)

### Community 27 - "parts.tsx"
Cohesion: 0.07
Nodes (40): Breadcrumbs(), BreakpointRow(), ContextMenu(), CORNERS, ELEMENT_GROUPS, ELEMENT_INFO, elementLabel(), ElementsPanel() (+32 more)

### Community 28 - "published-page.tsx"
Cohesion: 0.11
Nodes (17): dynamic, handlers, maxDuration, dynamic, generateMetadata(), HomePage(), dynamic, generateMetadata() (+9 more)

### Community 29 - "src/index.ts"
Cohesion: 0.14
Nodes (23): 3. Design an editable website, PagieraAdapters, PagieraDataPreview, PagieraPageSummary, PagieraSaveResult, createDocument(), PagieraBreakpoint, PagieraDocument (+15 more)

### Community 30 - "compose.ts"
Cohesion: 0.10
Nodes (28): Builder, compose(), composeFragment(), composeSection(), Ctx, gridSteps(), make(), MEASURE (+20 more)

### Community 31 - "example/biome.json"
Cohesion: 0.07
Nodes (26): source, assist, actions, css, parser, next, react, files (+18 more)

### Community 32 - "web/biome.json"
Cohesion: 0.07
Nodes (26): source, assist, actions, css, parser, next, react, files (+18 more)

### Community 33 - "server-source.ts"
Cohesion: 0.14
Nodes (19): inspectMcpServer(), PagieraMcpServer, BUILTIN_TEMPLATE_IDS, BuiltinTemplateId, createPagieraRouteHandlers(), createPagieraServer(), getEditorBootstrap(), getPublishedDocument() (+11 more)

### Community 34 - "dependencies"
Cohesion: 0.07
Nodes (27): dependencies, ai, class-variance-authority, clsx, drizzle-orm, esbuild, @fontsource-variable/figtree, @iconify-json/lucide (+19 more)

### Community 35 - "test-keyframes.ts"
Cohesion: 0.15
Nodes (13): built, cls, css, { duration, tracks }, { keyframes, declarations }, layer, [parsed], shuffled (+5 more)

### Community 36 - "docs-source.ts"
Cohesion: 0.17
Nodes (6): GET(), search, DocsLocale, EnglishSource, TurkishSource, fumadocs-core

### Community 37 - "keyframes.ts"
Cohesion: 0.10
Nodes (19): CssProperty, cssValue(), easeCss(), fmt(), KEY_EASES, KEY_GROUPS, KEY_PROP, KEY_PROPS (+11 more)

### Community 38 - "SliderInput"
Cohesion: 0.26
Nodes (12): CurveFields(), EntranceGroup(), Inspector(), InteractTab(), makeOverridable(), PressGroup(), ScrollGroup(), SpringGraph() (+4 more)

### Community 39 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, framer-motion, fumadocs-core, fumadocs-mdx, fumadocs-ui, marked, next, pagiera (+3 more)

### Community 40 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 42 - "motion-timeline.tsx"
Cohesion: 0.10
Nodes (31): ClipCurve(), ClipDrag, ColorStrip(), CurveEditing, easeLabel(), EffectCard(), EffectsLibrary(), EntranceClip() (+23 more)

### Community 43 - "exports"
Cohesion: 0.11
Nodes (19): import, types, exports, ./data, ./full, ./full.css, ./package.json, ./provider (+11 more)

### Community 44 - ".home"
Cohesion: 0.09
Nodes (22): Pagiera package example, 4. Save safely and preview, 5. Publish / activate the website, Build and launch websites with Pagiera, Command-line workflow, Example user request an agent should fulfill, Understand the request, Verification and troubleshooting (+14 more)

### Community 45 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 46 - "server.d.ts"
Cohesion: 0.12
Nodes (4): c, PagieraServerConfig, pg, redis

### Community 47 - "expression.ts"
Cohesion: 0.18
Nodes (19): BINARY_PRECEDENCE, BLOCKED_KEYS, Callable, capList(), capString(), compare(), evaluate(), ExpressionError (+11 more)

### Community 48 - "inspector.tsx"
Cohesion: 0.10
Nodes (31): ALIGN_LABELS, AlignChoice, AttributesEditor(), BezierEditor(), bezierValues(), CLICK_ACTIONS, ClickAction, ContentTab() (+23 more)

### Community 49 - "pagiera-editor.tsx"
Cohesion: 0.15
Nodes (16): dynamic, EditorPage(), dynamic, EditorDocumentPage(), dynamic, EditorPanelPage(), EditorBootstrap, PagieraEditor() (+8 more)

### Community 50 - "layout.tsx"
Cohesion: 0.14
Nodes (14): figtree, geistMono, geistSans, manrope, metadata, pressStart2P, RootLayout(), syncopate (+6 more)

### Community 51 - "library.tsx"
Cohesion: 0.12
Nodes (24): BlockList(), CATEGORIES, DetailHeader(), ElementsThumbnail(), Empty(), Entry, LibraryHome(), LibraryPage (+16 more)

### Community 52 - "src/page.tsx"
Cohesion: 0.22
Nodes (17): constraints(), declarationMap(), fillOf(), formHeaders(), interactionDeclarationMap(), pageTransitionCss(), PagieraPage(), px() (+9 more)

### Community 53 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+8 more)

### Community 54 - "editor/actions.ts"
Cohesion: 0.11
Nodes (28): Props, ACTION_ANIMATIONS, ACTION_DIRECTIONS, ACTION_STEP_KINDS, ACTION_TRIGGERS, ActionAnimation, ActionAnimationType, actionAttributes() (+20 more)

### Community 55 - "ref_react"
Cohesion: 0.23
Nodes (6): Layout(), Layout(), SiteRoot(), EditorShell(), PagieraComponents, PagieraTranslations

### Community 56 - "custom.ts"
Cohesion: 0.21
Nodes (12): customButton, CarouselControl, carouselControlAttributes(), normalizeCarouselControl(), disclosureAttributes(), CUSTOM_TAGS, RESERVED_ATTRIBUTES, CUSTOM_TAG_SET (+4 more)

### Community 57 - "ref_react"
Cohesion: 0.18
Nodes (17): ChromeButton(), TOOL_SIZES, TOOL_TONES, ToolButton(), ToolTone, PanelAction(), PanelHeader(), PanelSearch() (+9 more)

### Community 58 - "test-motion.ts"
Cohesion: 0.14
Nodes (13): a, base, bouncy, childA, childB, css, custom, p (+5 more)

### Community 59 - "css.ts"
Cohesion: 0.07
Nodes (57): baseOf(), chainFor(), mediaPlan(), overrideChain(), firstFrameCss(), motionCss(), motionTracks(), originCss() (+49 more)

### Community 60 - "drag-session.ts"
Cohesion: 0.14
Nodes (12): DRAG_THRESHOLD, FlowInfo, flush(), flushAll(), idOf(), later(), NO_OFFSET, Offset (+4 more)

### Community 61 - "build-extra.ts"
Cohesion: 0.28
Nodes (11): band(), builds, bundle(), Element, ledger(), main(), Palette, rise() (+3 more)

### Community 62 - "cascade.ts"
Cohesion: 0.15
Nodes (14): GestureLayer, GestureLayerHandle, GestureVisuals, Measure, NOTHING, Cascade, chainCache, DEFAULT_CASCADE (+6 more)

### Community 63 - "ref_node_fs"
Cohesion: 0.17
Nodes (9): result, lines(), templateThumbnailSvg(), ThumbnailTemplate, xml(), main(), ids, registry (+1 more)

### Community 64 - "Group"
Cohesion: 0.17
Nodes (36): AnimationFields(), OverlayGroup(), BorderGroup(), CarouselControlGroup(), ClickGroup(), CompositionGroup(), FieldDesign(), FieldGroup() (+28 more)

### Community 65 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, dev, dev:site, docs:check, docs:generate, format, i18n:check (+3 more)

### Community 66 - "motion-editor.tsx"
Cohesion: 0.08
Nodes (40): AnimationEditor(), AnimationGlyph(), cardLabel(), FieldRow(), KeyframePanel(), KeyframeStrip(), MotionLayerPanel(), MotionLibrary() (+32 more)

### Community 67 - "shaders.ts"
Cohesion: 0.16
Nodes (13): element, html, [restored], Disclosure, disclosureChildren(), child(), normalizeDisclosure(), FieldAppearance (+5 more)

### Community 68 - "compilerOptions"
Cohesion: 0.20
Nodes (9): compilerOptions, declaration, declarationMap, noEmit, outDir, rootDir, sourceMap, extends (+1 more)

### Community 69 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, build:full, build:full-css, check, copy:full-types, copy:styles, prepack

### Community 70 - "icons-panel.tsx"
Cohesion: 0.22
Nodes (11): IconsPanel(), InsertEmpty(), cache, ICON_PACKS, iconNames(), IconPack, iconSvg(), loaders (+3 more)

### Community 71 - "effect-presets.ts"
Cohesion: 0.18
Nodes (8): EFFECT_PRESETS, EffectCategory, EffectPreset, Step, Ease, Keyframe, KeyProp, LayerMotion

### Community 72 - "ref_react"
Cohesion: 0.37
Nodes (9): Row(), ScrubInput(), HEIGHT_SIZE_OPTIONS, SIZE_OPTIONS, SizeChoice, FIELD, LABEL, LABEL_W (+1 more)

### Community 73 - "test-text-effects.ts"
Cohesion: 0.29
Nodes (6): disabled, el, html, rolled, normalizeTextEffects(), TextEffects

### Community 74 - "devDependencies"
Cohesion: 0.33
Nodes (6): devDependencies, @types/node, @types/pg, @types/react, @types/react-dom, typescript

### Community 75 - "custom-animation.ts"
Cohesion: 0.12
Nodes (24): { keyframes, options }, spring, ActionGraph, GraphNode, ANIMATION_TEMPLATES, AnimationEasing, AnimationFrame, clampNumber() (+16 more)

### Community 76 - "format.ts"
Cohesion: 0.20
Nodes (19): applyText(), DATE_PRESETS, decorate(), formatDate(), formatDatePattern(), formatNumber(), formatValue(), isEmpty() (+11 more)

### Community 77 - "render/actions.ts"
Cohesion: 0.20
Nodes (19): actionFrame(), actionTiming(), keyframe(), mountActions(), animationFor(), hasShownSibling(), inFlow(), isOpen() (+11 more)

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

### Community 83 - "templates-panel.tsx"
Cohesion: 0.11
Nodes (29): devicesFor(), FALLBACK_DEVICES, PreviewDevice, previewUrlFor(), TemplatePreview(), TemplatePreviewPage, TemplatePreviewStage(), useTemplatePreview() (+21 more)

### Community 84 - "repository"
Cohesion: 0.50
Nodes (4): repository, directory, type, url

### Community 85 - "en/document-model.mdx"
Cohesion: 0.18
Nodes (8): A native document, Element relationships, Shared masters are part of a save, Validation boundaries, Doğrulama sınırları, Ortak master’lar kaydın parçasıdır, Yerel belge yapısı, Öğeler arasındaki ilişkiler

### Community 86 - "Security policy"
Cohesion: 0.50
Nodes (3): Deployment responsibility, Reporting a vulnerability, Security policy

### Community 87 - "Next.js setup"
Cohesion: 0.33
Nodes (6): 1. Import the editor stylesheet, 2. Add the font provider, 3. Mount the backend, 4. Load editor data on the server, 5. Mount the studio, Next.js setup

### Community 89 - "Troubleshooting"
Cohesion: 0.33
Nodes (6): AI generation fails, CSS says `@import` must precede other rules, PostgreSQL or Redis fails, Published API data is missing from HTML, `server.getEditorBootstrap is not a function`, Troubleshooting

### Community 92 - "interactive.ts"
Cohesion: 0.22
Nodes (10): Action, EditorDocument, EditorDocumentSaver, EditorSaveResult, HistoryState, pushPast(), reducer(), SaveStatus (+2 more)

### Community 95 - "peerDependencies"
Cohesion: 0.67
Nodes (3): peerDependencies, react, react-dom

### Community 96 - "binding-format.tsx"
Cohesion: 0.22
Nodes (10): BindingFormatFields(), DATE_STYLES, editorLocale(), KINDS, LOCALES, tidy(), TIME_ZONES, TRANSFORMS (+2 more)

### Community 97 - "data-modal.tsx"
Cohesion: 0.18
Nodes (17): DataSourceModal(), Failure, FailureView(), formatCell(), listsIn(), PairTable(), ResponseView(), SourcePreview (+9 more)

### Community 98 - "Pagiera template registry"
Cohesion: 0.50
Nodes (3): Pagiera template registry, Publishing a template, Structure

### Community 105 - "scripts/check-i18n.cjs"
Cohesion: 0.15
Nodes (10): assert, docs, esbuild, fs, inventory, {localizedHref,LOCALES}, path, root (+2 more)

### Community 106 - "icon.tsx"
Cohesion: 0.33
Nodes (5): GlyphComponent, ICON_CATALOG, ICON_COMPONENTS, IconCatalogEntry, IconCategory

### Community 107 - "ref_node_assert"
Cohesion: 0.17
Nodes (8): encoder, http, sse, assets, docs, marketing, queue, urls

### Community 108 - "createPagieraClient"
Cohesion: 0.12
Nodes (18): Assets and trust, Browser client and adapters, Entry points, HTTP surface, Server loader, Dışa aktarım noktaları, HTTP yüzeyi, Sunucu yükleyicisi (+10 more)

### Community 109 - "tree.ts"
Cohesion: 0.12
Nodes (30): artboardOf(), draggedBox(), DropGeometry, edgeBand(), idOf(), LIVE, orderWithin(), resolveDrop() (+22 more)

### Community 110 - "README.md"
Cohesion: 0.29
Nodes (4): License, Monorepo, Quick start, Why Pagiera?

### Community 111 - "full-editor.d.ts"
Cohesion: 0.29
Nodes (6): PagieraMutationResult, PagieraStudioAdapters, PagieraStudioDocument, PagieraStudioPage, PagieraStudioProps, PagieraTranslations

### Community 112 - "docs-layout.tsx"
Cohesion: 0.36
Nodes (6): Layout(), Layout(), DocumentationLayout(), DocsProviders(), TR, fumadocs-ui

### Community 113 - "wiggledAt"
Cohesion: 0.29
Nodes (10): ColorValue(), clampNumber(), mixColor(), noise(), parseColor(), parseEase(), parseLayerMotion(), toHex() (+2 more)

### Community 114 - "settings-nav.tsx"
Cohesion: 0.40
Nodes (8): sections, SettingsNavigation(), SettingsSection, SettingsWorkspace(), TemplatesNavigation(), WorkspaceNavItem(), WorkspaceNavTitle(), WorkspacePage()

### Community 115 - "en/motion-editor.mdx"
Cohesion: 0.22
Nodes (8): Effects, wiggle and text, Make a simple entrance, Named animations for Actions, Open the timeline, Playback on the website, Property groups, Verify and troubleshoot, Work with tracks and keyframes

### Community 116 - "en/security.mdx"
Cohesion: 0.22
Nodes (8): Browser-visible configuration, Custom code, assets and CSP, Define the trust boundary, Keep secrets on the server, Outbound network policy, Production checklist, Protect editor routes, Validate external data

### Community 117 - "build-full-css.mjs"
Cohesion: 0.15
Nodes (7): from, packageRoot, scope, internalRoot, packageRoot, esbuild, postcss

### Community 118 - "tr/motion-editor.mdx"
Cohesion: 0.22
Nodes (8): Actions için adlandırılmış animasyonlar, Basit bir giriş oluşturun, Doğrulama ve sorun giderme, Efektler, wiggle ve metin, İzler ve keyframe’lerle çalışın, Web sitesinde oynatma, Zaman çizelgesini açın, Özellik grupları

### Community 119 - "ref_next"
Cohesion: 0.14
Nodes (11): Codex + Claude development loop, Documentation is part of implementation, English and Turkish parity, nextConfig, Page(), Props, Page(), Props (+3 more)

### Community 120 - "tr/security.mdx"
Cohesion: 0.22
Nodes (8): Düzenleyici rotalarını koruyun, Dış ağ politikası, Gizli bilgileri sunucuda tutun, Güven sınırını tanımlayın, Haricî veriyi doğrulayın, Tarayıcıya görünen yapılandırma, Özel kod, varlıklar ve CSP, Üretim kontrol listesi

### Community 121 - "arrange.ts"
Cohesion: 0.33
Nodes (8): AlignAction, alignElements(), Box, boxesOf(), DistributeAction, distributeElements(), applyStyle(), Breakpoint

### Community 122 - "marquee-runtime.tsx"
Cohesion: 0.33
Nodes (6): mountDisclosures(), MarqueeRuntime(), noSubscription(), PageScript(), RanFor, runInline()

### Community 123 - "en/action-workflow.mdx"
Cohesion: 0.25
Nodes (7): Add a condition, Animate and morph, Before you start, Build a toggle interaction, Diagnose a flow, Limits and security, Node families

### Community 124 - "en/nextjs-setup.mdx"
Cohesion: 0.25
Nodes (7): 1. Create a server-only loader, 2. Mount and protect the API, 3. Open the default page, 4. Load a page and its panel on the server, 5. Mount the interactive client, Before you start, Verify the integration

### Community 125 - "tr/action-workflow.mdx"
Cohesion: 0.25
Nodes (7): Akışı teşhis edin, Açılıp kapanan etkileşim oluşturun, Başlamadan önce, Canlandırın ve morph uygulayın, Düğüm aileleri, Koşul ekleyin, Sınırlar ve güvenlik

### Community 126 - "tr/nextjs-setup.mdx"
Cohesion: 0.25
Nodes (7): 1. Yalnızca sunucuda çalışan yükleyici oluşturun, 2. API rotasını bağlayıp koruyun, 3. Varsayılan sayfayı açın, 4. Sayfayı ve panelini sunucuda yükleyin, 5. Etkileşimli istemciyi bağlayın, Başlamadan önce, Entegrasyonu doğrulayın

### Community 127 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, @biomejs/biome, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom, typescript

### Community 129 - "en/agents.mdx"
Cohesion: 0.29
Nodes (6): Integration sequence, Objective, Preserve editability, Read before every write, Report the result, Verification contract

### Community 130 - "en/components-layouts.mdx"
Cohesion: 0.29
Nodes (6): Distinguish templates from components, Editing a component, Programmatic save boundary, Reusable components, Shared page layouts, What an instance can change

### Community 131 - "en/fonts-assets.mdx"
Cohesion: 0.29
Nodes (6): Delivery checks, Durable image uploads, External media, Images, video and icons, next/font example, Register site fonts

### Community 132 - "en/forms.mdx"
Cohesion: 0.29
Nodes (6): Build the form, Custom bodies and headers, File fields, Own the receiving endpoint, Submission settings, Verify the visitor experience

### Community 133 - "en/interactions.mdx"
Cohesion: 0.29
Nodes (6): Carousel and marquee, Choose the right tool, Hover, press and entrances, Overlays, Review before publishing, Tabs and accordion

### Community 134 - "en/troubleshooting.mdx"
Cohesion: 0.29
Nodes (6): A page saves but does not change publicly, AI generation fails, getEditorBootstrap is not a function, Published API data is missing from HTML, The editor has no styles, The health endpoint fails

### Community 135 - "tr/agents.mdx"
Cohesion: 0.29
Nodes (6): Amaç, Doğrulama sözleşmesi, Düzenlenebilirliği koruyun, Entegrasyon sırası, Her yazmadan önce okuyun, Sonucu bildirin

### Community 136 - "tr/components-layouts.mdx"
Cohesion: 0.29
Nodes (6): Bir bileşeni düzenlemek, Bir örnek neleri değiştirebilir, Ortak sayfa düzenleri, Programatik kayıt sınırı, Yeniden kullanılabilir bileşenler, Şablonları bileşenlerden ayırın

### Community 137 - "tr/fonts-assets.mdx"
Cohesion: 0.29
Nodes (6): Görseller, video ve simgeler, Haricî medya, Kalıcı görsel yüklemeleri, next/font örneği, Site yazı tiplerini kaydedin, Teslim kontrolleri

### Community 138 - "tr/forms.mdx"
Cohesion: 0.29
Nodes (6): Alıcı uç noktanın sorumluluğunu üstlenin, Dosya alanları, Formu oluşturun, Gönderim ayarları, Ziyaretçi deneyimini doğrulayın, Özel gövdeler ve başlıklar

### Community 139 - "tr/interactions.mdx"
Cohesion: 0.29
Nodes (6): Carousel ve marquee, Doğru aracı seçin, Overlay’ler, Tabs ve accordion, Yayımlamadan önce inceleyin, Üzerine gelme, basma ve girişler

### Community 140 - "tr/troubleshooting.mdx"
Cohesion: 0.29
Nodes (6): Düzenleyicide stiller görünmüyor, getEditorBootstrap bir işlev değil, Sayfa kaydediliyor ancak herkese açık görünüm değişmiyor, Sağlık uç noktası başarısız oluyor, Yapay zekâ ile üretim başarısız oluyor, Yayımlanan API verisi HTML'de eksik

### Community 141 - "en/blocks.mdx"
Cohesion: 0.33
Nodes (5): Composed interactive blocks, Content and media, Forms, Layout blocks, Server-backed content

### Community 142 - "en/cli.mdx"
Cohesion: 0.33
Nodes (5): Availability, Inspect before editing, Publish only with approval, Update without overwriting another editor, Validate and create

### Community 143 - "en/getting-started.mdx"
Cohesion: 0.33
Nodes (5): Before you begin, Configure the services, Import the editor stylesheet, Install the package, Verify the installation

### Community 144 - "en/publishing.mdx"
Cohesion: 0.33
Nodes (5): Draft, preview and public output, Failure and recovery, Render a private draft, Render the public route, Review and publish

### Community 145 - "en/revisions.mdx"
Cohesion: 0.33
Nodes (5): Operational recovery, Restore a revision, Save sequence, Shared state and recovery, Two different versions

### Community 146 - "en/studio.mdx"
Cohesion: 0.33
Nodes (5): Create your first editable page, Find your tools, Layers and layout, Save and verify, When something goes wrong

### Community 147 - "en/templates.mdx"
Cohesion: 0.33
Nodes (5): Before installation, Configure the registry, Install a template, Maintain your own registry, What a template contains

### Community 148 - "tr/blocks.mdx"
Cohesion: 0.33
Nodes (5): Birleşik etkileşimli bloklar, Düzen blokları, Formlar, İçerik ve medya, Sunucu destekli içerik

### Community 149 - "tr/cli.mdx"
Cohesion: 0.33
Nodes (5): Başka bir düzenleyicinin çalışmasının üzerine yazmadan güncelleyin, Doğrulayın ve oluşturun, Düzenlemeden önce inceleyin, Kullanılabilirlik, Yalnızca onayla yayımlayın

### Community 150 - "tr/getting-started.mdx"
Cohesion: 0.33
Nodes (5): Başlamadan önce, Düzenleyicinin stil dosyasını içe aktarın, Hizmetleri yapılandırın, Kurulumu doğrulayın, Paketi yükleyin

### Community 151 - "tr/publishing.mdx"
Cohesion: 0.33
Nodes (5): Hata ve kurtarma, İnceleyip yayımlayın, Kamusal rotayı işleyin, Taslak, önizleme ve kamusal çıktı, Özel taslağı işleyin

### Community 152 - "tr/revisions.mdx"
Cohesion: 0.33
Nodes (5): Bir revizyonu geri yükleyin, İki farklı sürüm, İşletim sırasında kurtarma, Kaydetme sırası, Ortak durum ve kurtarma

### Community 153 - "tr/templates.mdx"
Cohesion: 0.33
Nodes (5): Bir şablon neler içerir?, Bir şablon yükleyin, Kayıt deposunu yapılandırın, Kendi kayıt deponuzun bakımını yapın, Yüklemeden önce

### Community 154 - "source.config.ts"
Cohesion: 0.33
Nodes (4): withMDX, docsEn, docsTr, fumadocs-mdx

### Community 155 - "en/ai-mcp.mdx"
Cohesion: 0.40
Nodes (4): Agent-driven editing, AI generation workflow, Configure an operator-owned connection, MCP discovery

### Community 156 - "en/architecture.mdx"
Cohesion: 0.40
Nodes (4): Choose your next step, Follow a document through the system, Package boundaries, The system at a glance

### Community 157 - "en/responsive-design.mdx"
Cohesion: 0.40
Nodes (4): Acceptance checklist, Avoid overflow, Build from wide to narrow, Start with the page breakpoints

### Community 158 - "tr/ai-mcp.mdx"
Cohesion: 0.40
Nodes (4): Ajanla düzenleme, MCP keşfi, Operatöre ait bağlantı yapılandırın, Yapay zekâ ile üretim iş akışı

### Community 159 - "tr/architecture.mdx"
Cohesion: 0.40
Nodes (4): Bir belgenin sistemdeki yolculuğunu izleyin, Paket sınırları, Sisteme genel bakış, Sonraki adımınızı seçin

### Community 160 - "tr/responsive-design.mdx"
Cohesion: 0.40
Nodes (4): Genişten dara doğru oluşturun, Kabul kontrol listesi, Sayfanın kırılma noktalarıyla başlayın, Taşmayı önleyin

### Community 161 - "Website and inline documentation"
Cohesion: 0.40
Nodes (4): Checks, Content and routes, Development, Website and inline documentation

### Community 162 - "easeAt"
Cohesion: 0.60
Nodes (5): CurveEditor(), EaseIcon(), bezierAt(), bezierOf(), easeAt()

### Community 163 - "Unreleased"
Cohesion: 0.50
Nodes (3): Compatibility, Documentation, Unreleased

### Community 164 - "en/index.mdx"
Cohesion: 0.50
Nodes (3): Build the page, Integrate and operate, Start with a working editor

### Community 165 - "Unreleased"
Cohesion: 0.50
Nodes (3): Dokümantasyon, Unreleased, Uyumluluk

### Community 166 - "tr/index.mdx"
Cohesion: 0.50
Nodes (3): Entegre edin ve işletin, Sayfayı oluşturun, Çalışan bir editörle başlayın

### Community 169 - "StepList"
Cohesion: 1.00
Nodes (3): ActionsGroup(), blankStep(), StepList()

## Knowledge Gaps
- **47 isolated node(s):** `next`, `pagiera`, `react`, `react-dom`, `@biomejs/biome` (+42 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1172 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@tabler/icons-react` connect `CanvasElement` to `action-graph.ts`, `data-modal.tsx`, `motion-editor.tsx`, `icons-panel.tsx`, `editor/editor.tsx`, `ref_react`, `motion-timeline.tsx`, `icon.tsx`, `inspector.tsx`, `pagiera/package.json`, `library.tsx`, `templates-panel.tsx`, `settings-nav.tsx`, `variables-panel.tsx`, `parts.tsx`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **What connects `next`, `pagiera`, `react` to the rest of the system?**
  _47 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `pages.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06621004566210045 - nodes in this community are weakly interconnected._
- **Why does `CanvasElement` connect `CanvasElement` to `pages.ts`, `presets.ts`, `types.ts`, `editor/editor.tsx`, `source.ts`, `editor/validate.ts`, `showcase.tsx`, `page-render.tsx`, `create-forma.ts`, `site-templates.ts`, `variables-panel.tsx`, `parts.tsx`, `compose.ts`, `test-keyframes.ts`, `motion-timeline.tsx`, `inspector.tsx`, `library.tsx`, `editor/actions.ts`, `test-motion.ts`, `css.ts`, `cascade.ts`, `motion-editor.tsx`, `shaders.ts`, `icons-panel.tsx`, `test-binding-format.ts`, `templates-panel.tsx`, `interactive.ts`, `icon.tsx`, `tree.ts`, `arrange.ts`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Should `action-graph.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07862679955703211 - nodes in this community are weakly interconnected._
- **Why does `exports` connect `exports` to `pagiera/package.json`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Should `types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._