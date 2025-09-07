import { deleteCookie, destroySessionByRequest } from '@/lib/auth';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    await destroySessionByRequest(req);
    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        'content-type': 'application/json',
        'set-cookie': deleteCookie('session'),
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: String(err?.message ?? err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}

