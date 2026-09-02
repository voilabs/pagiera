import { and, asc, desc, eq, isNotNull, ne, notInArray, sql } from "drizzle-orm";
import { db } from "@/drizzle";
import { type Page, pageRevisions, pages, sites } from "@/drizzle/schema";
import {
    type CanvasElement,
    type DataSource,
    DEFAULT_ROOT_STYLE,
    type RootStyle,
} from "@/lib/editor/types";
import type { SiteTemplatePage } from "@/lib/editor/showcase";

export const DEFAULT_SITE_SLUG = "default";
export const DEFAULT_PAGE_SLUG = "home";

/** How many autosave snapshots to retain per page before pruning the oldest. */
const REVISION_LIMIT = 50;

function subtreeIds(elements: CanvasElement[], rootId: string) {
    const ids = new Set([rootId]);
    let changed = true;
    while (changed) {
        changed = false;
        for (const element of elements) {
            if (element.parentId && ids.has(element.parentId) && !ids.has(element.id)) {
                ids.add(element.id);
                changed = true;
            }
        }
    }
    return ids;
}

/** Extracts and normalises the component source slots used to sync instances. */
function componentMastersFrom(elements: CanvasElement[]) {
    const roots = elements.filter((element) => element.componentRole === "master");
    const assetNames = new Map<string, string | undefined>();
    for (const root of roots) {
        const componentId = root.componentId ?? root.id;
        if (!assetNames.has(componentId)) assetNames.set(componentId, root.name);
    }
    const ids = new Set<string>();
    for (const root of roots) for (const id of subtreeIds(elements, root.id)) ids.add(id);
    return elements.filter((element) => ids.has(element.id)).map((element) => ({
        ...element,
        name: element.componentRole === "master" ? assetNames.get(element.componentId ?? element.id) : element.name,
        componentSourceId: element.componentSourceId ?? element.id,
    }));
}

function withoutComponentMasters(elements: CanvasElement[]) {
    const ids = new Set<string>();
    for (const root of elements.filter((element) => element.componentRole === "master")) {
        for (const id of subtreeIds(elements, root.id)) ids.add(id);
    }
    return elements.filter((element) => !ids.has(element.id));
}

function withSharedComponents(elements: CanvasElement[], components: CanvasElement[]) {
    const page = withoutComponentMasters(elements);
    const occupied = new Set(page.map((element) => element.id));
    return [...page, ...components.filter((element) => !occupied.has(element.id))];
}

function variantKey(element: CanvasElement) {
    return `${element.componentId ?? element.id}\u0000${element.variant ?? "Default"}`;
}

