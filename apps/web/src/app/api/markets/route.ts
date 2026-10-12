import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { allowRequest } from '@/lib/rate-limit';
import { getNormalFinanceService } from '@/lib/whatsapp-runtime';

export async function GET(request: Request) {
  if (!allowRequest(request, 'normal-markets', 120)) return NextResponse.json({ data: null, error: { code: 'RATE_LIMITED', message: 'Try again shortly.' }, meta: {} }, { status: 429 });
  if (!await getSession()) return NextResponse.json({ data: null, error: { code: 'UNAUTHENTICATED', message: 'Sign in to view markets.' }, meta: {} }, { status: 401 });
  const url = new URL(request.url);
  const symbol = url.searchParams.get('symbol');
  const query = (url.searchParams.get('query') ?? '').slice(0, 40);
  try {
    const data = symbol
      ? await getNormalFinanceService().asset(symbol)
      : await getNormalFinanceService().listMarkets(query);
    if (symbol && !data) return NextResponse.json({ data: null, error: { code: 'MARKET_NOT_FOUND', message: 'That market is not available in the demo.' }, meta: {} }, { status: 404 });
    return NextResponse.json({ data, error: null, meta: {} });
  } catch {
    return NextResponse.json({ data: null, error: { code: 'INVALID_MARKET', message: 'Enter a valid market symbol.' }, meta: {} }, { status: 400 });
  }
}
