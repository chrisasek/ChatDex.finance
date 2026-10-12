import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    data: {
      release: 'judge-demo-2026-10-12-full-app',
      landing: 'colosseum',
    },
    error: null,
    meta: {},
  });
}
