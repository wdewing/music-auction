import { getDb } from '@/lib/db';

export const runtime = 'edge';

// Simple migration endpoint for development. Protect with MIGRATION_TOKEN.
export async function POST(req: Request) {
  const token = req.headers.get('x-migrate-token') ?? '';
  const required = process.env.MIGRATION_TOKEN ?? '';
  const isAllowed = (required && token === required) || process.env.NODE_ENV !== 'production';
  if (!isAllowed) {
    return new Response('Forbidden', { status: 403 });
  }

  const sql = getDb();
  try {
    // Users
    await sql`
      create table if not exists users (
        id uuid primary key,
        email text unique not null,
        password_hash text not null,
        created_at timestamptz default now()
      )
    `;

    // Sessions
    await sql`
      create table if not exists sessions (
        id uuid primary key,
        user_id uuid not null references users(id) on delete cascade,
        token text unique not null,
        expires_at timestamptz not null,
        created_at timestamptz default now()
      )
    `;

    // Items
    await sql`
      create table if not exists items (
        id uuid primary key,
        user_id uuid not null references users(id) on delete cascade,
        title text not null,
        short_description text not null,
        long_description text not null,
        image_url text not null,
        sale_type text not null check (sale_type in ('auction','fixed')),
        reserve_price numeric(12,2),
        buy_now_price numeric(12,2),
        status text not null default 'active' check (status in ('draft','active','ended')),
        auction_start timestamptz,
        auction_end timestamptz,
        created_at timestamptz default now(),
        constraint items_sale_type_consistent check (
          (sale_type = 'auction' and buy_now_price is null and auction_end is not null)
          or
          (sale_type = 'fixed' and buy_now_price is not null and reserve_price is null and auction_start is null and auction_end is null)
        )
      )
    `;

    // Indexes to improve search and status filters
    await sql`create index if not exists idx_items_status on items(status)`;
    await sql`create index if not exists idx_items_auction_end on items(auction_end)`;
    await sql`create index if not exists idx_items_title on items(lower(title))`;
    await sql`create index if not exists idx_items_short_desc on items(lower(short_description))`;

    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: String(err?.message ?? err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}