/** Rebuilds every instance from its site-level master while preserving placement. */
function syncComponentInstances(elements: CanvasElement[], components: CanvasElement[]) {
    const masters = components.filter((element) => element.componentRole === "master");
    const masterByVariant = new Map(masters.map((master) => [variantKey(master), master]));
    const firstMaster = new Map<string, CanvasElement>();
    for (const master of masters) if (!firstMaster.has(master.componentId ?? master.id)) firstMaster.set(master.componentId ?? master.id, master);

    let result = withoutComponentMasters(elements);
    for (const instance of result.filter((element) => element.componentRole === "instance")) {
        const componentId = instance.componentId;
        if (!componentId) continue;
        const master = masterByVariant.get(variantKey(instance)) ?? firstMaster.get(componentId);
        if (!master) continue;

        const oldIds = subtreeIds(result, instance.id);
        const oldNodes = result.filter((element) => oldIds.has(element.id));
        const existingBySource = new Map(oldNodes.flatMap((node) => node.componentSourceId ? [[node.componentSourceId, node] as const] : []));
        const sourceIds = subtreeIds(components, master.id);
        const sourceNodes = components.filter((element) => sourceIds.has(element.id));
        const idBySource = new Map<string, string>();
        for (const source of sourceNodes) {
            const slot = source.componentSourceId ?? source.id;
            idBySource.set(slot, source.id === master.id ? instance.id : existingBySource.get(slot)?.id ?? globalThis.crypto.randomUUID());
        }

        const clones = sourceNodes.map((source) => {
            const slot = source.componentSourceId ?? source.id;
            const isRoot = source.id === master.id;
            const parent = source.parentId ? components.find((candidate) => candidate.id === source.parentId) : undefined;
            const parentSlot = parent?.componentSourceId ?? parent?.id;
            const clone: CanvasElement = {
                ...source,
                id: idBySource.get(slot)!,
                parentId: isRoot ? instance.parentId : parentSlot ? idBySource.get(parentSlot) : undefined,
                z: isRoot ? instance.z : source.z,
                componentRole: isRoot ? "instance" : undefined,
                componentId: isRoot ? componentId : undefined,
                componentSourceId: slot,
                variant: isRoot ? (instance.variant ?? master.variant) : undefined,
                interaction: source.interaction && source.interaction.action !== "navigate"
                    ? { ...source.interaction, value: idBySource.get(source.interaction.value) ?? source.interaction.value }
                    : source.interaction,
            };
            if (isRoot) {
                clone.base = {
                    ...source.base,
                    x: instance.base.x,
                    y: instance.base.y,
                    constraintX: instance.base.constraintX,
                    constraintY: instance.base.constraintY,
                };
                const placementKeys = ["x", "y", "constraintX", "constraintY"] as const;
                const overrides: CanvasElement["overrides"] = { ...(source.overrides ?? {}) };
                for (const [breakpoint, values] of Object.entries(instance.overrides ?? {})) {
                    const placement = Object.fromEntries(placementKeys.flatMap((key) => values[key] === undefined ? [] : [[key, values[key]]])) as Partial<CanvasElement["base"]>;
                    if (Object.keys(placement).length) overrides[breakpoint] = { ...(overrides[breakpoint] ?? {}), ...placement };
                }
                clone.overrides = Object.keys(overrides).length ? overrides : undefined;
            }
            return clone;
        });
        result = [...result.filter((element) => !oldIds.has(element.id)), ...clones];
    }
    return result;
}

async function getSiteComponents(siteId: string, published = false) {
    const [site] = await db.select({ components: sites.components, publishedComponents: sites.publishedComponents }).from(sites).where(eq(sites.id, siteId)).limit(1);
    return componentMastersFrom((published ? site?.publishedComponents : site?.components) ?? []);
}

export type PageSummary = {
    id: string;
    name: string;
    slug: string;
    publishedAt: Date | null;
    updatedAt: Date;
};

async function getDefaultSiteId() {
    const [existing] = await db
        .select({ id: sites.id })
        .from(sites)
        .where(eq(sites.slug, DEFAULT_SITE_SLUG))
        .limit(1);
    if (existing) return existing.id;

    await db
        .insert(sites)
        .values({ name: "Default site", slug: DEFAULT_SITE_SLUG })
        .onConflictDoNothing({ target: sites.slug });

    const [created] = await db
        .select({ id: sites.id })
        .from(sites)
        .where(eq(sites.slug, DEFAULT_SITE_SLUG))
        .limit(1);
    if (!created) throw new Error("Failed to create the default site");
    return created.id;
}

export type SiteFont = {
    fontFamily: string;
    customFonts: NonNullable<RootStyle["customFonts"]>;
};

export type SiteTransition = Pick<RootStyle, "pageTransition" | "pageTransitionDuration">;

function withSiteFont(rootStyle: RootStyle, font: SiteFont): RootStyle {
    return { ...rootStyle, fontFamily: font.fontFamily, customFonts: font.customFonts };
}

function withSiteTransition(rootStyle: RootStyle, transition: SiteTransition): RootStyle {
    return { ...rootStyle, ...transition };
}

