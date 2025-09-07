// Simple health endpoint that can be used to verify the runtime.
export const runtime = 'edge';

export async function GET() {
  return new Response(JSON.stringify({ ok: true, ts: Date.now() }), {
    headers: { 'content-type': 'application/json' },
  });
}

