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
    return page;
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
    return {
        name: page.name,
        elements: page.elements,
        rootStyle: page.rootStyle ?? DEFAULT_ROOT_STYLE,
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

    const [existing] = await db
        .select()
        .from(pages)
        .where(and(eq(pages.siteId, siteId), eq(pages.slug, DEFAULT_PAGE_SLUG)))
        .limit(1);
    if (existing) return existing;

    await db
        .insert(pages)
        .values({
            siteId,
            name: "Home",
            slug: DEFAULT_PAGE_SLUG,
            elements: [],
            rootStyle: DEFAULT_ROOT_STYLE,
        })
        .onConflictDoNothing({ target: [pages.siteId, pages.slug] });

    const [page] = await db
        .select()
        .from(pages)
        .where(and(eq(pages.siteId, siteId), eq(pages.slug, DEFAULT_PAGE_SLUG)))
        .limit(1);
    if (!page) throw new Error("Failed to create the default page");
    return page;
}

/* ------------------------------------------------------------------- writes */

export type SaveResult =
    | { status: "saved"; version: number }
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
    const [updated] = await db
        .update(pages)
        .set({
            elements,
            rootStyle,
            dataSources,
            version: sql`${pages.version} + 1`,
            updatedAt: new Date(),
        })
        .where(and(eq(pages.id, pageId), eq(pages.version, expectedVersion)))
        .returning({ version: pages.version });

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
        return {
            status: "conflict",
            version: current.version,
            elements: current.elements,
            rootStyle: current.rootStyle ?? DEFAULT_ROOT_STYLE,
            dataSources: current.dataSources ?? [],
        };
    }

    await db
        .insert(pageRevisions)
        .values({ pageId, version: updated.version, elements, rootStyle });
    await pruneRevisions(pageId);

    return { status: "saved", version: updated.version };
}

/** Copies the current draft into the published columns. */
export async function publishPage(pageId: string) {
    const [updated] = await db
        .update(pages)
        .set({
            publishedElements: sql`${pages.elements}`,
            publishedRootStyle: sql`${pages.rootStyle}`,
            publishedDataSources: sql`${pages.dataSources}`,
            publishedAt: new Date(),
        })
        .where(eq(pages.id, pageId))
        .returning({ slug: pages.slug, publishedAt: pages.publishedAt });

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
    const [created] = await db
        .insert(pages)
        .values({
            siteId,
            name,
            slug,
            elements: [],
            rootStyle: DEFAULT_ROOT_STYLE,
        })
        .onConflictDoNothing({ target: [pages.siteId, pages.slug] })
        .returning({ id: pages.id });

    return created?.id;
}

/** Atomically replaces the current site's pages with a complete template. */
export async function installTemplatePages(templatePages: SiteTemplatePage[]) {
    const siteId = await getDefaultSiteId();
    if (templatePages.length === 0) return undefined;
    if (!templatePages.some((template) => template.slug === DEFAULT_PAGE_SLUG)) {
        throw new Error("Every site template must include a home page.");
    }
    return db.transaction(async (tx) => {
        // Revisions are removed by the FK cascade. If insertion fails, the
        // transaction restores every previous page instead of leaving an
        // empty project behind.
        await tx.delete(pages).where(eq(pages.siteId, siteId));
        const created = await tx.insert(pages).values(templatePages.map((template) => ({
            siteId,
            name: template.name,
            slug: template.slug,
            elements: template.elements,
            rootStyle: template.rootStyle,
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
            elements: source.elements,
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
