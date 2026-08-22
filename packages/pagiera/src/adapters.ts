import type { PagieraDocument } from "./document.js";

export type PagieraPageSummary = {
    id: string;
    name: string;
    slug: string;
    published?: boolean;
};

export type PagieraSaveResult =
    | { status: "saved"; version?: number }
    | { status: "conflict"; document: PagieraDocument; version?: number }
    | { status: "error"; message: string };

export type PagieraDataPreview = {
    rows: Array<Record<string, unknown>>;
    keys: string[];
};

export type PagieraAdapters = {
    persistence?: {
        save(document: PagieraDocument, context: { pageId?: string; version?: number }): Promise<PagieraSaveResult>;
    };
    pages?: {
        list(): Promise<PagieraPageSummary[]>;
        load(pageId: string): Promise<PagieraDocument>;
        create(input: { name: string; slug: string }): Promise<PagieraPageSummary>;
        rename(pageId: string, input: { name: string; slug: string }): Promise<void>;
        duplicate(pageId: string, input: { name: string; slug: string }): Promise<PagieraPageSummary>;
        delete(pageId: string): Promise<void>;
        publish(pageId: string, document: PagieraDocument): Promise<{ url?: string }>;
        unpublish(pageId: string): Promise<void>;
    };
    ai?: {
        generate(input: { prompt: string; document: PagieraDocument; breakpoint: string; history?: Array<{ role: "user" | "assistant"; text: string }> }): Promise<PagieraDocument>;
    };
    data?: {
        preview(source: unknown, context?: Record<string, unknown>): Promise<PagieraDataPreview>;
    };
    assets?: {
        upload(file: File): Promise<{ url: string; name?: string }>;
        list?(): Promise<Array<{ id: string; name: string; url: string; type?: string }>>;
    };
    templates?: {
        install(templateId: string): Promise<{ pages: PagieraPageSummary[]; activePageId?: string }>;
    };
    navigation?: {
        openPage(pageId: string): void;
        openPreview?(pageId?: string): void;
        openPublished?(url: string): void;
    };
};
