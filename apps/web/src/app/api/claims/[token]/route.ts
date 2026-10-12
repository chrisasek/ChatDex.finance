import { NextResponse } from 'next/server';
import { allowRequest } from '@/lib/rate-limit';
import { getClaimService } from '@/lib/whatsapp-runtime';

export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  if (!allowRequest(request, 'claim-resolve', 120)) return NextResponse.json({ data: null, error: { code: 'RATE_LIMITED', message: 'Try again shortly.' }, meta: {} }, { status: 429 });
  const { token } = await context.params;
  const result = await getClaimService().resolve(token);
  if (result.status !== 'pending') return NextResponse.json({ data: { status: result.status }, error: null, meta: {} }, { status: result.status === 'invalid' ? 404 : 200 });
  return NextResponse.json({ data: {
    status: result.status, reference: `CLM-${result.claim.id.slice(0, 8).toUpperCase()}`,
    senderName: result.claim.senderName ?? 'A ChatDex user', amount: result.claim.amount,
    currency: result.claim.currency, expiresAt: result.claim.expiresAt, mode: 'demo'
  }, error: null, meta: {} });
}
