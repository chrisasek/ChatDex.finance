import { NextResponse } from 'next/server';
import { decryptFlowRequest, encryptFlowResponse, getFlowFailureCode, verifyWebhookSignature } from '@chatdex/whatsapp';
import { requireWhatsAppFlowEnv } from '@/lib/env';
import { getBuyFlowService } from '@/lib/whatsapp-runtime';
import { allowRequest } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!allowRequest(request, 'whatsapp-flow', 120)) return new Response('Too many requests', { status: 429 });
  let config: ReturnType<typeof requireWhatsAppFlowEnv>;
  try {
    config = requireWhatsAppFlowEnv();
  } catch {
    return NextResponse.json({ data: null, error: { code: 'NOT_CONFIGURED', message: 'Flow endpoint is not configured' }, meta: {} }, { status: 503 });
  }

  const rawBody = await request.text();
  if (!verifyWebhookSignature(rawBody, request.headers.get('x-hub-signature-256'), config.appSecret)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const correlationId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const decrypted = decryptFlowRequest(JSON.parse(rawBody), config.privateKey, config.passphrase);
    const response = await getBuyFlowService().handle(decrypted.request);
    return new Response(encryptFlowResponse(response, decrypted.crypto), {
      status: 200,
      headers: { 'content-type': 'text/plain', 'x-correlation-id': correlationId }
    });
  } catch (error) {
    const code = getFlowFailureCode(error);
    console.error('whatsapp_flow_failed', { correlationId, code, error: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ data: null, error: { code, message: 'Flow request could not be processed' }, meta: { correlationId } }, { status: 400 });
  }
}
