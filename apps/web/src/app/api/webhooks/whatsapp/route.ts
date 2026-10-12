import { NextResponse } from 'next/server';
import { getWhatsAppMessageService } from '@/lib/whatsapp-runtime';
import { requireWhatsAppWebhookEnv } from '@/lib/env';
import { verifyWebhookChallenge, verifyWebhookSignature } from '@chatdex/whatsapp';
import { allowRequest } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export function GET(request: Request) {
  let verifyToken: string;
  try {
    verifyToken = requireWhatsAppWebhookEnv().verifyToken;
  } catch {
    return NextResponse.json({ data: null, error: { code: 'NOT_CONFIGURED', message: 'Webhook is not configured' }, meta: {} }, { status: 503 });
  }
  const result = verifyWebhookChallenge(new URL(request.url).searchParams, verifyToken);
  return result.ok ? new Response(result.challenge, { status: 200 }) : new Response('Forbidden', { status: 403 });
}

export async function POST(request: Request) {
  if (!allowRequest(request, 'whatsapp-webhook', 600)) return new Response('Too many requests', { status: 429 });
  let appSecret: string;
  try {
    appSecret = requireWhatsAppWebhookEnv().appSecret;
  } catch {
    return NextResponse.json({ data: null, error: { code: 'NOT_CONFIGURED', message: 'Webhook is not configured' }, meta: {} }, { status: 503 });
  }

  const rawBody = await request.text();
  if (!verifyWebhookSignature(rawBody, request.headers.get('x-hub-signature-256'), appSecret)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const correlationId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    await getWhatsAppMessageService().handleWebhook(JSON.parse(rawBody), correlationId);
  } catch (error) {
    console.error('whatsapp_webhook_failed', { correlationId, error: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ data: null, error: { code: 'WEBHOOK_PROCESSING_FAILED', message: 'Webhook processing failed' }, meta: { correlationId } }, { status: 500 });
  }
  return NextResponse.json({ data: { accepted: true }, error: null, meta: { correlationId } });
}
