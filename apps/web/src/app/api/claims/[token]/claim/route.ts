import { NextResponse } from 'next/server';
import { allowRequest } from '@/lib/rate-limit';
import { getSession } from '@/lib/session';
import { getClaimService } from '@/lib/whatsapp-runtime';

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  if (!allowRequest(request, 'claim-complete', 20)) return NextResponse.json({ data: null, error: { code: 'RATE_LIMITED', message: 'Try again shortly.' }, meta: {} }, { status: 429 });
  const session = await getSession();
  if (!session) return NextResponse.json({ data: null, error: { code: 'UNAUTHENTICATED', message: 'Sign in before claiming.' }, meta: {} }, { status: 401 });
  const { token } = await context.params;
  const correlationId = crypto.randomUUID();
  try {
    const result = await getClaimService().claim(token, session.userId);
    if (result.status !== 'claimed' || !('claim' in result) || !result.claim) {
      const message = result.status === 'expired' ? 'This claim has expired.' : result.status === 'claimed' ? 'This claim was already collected.' : 'This claim is unavailable for this account.';
      return NextResponse.json({ data: { status: result.status }, error: { code: 'CLAIM_UNAVAILABLE', message }, meta: { correlationId } }, { status: 409 });
    }
    const claim = result.claim;
    return NextResponse.json({ data: { status: 'claimed', reference: `CLM-${claim.id.slice(0, 8).toUpperCase()}`, amount: claim.amount, currency: claim.currency, mode: 'demo' }, error: null, meta: { correlationId } });
  } catch (error) {
    console.error('claim_complete_failed', { correlationId, error: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ data: null, error: { code: 'CLAIM_COMPLETE_FAILED', message: 'The demo claim could not be completed.' }, meta: { correlationId } }, { status: 500 });
  }
}
