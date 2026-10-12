import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { requireSessionEnv } from './env';

const COOKIE_NAME = 'chatdex_demo_session';
export const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001';
export const DEMO_RECIPIENT_ID = '00000000-0000-4000-8000-000000000002';

type Session = { userId: string; mode: 'demo'; expiresAt: number };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function signature(body: string) {
  return createHmac('sha256', requireSessionEnv().sessionSecret).update(body).digest('base64url');
}

export function createDemoSessionValue(now = new Date(), userId = DEMO_USER_ID) {
  if (!UUID.test(userId)) throw new Error('Unsupported demo identity');
  const body = Buffer.from(JSON.stringify({ userId, mode: 'demo', expiresAt: now.getTime() + 60 * 60_000 } satisfies Session)).toString('base64url');
  return `${body}.${signature(body)}`;
}

export async function getSession(): Promise<Session | null> {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return null;
  const [body, supplied] = value.split('.');
  if (!body || !supplied) return null;
  const expected = signature(body);
  if (supplied.length !== expected.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Session;
    const validUser = UUID.test(parsed.userId);
    return parsed.mode === 'demo' && validUser && parsed.expiresAt > Date.now() ? parsed : null;
  } catch { return null; }
}

export const demoSessionCookie = { name: COOKIE_NAME, options: { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 3600 } };
