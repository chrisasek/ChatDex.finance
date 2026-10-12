import { NextResponse } from 'next/server';
import { getDatabaseFailureCode, getDatabaseReadiness, getPortfolioSnapshot } from '@/lib/whatsapp-runtime';
import { DEMO_USER_ID } from '@/lib/session';

export async function GET(request: Request) {
  if (new URL(request.url).searchParams.get('ready') !== '1') {
    return NextResponse.json({ data: { status: 'ok', service: 'chatdex-web' }, error: null, meta: {} });
  }
  try {
    const database = await getDatabaseReadiness();
    if (database.ready && new URL(request.url).searchParams.get('portfolio') === '1') {
      try {
        await getPortfolioSnapshot(DEMO_USER_ID);
        return NextResponse.json({ data: { status: 'ready', service: 'chatdex-web', database, portfolio: { ready: true } }, error: null, meta: {} });
      } catch (error) {
        return NextResponse.json({ data: { status: 'not_ready', service: 'chatdex-web', database, portfolio: { ready: false } }, error: { code: getDatabaseFailureCode(error), message: 'The portfolio query failed' }, meta: {} }, { status: 503 });
      }
    }
    const status = database.ready ? 200 : 503;
    return NextResponse.json({ data: { status: database.ready ? 'ready' : 'not_ready', service: 'chatdex-web', database }, error: null, meta: {} }, { status });
  } catch {
    return NextResponse.json({ data: null, error: { code: 'NOT_READY', message: 'A required dependency is unavailable' }, meta: {} }, { status: 503 });
  }
}
