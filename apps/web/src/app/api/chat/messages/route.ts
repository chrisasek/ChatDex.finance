import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { allowRequest } from '@/lib/rate-limit';
import { getWebChatService } from '@/lib/whatsapp-runtime';

const requestSchema = z.object({
  clientRequestId: z.uuid(),
  text: z.string().trim().min(1).max(500).optional(),
  quickAction: z.enum(['markets', 'portfolio', 'buy_nvda_50']).optional(),
  context: z.object({ symbol: z.string().trim().toUpperCase().regex(/^[A-Z][A-Z0-9.-]{0,9}$/).optional() }).optional()
}).refine((value) => Boolean(value.text) !== Boolean(value.quickAction), { message: 'Provide text or one quick action' });

export async function POST(request: Request) {
  if (!allowRequest(request, 'web-chat', 60)) {
    return NextResponse.json({ data: null, error: { code: 'RATE_LIMITED', message: 'Try again shortly.' }, meta: {} }, { status: 429 });
  }
  const session = await getSession();
  if (!session) return NextResponse.json({ data: null, error: { code: 'UNAUTHENTICATED', message: 'Sign in to use ChatDex.' }, meta: {} }, { status: 401 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: { code: 'INVALID_REQUEST', message: 'Enter a supported message or Quick Action.' }, meta: {} }, { status: 400 });
  }
  const correlationId = crypto.randomUUID();
  try {
    const result = await getWebChatService().handle({ userId: session.userId, ...parsed.data });
    return NextResponse.json({ data: result, error: null, meta: { correlationId } });
  } catch (error) {
    console.error('web_chat_failed', { correlationId, error: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ data: null, error: { code: 'CHAT_REQUEST_FAILED', message: 'ChatDex could not complete that request.' }, meta: { correlationId } }, { status: 500 });
  }
}
