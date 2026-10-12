import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getPaperTradeConfirmationService, notifyOrderReceipt } from '@/lib/whatsapp-runtime';
import { allowRequest } from '@/lib/rate-limit';

export async function POST(_request: Request, context: RouteContext<'/api/handoffs/[token]/confirm'>) {
  if (!allowRequest(_request, 'handoff-confirm', 30)) return NextResponse.json({ data: null, error: { code: 'RATE_LIMITED', message: 'Try again shortly' }, meta: {} }, { status: 429 });
  const session = await getSession();
  if (!session) return NextResponse.json({ data: null, error: { code: 'UNAUTHENTICATED', message: 'Sign in to confirm this order' }, meta: {} }, { status: 401 });
  const { token } = await context.params;
  try {
    const result = await getPaperTradeConfirmationService().confirm(token, session.userId);
    if (result.status !== 'completed') {
      const status = result.status === 'expired' || result.status === 'used' ? 409 : result.status === 'invalid' ? 404 : 503;
      return NextResponse.json({ data: null, error: { code: result.status.toUpperCase(), message: 'This order cannot be confirmed' }, meta: {} }, { status });
    }
    try {
      await notifyOrderReceipt(token, session.userId, result.receipt);
    } catch (error) {
      console.error('order_receipt_notification_failed', { correlationId: crypto.randomUUID(), error: error instanceof Error ? error.message : 'unknown' });
    }
    return NextResponse.json({ data: result.receipt, error: null, meta: {} });
  } catch (error) {
    const correlationId = crypto.randomUUID();
    console.error('paper_confirmation_failed', { correlationId, error: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ data: null, error: { code: 'CONFIRMATION_FAILED', message: 'The paper order was not completed' }, meta: { correlationId } }, { status: 409 });
  }
}
