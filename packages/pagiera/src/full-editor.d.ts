import type { ComponentType } from "react";

export type PagieraMutationResult =
    | { status: "ok"; pageId?: string; slug?: string }
    | { status: "error"; message: string };

export type PagieraStudioDocument = {
    elements: unknown[];
    rootStyle: Record<string, unknown>;
    dataSources: unknown[];
};

export type PagieraStudioPage = PagieraStudioDocument & {
    id: string;
    name: string;
    slug: string;
    version: number;
    publishedAt: string | null;
};

export type PagieraStudioAdapters = {
    save(pageId: string, document: PagieraStudioDocument, expectedVersion: number): Promise<
        | { status: "saved"; version: number }
        | ({ status: "conflict"; version: number } & PagieraStudioDocument)
        | { status: "error"; message: string }
    >;
    /** `onEvent` receives one progress event per model pass as it completes. */
    generate?(request: Record<string, unknown>, onEvent?: (event: unknown) => void): Promise<Record<string, unknown>>;
    previewSource?(source: unknown, sampleQuery: string): Promise<
        | { status: "ok"; rows: Array<Record<string, unknown>>; keys: string[]; total: number }
        | { status: "error"; message: string }
    >;
    createPage?(name: string, slug: string): Promise<PagieraMutationResult>;
    renamePage?(id: string, name: string, slug: string): Promise<PagieraMutationResult>;
    duplicatePage?(id: string, name: string, slug: string): Promise<PagieraMutationResult>;
    deletePage?(id: string): Promise<PagieraMutationResult>;
    installTemplate?(templateId: string): Promise<PagieraMutationResult>;
    setSiteFont?(fontFamily: string, customFonts?: unknown[]): Promise<unknown>;
    setSiteTransition?(pageTransition: "smooth" | "fade" | "slide" | "none", pageTransitionDuration: number): Promise<unknown>;
    publishPage?(id: string): Promise<PagieraMutationResult>;
    unpublishPage?(id: string, slug: string): Promise<PagieraMutationResult>;
    navigate?(pageId: string, options?: { replace?: boolean }): void | Promise<void>;
    editorHref?(pageId: string, panel?: string): string;
    refresh?(): void;
    previewHref?(pageId: string): string;
    /** Saved versions of a page, newest first. */
    listRevisions?(pageId: string): Promise<unknown>;
    /** Puts a saved version back into the draft. */
    restoreRevision?(pageId: string, revisionId: string): Promise<unknown>;
    /**
     * Stores an image somewhere durable and answers with its URL.
     *
     * Without it an uploaded image is inlined into the document as a data URI,
     * which the document then carries on every read. A host with file storage
     * supplies this and the document keeps a URL instead.
     */
    uploadImage?(file: File): Promise<string>;
    publishedHref?(slug: string): string;
};

export type PagieraStudioProps = {
    page: PagieraStudioPage;
    pages: Array<{ id: string; name: string; slug: string; published?: boolean }>;
    library: unknown[];
    adapters: PagieraStudioAdapters;
    templateRegistryUrl?: string;
    /** Server-resolved editor panel used for the very first render. */
    initialPanel?: string;
};

export const PagieraStudio: ComponentType<PagieraStudioProps>;
export default PagieraStudio;