async function getSiteFont(siteId: string): Promise<SiteFont> {
    const [site] = await db
        .select({ fontFamily: sites.fontFamily, customFonts: sites.customFonts })
        .from(sites)
        .where(eq(sites.id, siteId))
        .limit(1);
    if (site?.fontFamily) {
        return { fontFamily: site.fontFamily, customFonts: site.customFonts ?? [] };
    }

    const [home] = await db
        .select({ rootStyle: pages.rootStyle })
        .from(pages)
        .where(and(eq(pages.siteId, siteId), eq(pages.slug, DEFAULT_PAGE_SLUG)))
        .limit(1);
    const inferred = {
        fontFamily: home?.rootStyle?.fontFamily ?? DEFAULT_ROOT_STYLE.fontFamily,
        customFonts: home?.rootStyle?.customFonts ?? [],
    };
    await db.update(sites).set({ ...inferred, updatedAt: new Date() }).where(eq(sites.id, siteId));
    return inferred;
}

export async function setSiteFont(fontFamily: string, customFonts: NonNullable<RootStyle["customFonts"]> = []) {
    const siteId = await getDefaultSiteId();
    const font = { fontFamily, customFonts };
    await db.transaction(async (tx) => {
        await tx.update(sites).set({ ...font, updatedAt: new Date() }).where(eq(sites.id, siteId));
        const documents = await tx
            .select({ id: pages.id, rootStyle: pages.rootStyle, publishedRootStyle: pages.publishedRootStyle })
            .from(pages)
            .where(eq(pages.siteId, siteId));
        for (const document of documents) {
            await tx.update(pages).set({
                rootStyle: withSiteFont(document.rootStyle ?? DEFAULT_ROOT_STYLE, font),
                publishedRootStyle: document.publishedRootStyle
                    ? withSiteFont(document.publishedRootStyle, font)
                    : null,
                updatedAt: new Date(),
            }).where(eq(pages.id, document.id));
        }
    });
    return font;
}

async function getSiteTransition(siteId: string): Promise<SiteTransition> {
    const [site] = await db
        .select({ pageTransition: sites.pageTransition, pageTransitionDuration: sites.pageTransitionDuration })
        .from(sites)
        .where(eq(sites.id, siteId))
        .limit(1);
    if (site?.pageTransition && site.pageTransitionDuration) {
        return {
            pageTransition: site.pageTransition,
            pageTransitionDuration: site.pageTransitionDuration,
        };
    }

    const [home] = await db
        .select({ rootStyle: pages.rootStyle })
        .from(pages)
        .where(and(eq(pages.siteId, siteId), eq(pages.slug, DEFAULT_PAGE_SLUG)))
        .limit(1);
    const transition = {
        pageTransition: home?.rootStyle?.pageTransition ?? DEFAULT_ROOT_STYLE.pageTransition,
        pageTransitionDuration: home?.rootStyle?.pageTransitionDuration ?? DEFAULT_ROOT_STYLE.pageTransitionDuration,
    };
    await db.update(sites).set({ ...transition, updatedAt: new Date() }).where(eq(sites.id, siteId));
    return transition;
}

export async function setSiteTransition(pageTransition: RootStyle["pageTransition"], pageTransitionDuration: number) {
    const siteId = await getDefaultSiteId();
    const transition = { pageTransition, pageTransitionDuration };
    await db.update(sites).set({ ...transition, updatedAt: new Date() }).where(eq(sites.id, siteId));
    return transition;
}

export async function listPages(): Promise<PageSummary[]> {
    const siteId = await getDefaultSiteId();
    return db
        .select({
            id: pages.id,
            name: pages.name,
            slug: pages.slug,
            publishedAt: pages.publishedAt,
            updatedAt: pages.updatedAt,
        })
        .from(pages)
        .where(eq(pages.siteId, siteId))
        .orderBy(asc(pages.createdAt));
}

/**
 * The whole site as a template bundle.
 *
 * The draft documents are exported rather than the published ones: a template
 * is authored in the editor, and requiring a publish before it could be saved
 * would mean shipping work-in-progress to the live site just to keep a copy of
 * it.
 */
