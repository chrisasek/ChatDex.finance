import { NextResponse } from 'next/server';
import { createDemoSessionValue, demoSessionCookie, DEMO_RECIPIENT_ID } from '@/lib/session';
import { env, requireSessionEnv } from '@/lib/env';
import { allowRequest } from '@/lib/rate-limit';
import { createFreshDemoUser } from '@/lib/whatsapp-runtime';

export async function POST(request: Request) {
  if (!allowRequest(request, 'demo-auth', 20)) return new Response('Too many requests', { status: 429 });
  if (env.DEMO_MODE !== 'true') return new Response('Not found', { status: 404 });
  try { requireSessionEnv(); } catch { return new Response('Demo authentication is not configured', { status: 503 }); }
  if (request.headers.get('sec-fetch-site') && request.headers.get('sec-fetch-site') !== 'same-origin') return new Response('Forbidden', { status: 403 });
  const form = await request.formData();
  const destination = String(form.get('continue') ?? '');
  if (destination !== '/app' && !/^\/action\/[A-Za-z0-9_-]{43}$/.test(destination) && !/^\/c\/[A-Za-z0-9_-]{43}\.[A-Za-z0-9_-]{43}$/.test(destination)) return new Response('Invalid continuation', { status: 400 });
  let identity: string;
  try {
    identity = form.get('identity') === 'claim-recipient' ? DEMO_RECIPIENT_ID : await createFreshDemoUser();
  } catch (error) {
    console.error('Fresh demo session failed', { message: error instanceof Error ? error.message : 'unknown' });
    return new Response('The demo is temporarily unavailable', { status: 503 });
  }
  // Keep the redirect relative so reverse proxies such as cPanel/Passenger do
  // not leak their internal 0.0.0.0:PORT origin into the public response.
  const response = new NextResponse(null, { status: 303, headers: { location: destination } });
  response.cookies.set(demoSessionCookie.name, createDemoSessionValue(new Date(), identity), demoSessionCookie.options);
  return response;
}
