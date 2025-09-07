import { selectNow } from '@/lib/db';

export const runtime = 'edge';

export async function GET() {
  try {
    const now = await selectNow();
    return new Response(JSON.stringify({ ok: true, now }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: String(err?.message ?? err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}