export async function exportSite() {
    const siteId = await getDefaultSiteId();
    const rows = await db
        .select({
            name: pages.name,
            slug: pages.slug,
            elements: pages.elements,
            rootStyle: pages.rootStyle,
            dataSources: pages.dataSources,
        })
        .from(pages)
        .where(eq(pages.siteId, siteId))
        .orderBy(asc(pages.createdAt));

    return {
        pages: rows.map((row) => ({
            name: row.name,
            slug: row.slug,
            elements: row.elements ?? [],
            rootStyle: row.rootStyle ?? DEFAULT_ROOT_STYLE,
            dataSources: row.dataSources ?? [],
        })),
        components: await getSiteComponents(siteId),
    };
}

/**
 * Every page's element tree, for the cross-page component library. Kept
 * separate from `listPages` because it pulls the whole document and only the
 * library needs that.
 */
export async function listPageDocuments() {
    const siteId = await getDefaultSiteId();
    return db
        .select({ id: pages.id, name: pages.name, elements: pages.elements })
        .from(pages)
        .where(eq(pages.siteId, siteId))
        .orderBy(asc(pages.createdAt));
}

export async function getPage(pageId: string): Promise<Page | undefined> {
    const [page] = await db
        .select()
        .from(pages)
        .where(eq(pages.id, pageId))
        .limit(1);
    if (!page) return undefined;
    const font = await getSiteFont(page.siteId);
    const transition = await getSiteTransition(page.siteId);
    const storedComponents = await getSiteComponents(page.siteId);
    const components = storedComponents.length ? storedComponents : componentMastersFrom(page.elements);
    return {
        ...page,
        elements: withSharedComponents(syncComponentInstances(page.elements, components), components),
        publishedElements: page.publishedElements ? syncComponentInstances(page.publishedElements, components) : null,
        rootStyle: withSiteTransition(withSiteFont(page.rootStyle ?? DEFAULT_ROOT_STYLE, font), transition),
        publishedRootStyle: page.publishedRootStyle ? withSiteTransition(withSiteFont(page.publishedRootStyle, font), transition) : null,
    };
}

/** The published snapshot for a public URL, or undefined when unpublished. */
export async function getPublishedPage(slug: string) {
    const siteId = await getDefaultSiteId();
    const [page] = await db
        .select({
            name: pages.name,
            elements: pages.publishedElements,
            rootStyle: pages.publishedRootStyle,
            dataSources: pages.publishedDataSources,
            publishedAt: pages.publishedAt,
        })
        .from(pages)
        .where(
            and(
                eq(pages.siteId, siteId),
                eq(pages.slug, slug),
                isNotNull(pages.publishedAt),
            ),
        )
        .limit(1);

    if (!page?.elements) return undefined;
    const font = await getSiteFont(siteId);
    const transition = await getSiteTransition(siteId);
    const storedComponents = await getSiteComponents(siteId, true);
    const components = storedComponents.length ? storedComponents : componentMastersFrom(page.elements);
    return {
        name: page.name,
        elements: syncComponentInstances(page.elements, components),
        rootStyle: withSiteTransition(withSiteFont(page.rootStyle ?? DEFAULT_ROOT_STYLE, font), transition),
        dataSources: page.dataSources ?? [],
        publishedAt: page.publishedAt,
    };
}

export async function listPublishedSlugs() {
    const siteId = await getDefaultSiteId();
    return db
        .select({ slug: pages.slug })
        .from(pages)
        .where(and(eq(pages.siteId, siteId), isNotNull(pages.publishedAt)));
}

/**
 * Returns the page the editor opens by default, creating it on first run so a
 * fresh clone has something to edit.
 */
