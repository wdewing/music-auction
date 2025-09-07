import { getDb } from '@/lib/db';
import { createSession, verifyPassword } from '@/lib/auth';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const emailRaw = String(body.email ?? '').trim();
    const password = String(body.password ?? '');
    if (!emailRaw || !emailRaw.includes('@')) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid email' }), { status: 400 });
    }
    const email = emailRaw.toLowerCase();
    const sql = getDb();

    const users = await sql<{ id: string; password_hash: string }[]>`select id, password_hash from users where email = ${email}`;
    const user = users[0];
    if (!user) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid credentials' }), { status: 401 });
    }
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid credentials' }), { status: 401 });
    }
    const { cookie } = await createSession(user.id);
    return new Response(JSON.stringify({ ok: true, user: { id: user.id, email } }), {
      headers: { 'content-type': 'application/json', 'set-cookie': cookie },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: String(err?.message ?? err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}

