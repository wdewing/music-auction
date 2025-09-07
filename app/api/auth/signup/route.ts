import { getDb } from '@/lib/db';
import { createSession, hashPassword } from '@/lib/auth';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const emailRaw = String(body.email ?? '').trim();
    const password = String(body.password ?? '');
    if (!emailRaw || !emailRaw.includes('@')) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid email' }), { status: 400 });
    }
    if (password.length < 8) {
      return new Response(JSON.stringify({ ok: false, error: 'Password must be at least 8 characters' }), { status: 400 });
    }
    const email = emailRaw.toLowerCase();
    const sql = getDb();

    const existing = await sql`select id from users where email = ${email}`;
    if (existing.length) {
      return new Response(JSON.stringify({ ok: false, error: 'Email already in use' }), { status: 409 });
    }

    const userId = crypto.randomUUID();
    const pwHash = await hashPassword(password);
    await sql`insert into users (id, email, password_hash) values (${userId}, ${email}, ${pwHash})`;

    const { cookie } = await createSession(userId);
    return new Response(JSON.stringify({ ok: true, user: { id: userId, email } }), {
      status: 201,
      headers: { 'content-type': 'application/json', 'set-cookie': cookie },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: String(err?.message ?? err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}