export async function getOrCreateDefaultPage(): Promise<Page> {
    const siteId = await getDefaultSiteId();
    const font = await getSiteFont(siteId);
    const transition = await getSiteTransition(siteId);

    const [existing] = await db
        .select()
        .from(pages)
        .where(and(eq(pages.siteId, siteId), eq(pages.slug, DEFAULT_PAGE_SLUG)))
        .limit(1);
    if (existing) {
        const storedComponents = await getSiteComponents(siteId);
        const components = storedComponents.length ? storedComponents : componentMastersFrom(existing.elements);
        return { ...existing, elements: withSharedComponents(syncComponentInstances(existing.elements, components), components), rootStyle: withSiteTransition(withSiteFont(existing.rootStyle ?? DEFAULT_ROOT_STYLE, font), transition) };
    }

    await db
        .insert(pages)
        .values({
            siteId,
            name: "Home",
            slug: DEFAULT_PAGE_SLUG,
            elements: [],
            rootStyle: withSiteTransition(withSiteFont(DEFAULT_ROOT_STYLE, font), transition),
        })
        .onConflictDoNothing({ target: [pages.siteId, pages.slug] });

    const [page] = await db
        .select()
        .from(pages)
        .where(and(eq(pages.siteId, siteId), eq(pages.slug, DEFAULT_PAGE_SLUG)))
        .limit(1);
    if (!page) throw new Error("Failed to create the default page");
    const components = await getSiteComponents(siteId);
    return { ...page, elements: withSharedComponents(page.elements, components), rootStyle: withSiteTransition(withSiteFont(page.rootStyle ?? DEFAULT_ROOT_STYLE, font), transition) };
}

/* ------------------------------------------------------------------- writes */

export type SaveResult =
    | { status: "saved"; version: number; componentsPublished?: boolean }
    /** Another writer advanced the page; carries the winning state. */
    | {
          status: "conflict";
          version: number;
          elements: CanvasElement[];
          rootStyle: RootStyle;
          dataSources: DataSource[];
      };

export async function savePageDocument(
    pageId: string,
    elements: CanvasElement[],
    rootStyle: RootStyle,
    dataSources: DataSource[],
    expectedVersion: number,
): Promise<SaveResult> {
    const currentPage = await getPage(pageId);
    if (!currentPage) throw new Error(`Page ${pageId} no longer exists`);
    const siteFont = await getSiteFont(currentPage.siteId);
    const siteTransition = await getSiteTransition(currentPage.siteId);
    const components = componentMastersFrom(elements);
    const previousComponents = componentMastersFrom(currentPage.elements);
    const componentsChanged = JSON.stringify(previousComponents) !== JSON.stringify(components);
    const pageElements = syncComponentInstances(withoutComponentMasters(elements), components);
    const normalizedRootStyle = withSiteTransition(withSiteFont(rootStyle, siteFont), siteTransition);
    const [updated] = await db.transaction(async (tx) => {
        const saved = await tx
            .update(pages)
            .set({
                elements: pageElements,
                rootStyle: normalizedRootStyle,
                dataSources,
                version: sql`${pages.version} + 1`,
                updatedAt: new Date(),
            })
            .where(and(eq(pages.id, pageId), eq(pages.version, expectedVersion)))
            .returning({ version: pages.version });
        if (saved[0]) {
            await tx
                .update(sites)
                .set({
                    components,
                    ...(componentsChanged ? { publishedComponents: components } : {}),
                    updatedAt: new Date(),
                })
                .where(eq(sites.id, currentPage.siteId));
        }
        return saved;
    });

    if (!updated) {
        const [current] = await db
            .select({
                version: pages.version,
                elements: pages.elements,
                rootStyle: pages.rootStyle,
                dataSources: pages.dataSources,
            })
            .from(pages)
            .where(eq(pages.id, pageId))
            .limit(1);

        if (!current) throw new Error(`Page ${pageId} no longer exists`);
        const currentComponents = await getSiteComponents(currentPage.siteId);
        return {
            status: "conflict",
            version: current.version,
            elements: withSharedComponents(syncComponentInstances(current.elements, currentComponents), currentComponents),
            rootStyle: current.rootStyle ?? DEFAULT_ROOT_STYLE,
            dataSources: current.dataSources ?? [],
        };
    }

    await db
        .insert(pageRevisions)
        .values({ pageId, version: updated.version, elements: pageElements, rootStyle: normalizedRootStyle });
    await pruneRevisions(pageId);

    return { status: "saved", version: updated.version, componentsPublished: componentsChanged || undefined };
}

