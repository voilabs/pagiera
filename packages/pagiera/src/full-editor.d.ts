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
    generate?(request: Record<string, unknown>): Promise<Record<string, unknown>>;
    previewSource?(source: unknown, sampleQuery: string): Promise<
        | { status: "ok"; rows: Array<Record<string, unknown>>; keys: string[]; total: number }
        | { status: "error"; message: string }
    >;
    createPage?(name: string, slug: string): Promise<PagieraMutationResult>;
    renamePage?(id: string, name: string, slug: string): Promise<PagieraMutationResult>;
    duplicatePage?(id: string, name: string, slug: string): Promise<PagieraMutationResult>;
    deletePage?(id: string): Promise<PagieraMutationResult>;
    installTemplate?(template: string | { schemaVersion: 1; id: string; version: string; pages: unknown[] }): Promise<PagieraMutationResult>;
    publishPage?(id: string): Promise<PagieraMutationResult>;
    unpublishPage?(id: string, slug: string): Promise<PagieraMutationResult>;
    navigate?(pageId: string, options?: { replace?: boolean }): void | Promise<void>;
    refresh?(): void;
    previewHref?(pageId: string): string;
    publishedHref?(slug: string): string;
};

export type PagieraStudioProps = {
    page: PagieraStudioPage;
    pages: Array<{ id: string; name: string; slug: string; published?: boolean }>;
    library: unknown[];
    adapters: PagieraStudioAdapters;
    templateRegistryUrl?: string;
};

export const PagieraStudio: ComponentType<PagieraStudioProps>;
export default PagieraStudio;
