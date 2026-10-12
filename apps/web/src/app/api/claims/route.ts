import { NextResponse } from 'next/server';
import { z } from 'zod';
import { allowRequest } from '@/lib/rate-limit';
import { getSession } from '@/lib/session';
import { env } from '@/lib/env';
import { getClaimService } from '@/lib/whatsapp-runtime';

const requestSchema = z.object({
  amount: z.string().trim().regex(/^\d+(?:\.\d{1,2})?$/),
  currency: z.literal('USD').default('USD'),
  recipientPhone: z.string().trim().regex(/^\+[1-9]\d{7,14}$/).optional()
});

export async function POST(request: Request) {
  if (!allowRequest(request, 'claim-create', 20)) return NextResponse.json({ data: null, error: { code: 'RATE_LIMITED', message: 'Try again shortly.' }, meta: {} }, { status: 429 });
  const session = await getSession();
  if (!session) return NextResponse.json({ data: null, error: { code: 'UNAUTHENTICATED', message: 'Sign in to create a claim.' }, meta: {} }, { status: 401 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || Number(parsed.data.amount) <= 0 || Number(parsed.data.amount) > 100_000) {
    return NextResponse.json({ data: null, error: { code: 'INVALID_CLAIM', message: 'Enter an amount between $0.01 and $100,000 and an optional phone in international format.' }, meta: {} }, { status: 400 });
  }
  const correlationId = crypto.randomUUID();
  try {
    const created = await getClaimService().create({ senderId: session.userId, ...parsed.data });
    const actionUrl = `${env.APP_URL.replace(/\/$/, '')}/c/${created.token}`;
    return NextResponse.json({ data: {
      reference: `CLM-${created.claim.id.slice(0, 8).toUpperCase()}`, amount: created.claim.amount,
      currency: created.claim.currency, status: created.claim.status, expiresAt: created.claim.expiresAt,
      actionUrl, shareText: `You have a demo ChatDex claim for ${created.claim.currency} ${created.claim.amount}. ${actionUrl}`
    }, error: null, meta: { correlationId } }, { status: 201 });
  } catch (error) {
    console.error('claim_create_failed', { correlationId, error: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ data: null, error: { code: 'CLAIM_CREATE_FAILED', message: 'The demo claim could not be created.' }, meta: { correlationId } }, { status: 500 });
  }
}
