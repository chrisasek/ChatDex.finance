import { describe, expect, it } from 'vitest';
import { DemoMarketDataProvider } from '@chatdex/markets';
import { NormalFinanceService } from './normal';

describe('NormalFinanceService', () => {
  it('searches the demo market and resolves asset detail', async () => {
    const service = new NormalFinanceService(new DemoMarketDataProvider(() => new Date('2026-10-09T10:00:00Z')), { async prepare() { throw new Error('not expected'); } });
    await expect(service.listMarkets('nvidia')).resolves.toMatchObject([{ symbol: 'NVDA', dataMode: 'demo' }]);
    await expect(service.asset('nvda')).resolves.toMatchObject({ symbol: 'NVDA', price: '182.51' });
    await expect(service.asset('unknown')).resolves.toBeNull();
  });

  it('prepares a canonical user-bound Normal View paper buy', async () => {
    let captured: unknown;
    const service = new NormalFinanceService(new DemoMarketDataProvider(), { async prepare(intent, key, identity) {
      captured = { intent, key, identity };
      return { reviewUrl: `https://usechatdex.com/action/${'n'.repeat(43)}`, expiresAt: '2026-10-09T10:10:00.000Z', preview: { intentId: intent.id, symbol: 'NVDA', name: 'NVIDIA', amount: '75.00', currency: 'USD', quotedPrice: '182.51', estimatedQuantity: '0.410936', fee: '0.00', orderType: 'market', executionMode: 'paper', quoteAsOf: '2026-10-09T10:00:00.000Z' } };
    } });
    await expect(service.prepareBuy({ userId: 'demo-user', clientRequestId: 'request-1', symbol: 'NVDA', amount: '75' })).resolves.toMatchObject({ preview: { amount: '75.00', executionMode: 'paper' } });
    expect(captured).toMatchObject({ intent: { type: 'TRADE.BUY', source: 'normal', instrument: { symbol: 'NVDA' }, amount: { value: '75' } }, key: 'normal:demo-user:request-1', identity: { userId: 'demo-user' } });
  });
});
