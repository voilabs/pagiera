import {
    index,
    integer,
    jsonb,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import {
    type CanvasElement,
    type DataSource,
    DEFAULT_ROOT_STYLE,
    type RootStyle,
} from "../lib/editor/types";

export const sites = pgTable(
    "sites",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        name: text("name").notNull(),
        slug: text("slug").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (t) => [uniqueIndex("sites_slug_key").on(t.slug)],
);

export const pages = pgTable(
    "pages",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        siteId: uuid("site_id")
            .notNull()
            .references(() => sites.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        slug: text("slug").notNull(),
        /**
         * Flat list of canvas elements; nesting is expressed through
         * `parentId`, mirroring the editor's in-memory state exactly so a save
         * is a single atomic write instead of a per-element diff.
         */
        elements: jsonb("elements").$type<CanvasElement[]>().notNull().default([]),
        /** Page-level container settings: max width, background, root layout. */
        rootStyle: jsonb("root_style")
            .$type<RootStyle>()
            .notNull()
            .default(DEFAULT_ROOT_STYLE),
        /** JSON endpoints this page pulls content from. */
        dataSources: jsonb("data_sources").$type<DataSource[]>().notNull().default([]),
        /** Bumped on every write; used for optimistic concurrency on save. */
        version: integer("version").notNull().default(1),
        /**
         * Snapshot taken by Publish. The public site reads these columns, so
         * drafts never leak before the author is ready.
         */
        publishedElements: jsonb("published_elements").$type<CanvasElement[]>(),
        publishedRootStyle: jsonb("published_root_style").$type<RootStyle>(),
        publishedDataSources: jsonb("published_data_sources").$type<DataSource[]>(),
        publishedAt: timestamp("published_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (t) => [
        uniqueIndex("pages_site_id_slug_key").on(t.siteId, t.slug),
        index("pages_site_id_idx").on(t.siteId),
    ],
);

/**
 * Append-only snapshot taken on each successful save, so undo survives a
 * reload and a bad autosave can be rolled back.
 */
export const pageRevisions = pgTable(
    "page_revisions",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        pageId: uuid("page_id")
            .notNull()
            .references(() => pages.id, { onDelete: "cascade" }),
        version: integer("version").notNull(),
        elements: jsonb("elements").$type<CanvasElement[]>().notNull(),
        rootStyle: jsonb("root_style").$type<RootStyle>(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (t) => [index("page_revisions_page_id_created_at_idx").on(t.pageId, t.createdAt)],
);

export type Site = typeof sites.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type PageRevision = typeof pageRevisions.$inferSelect;
