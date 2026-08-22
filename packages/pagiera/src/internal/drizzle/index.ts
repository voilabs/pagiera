import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error(
        "DATABASE_URL is not set. Copy .env.example to .env.local and start Postgres with `docker compose up -d`.",
    );
}

/**
 * Next's dev server re-evaluates modules on every hot reload, which would open
 * a fresh pool each time and exhaust Postgres connections. Cache it on
 * globalThis so reloads reuse the same pool.
 */
const globalForDb = globalThis as unknown as { pagieraPool?: Pool };

const pool =
    globalForDb.pagieraPool ??
    new Pool({ connectionString, max: 10, idleTimeoutMillis: 30_000 });

if (process.env.NODE_ENV !== "production") {
    globalForDb.pagieraPool = pool;
}

export const db = drizzle({ client: pool });

export * from "./schema";
