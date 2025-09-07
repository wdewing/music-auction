import { getDb } from '@/lib/db';

// Minimal auth utilities for Edge runtime (Cloudflare/Workers compatible)

function toUint8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function fromUint8(buf: Uint8Array): string {
  return new TextDecoder().decode(buf);
}

function b64urlEncode(bytes: Uint8Array): string {
  // Convert to regular base64 then make it URL-safe
  const b64 = Buffer.from(bytes).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function b64urlDecode(str: string): Uint8Array {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

export type Session = {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
};

export type User = {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
};

// Password hashing with scrypt-js (pure JS, edge-safe)
export async function hashPassword(password: string): Promise<string> {
  const { scrypt } = await import('scrypt-js');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const N = 16384, r = 8, p = 1, dkLen = 32;
  const passBytes = toUint8(password);
  const out = new Uint8Array(dkLen);
  await scrypt(passBytes, salt, N, r, p, out);
  return `scrypt$${N}$${r}$${p}$${b64urlEncode(salt)}$${b64urlEncode(out)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const { scrypt } = await import('scrypt-js');
    const [scheme, nStr, rStr, pStr, saltB64, hashB64] = stored.split('$');
    if (scheme !== 'scrypt') return false;
    const N = parseInt(nStr, 10);
    const r = parseInt(rStr, 10);
    const p = parseInt(pStr, 10);
    const salt = b64urlDecode(saltB64);
    const expected = b64urlDecode(hashB64);
    const out = new Uint8Array(expected.length);
    await scrypt(toUint8(password), salt, N, r, p, out);
    // Constant-time comparison
    if (out.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < out.length; i++) diff |= out[i] ^ expected[i];
    return diff === 0;
  } catch {
    return false;
  }
}

export function parseCookies(cookieHeader: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = decodeURIComponent(part.slice(idx + 1).trim());
    out[k] = v;
  }
  return out;
}

export function makeCookie(name: string, value: string, opts: { maxAgeSeconds?: number; path?: string } = {}): string {
  const attrs = [
    `${name}=${encodeURIComponent(value)}`,
    'HttpOnly',
    'SameSite=Lax',
    'Secure',
    `Path=${opts.path ?? '/'}`,
  ];
  if (opts.maxAgeSeconds != null) attrs.push(`Max-Age=${opts.maxAgeSeconds}`);
  return attrs.join('; ');
}

export function deleteCookie(name: string, path: string = '/'): string {
  return `${name}=; Path=${path}; Max-Age=0; HttpOnly; SameSite=Lax; Secure`;
}

export async function createSession(userId: string): Promise<{ token: string; cookie: string; expiresAt: Date }>{
  const sql = getDb();
  const tokenBytes = new Uint8Array(32);
  crypto.getRandomValues(tokenBytes);
  const token = b64urlEncode(tokenBytes);
  const sessionId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30d
  await sql`insert into sessions (id, user_id, token, expires_at) values (${sessionId}, ${userId}, ${token}, ${expiresAt.toISOString()})`;
  const cookie = makeCookie('session', token, { maxAgeSeconds: 30 * 24 * 60 * 60 });
  return { token, cookie, expiresAt };
}

export async function getUserFromRequest(req: Request): Promise<User | null> {
  const sql = getDb();
  const cookies = parseCookies(req.headers.get('cookie'));
  const token = cookies['session'];
  if (!token) return null;
  const rows = await sql<{ user_id: string }[]>`select user_id from sessions where token = ${token} and expires_at > now()`;
  const userId = rows[0]?.user_id;
  if (!userId) return null;
  const users = await sql<User[]>`select id, email, password_hash, created_at from users where id = ${userId}`;
  return users[0] ?? null;
}

export async function destroySessionByRequest(req: Request): Promise<void> {
  const sql = getDb();
  const cookies = parseCookies(req.headers.get('cookie'));
  const token = cookies['session'];
  if (!token) return;
  await sql`delete from sessions where token = ${token}`;
}

