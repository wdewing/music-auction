import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export const runtime = 'edge';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('search') ?? '').trim().toLowerCase();
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10) || 20));
    const offset = (page - 1) * pageSize;
    const sql = getDb();

    let rows;
    if (q) {
      rows = await sql`
        select id, title, short_description, image_url, sale_type, buy_now_price, status, auction_end
        from items
        where status = 'active' and (lower(title) like ${'%' + q + '%'} or lower(short_description) like ${'%' + q + '%'})
        order by created_at desc
        limit ${pageSize} offset ${offset}
      `;
    } else {
      rows = await sql`
        select id, title, short_description, image_url, sale_type, buy_now_price, status, auction_end
        from items
        where status = 'active'
        order by created_at desc
        limit ${pageSize} offset ${offset}
      `;
    }
    return new Response(JSON.stringify({ ok: true, items: rows }), { headers: { 'content-type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: String(err?.message ?? err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

    const body = await req.json().catch(() => ({}));
    const title = String(body.title ?? '').trim();
    const short_description = String(body.short_description ?? '').trim();
    const long_description = String(body.long_description ?? '').trim();
    const image_url = String(body.image_url ?? '').trim();
    const sale_type = String(body.sale_type ?? '').trim();
    let reserve_price = body.reserve_price != null ? Number(body.reserve_price) : null;
    let buy_now_price = body.buy_now_price != null ? Number(body.buy_now_price) : null;

    if (!title || !short_description || !long_description || !image_url) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing required fields' }), { status: 400 });
    }
    if (!/^https?:\/\//i.test(image_url)) {
      return new Response(JSON.stringify({ ok: false, error: 'image_url must be http(s) URL' }), { status: 400 });
    }
    if (title.length > 120 || short_description.length > 280) {
      return new Response(JSON.stringify({ ok: false, error: 'Title or short description too long' }), { status: 400 });
    }
    if (sale_type !== 'auction' && sale_type !== 'fixed') {
      return new Response(JSON.stringify({ ok: false, error: "sale_type must be 'auction' or 'fixed'" }), { status: 400 });
    }
    if (reserve_price != null && (isNaN(reserve_price) || reserve_price < 0)) {
      return new Response(JSON.stringify({ ok: false, error: 'reserve_price must be >= 0' }), { status: 400 });
    }
    if (buy_now_price != null && (isNaN(buy_now_price) || buy_now_price <= 0)) {
      return new Response(JSON.stringify({ ok: false, error: 'buy_now_price must be > 0' }), { status: 400 });
    }

    const sql = getDb();
    const id = crypto.randomUUID();
    if (sale_type === 'auction') {
      // Auctions run for 7 days
      const now = new Date();
      const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      buy_now_price = null; // enforced by constraint
      await sql`
        insert into items (
          id, user_id, title, short_description, long_description, image_url, sale_type,
          reserve_price, buy_now_price, status, auction_start, auction_end
        ) values (
          ${id}, ${user.id}, ${title}, ${short_description}, ${long_description}, ${image_url}, ${sale_type},
          ${reserve_price}, ${buy_now_price}, 'active', ${now.toISOString()}, ${end.toISOString()}
        )
      `;
    } else {
      // Fixed price item
      reserve_price = null; // enforced by constraint
      if (buy_now_price == null) {
        return new Response(JSON.stringify({ ok: false, error: 'buy_now_price required for fixed items' }), { status: 400 });
      }
      await sql`
        insert into items (
          id, user_id, title, short_description, long_description, image_url, sale_type,
          reserve_price, buy_now_price, status
        ) values (
          ${id}, ${user.id}, ${title}, ${short_description}, ${long_description}, ${image_url}, ${sale_type},
          ${reserve_price}, ${buy_now_price}, 'active'
        )
      `;
    }

    return new Response(JSON.stringify({ ok: true, id }), { status: 201, headers: { 'content-type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: String(err?.message ?? err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}