/** Copies the current draft into the published columns. */
export async function publishPage(pageId: string) {
    const [updated] = await db.transaction(async (tx) => {
        const result = await tx
            .update(pages)
            .set({
                publishedElements: sql`${pages.elements}`,
                publishedRootStyle: sql`${pages.rootStyle}`,
                publishedDataSources: sql`${pages.dataSources}`,
                publishedAt: new Date(),
            })
            .where(eq(pages.id, pageId))
            .returning({ slug: pages.slug, publishedAt: pages.publishedAt, siteId: pages.siteId });
        if (result[0]) await tx.update(sites).set({ publishedComponents: sql`${sites.components}`, updatedAt: new Date() }).where(eq(sites.id, result[0].siteId));
        return result;
    });

    return updated;
}

export async function unpublishPage(pageId: string) {
    await db
        .update(pages)
        .set({
            publishedAt: null,
            publishedElements: null,
            publishedRootStyle: null,
            publishedDataSources: null,
        })
        .where(eq(pages.id, pageId));
}

export async function createPage(name: string, slug: string) {
    const siteId = await getDefaultSiteId();
    const font = await getSiteFont(siteId);
    const transition = await getSiteTransition(siteId);
    const [created] = await db
        .insert(pages)
        .values({
            siteId,
            name,
            slug,
            elements: [],
            rootStyle: withSiteTransition(withSiteFont(DEFAULT_ROOT_STYLE, font), transition),
        })
        .onConflictDoNothing({ target: [pages.siteId, pages.slug] })
        .returning({ id: pages.id });

    return created?.id;
}

/** Atomically replaces the current site's pages with a complete template. */
export async function installTemplatePages(templatePages: SiteTemplatePage[], templateComponents: CanvasElement[] = []) {
    const siteId = await getDefaultSiteId();
    if (templatePages.length === 0) return undefined;
    if (!templatePages.some((template) => template.slug === DEFAULT_PAGE_SLUG)) {
        throw new Error("Every site template must include a home page.");
    }
    const components = componentMastersFrom(templateComponents);
    return db.transaction(async (tx) => {
        // Revisions are removed by the FK cascade. If insertion fails, the
        // transaction restores every previous page instead of leaving an
        // empty project behind.
        await tx.delete(pages).where(eq(pages.siteId, siteId));
        const templateFont = {
            fontFamily: templatePages[0].rootStyle.fontFamily,
            customFonts: templatePages[0].rootStyle.customFonts ?? [],
        };
        const templateTransition = {
            pageTransition: templatePages[0].rootStyle.pageTransition ?? DEFAULT_ROOT_STYLE.pageTransition,
            pageTransitionDuration: templatePages[0].rootStyle.pageTransitionDuration ?? DEFAULT_ROOT_STYLE.pageTransitionDuration,
        };
        await tx.update(sites).set({ ...templateFont, ...templateTransition, components, publishedComponents: [], updatedAt: new Date() }).where(eq(sites.id, siteId));
        const created = await tx.insert(pages).values(templatePages.map((template) => ({
            siteId,
            name: template.name,
            slug: template.slug,
            elements: syncComponentInstances(withoutComponentMasters(template.elements), components),
            rootStyle: withSiteTransition(withSiteFont(template.rootStyle, templateFont), templateTransition),
            dataSources: template.dataSources ?? [],
        }))).returning({ id: pages.id, slug: pages.slug });
        return created.find((page) => page.slug === templatePages[0].slug)?.id;
    });
}

export async function duplicatePage(pageId: string, name: string, slug: string) {
    const source = await getPage(pageId);
    if (!source) return undefined;

    const [created] = await db
        .insert(pages)
        .values({
            siteId: source.siteId,
            name,
            slug,
            elements: withoutComponentMasters(source.elements),
            rootStyle: source.rootStyle ?? DEFAULT_ROOT_STYLE,
        })
        .onConflictDoNothing({ target: [pages.siteId, pages.slug] })
        .returning({ id: pages.id });

    return created?.id;
}

