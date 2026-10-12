import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { allowRequest } from '@/lib/rate-limit';
import { getNormalFinanceService } from '@/lib/whatsapp-runtime';

const requestSchema = z.object({
  clientRequestId: z.uuid(),
  symbol: z.string().trim().toUpperCase().regex(/^[A-Z][A-Z0-9.-]{0,9}$/),
  amount: z.string().trim().regex(/^\d+(?:\.\d{1,2})?$/),
  currency: z.literal('USD').default('USD')
});

export async function POST(request: Request) {
  if (!allowRequest(request, 'normal-order', 30)) return NextResponse.json({ data: null, error: { code: 'RATE_LIMITED', message: 'Try again shortly.' }, meta: {} }, { status: 429 });
  const session = await getSession();
  if (!session) return NextResponse.json({ data: null, error: { code: 'UNAUTHENTICATED', message: 'Sign in to prepare an order.' }, meta: {} }, { status: 401 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || Number(parsed.data.amount) <= 0 || Number(parsed.data.amount) > 100_000) {
    return NextResponse.json({ data: null, error: { code: 'INVALID_ORDER', message: 'Enter an amount between $0.01 and $100,000.' }, meta: {} }, { status: 400 });
  }
  const correlationId = crypto.randomUUID();
  try {
    const data = await getNormalFinanceService().prepareBuy({ userId: session.userId, ...parsed.data });
    return NextResponse.json({ data, error: null, meta: { correlationId } });
  } catch (error) {
    console.error('normal_order_prepare_failed', { correlationId, error: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ data: null, error: { code: 'ORDER_PREPARATION_FAILED', message: 'The paper order could not be prepared. Try again.' }, meta: { correlationId } }, { status: 500 });
  }
}
