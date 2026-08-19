import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;

function databaseUrl(): string | null {
  const url = (
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    ""
  ).trim();
  if (!url || url.startsWith("#")) return null;

  const lower = url.toLowerCase();
  if (lower.includes("neon.tech") && !lower.includes("sslmode=")) {
    return `${url}${url.includes("?") ? "&" : "?"}sslmode=require`;
  }
  return url;
}

export function postgresConfigured(): boolean {
  return databaseUrl() !== null;
}

function getPool(): pg.Pool {
  const url = databaseUrl();
  if (!url) {
    throw new Error(
      "DATABASE_URL is not configured. Set it in .env.local to match the analytics backend."
    );
  }
  if (!pool) {
    pool = new Pool({ connectionString: url });
  }
  return pool;
}

export async function queryRows<T extends Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const client = getPool();
  const result = await client.query<T>(sql, params);
  return result.rows;
}
