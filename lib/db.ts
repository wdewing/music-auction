// Neon serverless Postgres client for edge/Cloudflare runtimes.
// Requires DATABASE_URL in env, e.g. from Neon (https://neon.tech)
// Example: DATABASE_URL="postgres://user:pass@host/db?sslmode=require"

import { neon, neonConfig } from '@neondatabase/serverless';

// Helps reuse HTTP connections across requests in Workers/edge.
neonConfig.fetchConnectionCache = true;

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Missing DATABASE_URL');
  return neon(url);
}

export async function selectNow() {
  const sql = getDb();
  const rows = await sql`select now()`;
  return rows[0]?.now as string | undefined;
}

