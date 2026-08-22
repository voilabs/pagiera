import type { Pool } from "pg";
import type { RedisClientType } from "redis";

export type PagieraServerConfig = {
    postgresUrl: string;
    redisUrl: string;
    openRouterApiKey: string;
    openRouterModel: string;
    basePath?: string;
    aiRateLimitPerMinute?: number;
};

export function pagieraConfigFromEnv(env?: NodeJS.ProcessEnv): PagieraServerConfig;
export function createPagieraServer(config: PagieraServerConfig): Promise<{
    handle(request: Request): Promise<Response>;
    getEditorBootstrap(pageId?: string): Promise<any | undefined>;
    getPreviewPage(pageId: string, context?: Record<string, unknown>): Promise<any | undefined>;
    getPublishedDocument(slug: string): Promise<any | undefined>;
    getPublishedPage(slug: string, context?: Record<string, unknown>): Promise<(any & { data: Record<string, unknown> }) | undefined>;
    close(): Promise<void>;
    redis: RedisClientType;
    pool: Pool;
}>;
export function getPagieraServer(config: PagieraServerConfig): ReturnType<typeof createPagieraServer>;
export function createPagieraRouteHandlers(config: PagieraServerConfig): {
    GET(request: Request): Promise<Response>;
    POST(request: Request): Promise<Response>;
    PUT(request: Request): Promise<Response>;
    PATCH(request: Request): Promise<Response>;
    DELETE(request: Request): Promise<Response>;
};
