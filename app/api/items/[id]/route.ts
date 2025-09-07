import { getDb } from '@/lib/db';

export const runtime = 'edge';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const sql = getDb();
    const rows = await sql`
      select id, user_id, title, short_description, long_description, image_url, sale_type,
             reserve_price, buy_now_price, status, auction_start, auction_end, created_at
      from items
      where id = ${id}
    `;
    const item = rows[0] ?? null;
    if (!item) return new Response('Not found', { status: 404 });
    return new Response(JSON.stringify({ ok: true, item }), { headers: { 'content-type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: String(err?.message ?? err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}