export async function renamePage(pageId: string, name: string, slug: string) {
    const current = await getPage(pageId);
    if (!current || (current.slug === DEFAULT_PAGE_SLUG && slug !== DEFAULT_PAGE_SLUG)) return undefined;
    const [updated] = await db
        .update(pages)
        .set({ name, slug, updatedAt: new Date() })
        .where(eq(pages.id, pageId))
        .returning({ id: pages.id });
    return updated?.id;
}

/** Refuses to delete the last page, so the editor always has something to open. */
export async function deletePage(pageId: string) {
    const siteId = await getDefaultSiteId();
    await getOrCreateDefaultPage();
    const [target] = await db
        .select({ slug: pages.slug })
        .from(pages)
        .where(and(eq(pages.siteId, siteId), eq(pages.id, pageId)))
        .limit(1);
    if (!target) return { deleted: false as const, reason: "not-found" as const };
    if (target.slug === DEFAULT_PAGE_SLUG) {
        return { deleted: false as const, reason: "home-required" as const };
    }
    const remaining = await db
        .select({ id: pages.id })
        .from(pages)
        .where(and(eq(pages.siteId, siteId), ne(pages.id, pageId)))
        .limit(1);

    if (remaining.length === 0) return { deleted: false as const, reason: "last-page" as const };

    await db.delete(pages).where(eq(pages.id, pageId));
    return { deleted: true as const, fallbackId: remaining[0].id };
}

/**
 * A page's saved revisions, newest first.
 *
 * The bodies are left out: a list is for choosing, and a document carries its
 * whole element tree — sending every version's tree to draw a list of dates
 * would be megabytes for a decision that needs kilobytes.
 */
export async function listRevisions(pageId: string) {
    const rows = await db
        .select({
            id: pageRevisions.id,
            version: pageRevisions.version,
            createdAt: pageRevisions.createdAt,
        })
        .from(pageRevisions)
        .where(eq(pageRevisions.pageId, pageId))
        .orderBy(desc(pageRevisions.createdAt))
        .limit(REVISION_LIMIT);
    return rows;
}

/**
 * Puts an older revision back into the draft.
 *
 * Restoring is itself a save, so the version advances and the state being
 * replaced is written to the history first — an author who restores the wrong
 * revision can walk back out of it.
 *
 * The published copy is untouched: bringing an old draft back is not the same
 * as publishing it, and the two decisions belong to the author separately.
 */
export async function restoreRevision(pageId: string, revisionId: string) {
    const [revision] = await db
        .select()
        .from(pageRevisions)
        .where(and(eq(pageRevisions.id, revisionId), eq(pageRevisions.pageId, pageId)))
        .limit(1);
    if (!revision) return { status: "not-found" as const };

    const page = await getPage(pageId);
    if (!page) return { status: "not-found" as const };

    return savePageDocument(
        pageId,
        revision.elements as CanvasElement[],
        (revision.rootStyle as RootStyle | null) ?? page.rootStyle,
        // Data sources are not versioned with the document, so the page keeps
        // the ones it has: restoring a layout must not silently unhook the
        // sources the author wired up since.
        page.dataSources ?? [],
        page.version,
    );
}

async function pruneRevisions(pageId: string) {
    const keep = await db
        .select({ id: pageRevisions.id })
        .from(pageRevisions)
        .where(eq(pageRevisions.pageId, pageId))
        .orderBy(desc(pageRevisions.createdAt))
        .limit(REVISION_LIMIT);

    if (keep.length < REVISION_LIMIT) return;

    await db.delete(pageRevisions).where(
        and(
            eq(pageRevisions.pageId, pageId),
            notInArray(
                pageRevisions.id,
                keep.map((r) => r.id),
            ),
        ),
    );
}
