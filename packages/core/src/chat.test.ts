import { describe, expect, it } from 'vitest';
import { DemoMarketDataProvider } from '@chatdex/markets';
import { ChatDexOrchestrator } from './index';
import { WebChatService } from './chat';

const portfolio = { totalValue: '150.00', unrealizedPnl: '12.50', positions: [{ symbol: 'NVDA', name: 'NVIDIA', quantity: '0.8', marketValue: '150.00' }] };

describe('WebChatService', () => {
  it('renders market and private portfolio cards through shared services', async () => {
    const service = new WebChatService(
      new ChatDexOrchestrator(new DemoMarketDataProvider(() => new Date('2026-10-09T10:00:00Z'))),
      { async snapshot(userId) { expect(userId).toBe('demo-user'); return portfolio; } },
      { async prepare() { throw new Error('not expected'); } }
    );
    await expect(service.handle({ userId: 'demo-user', clientRequestId: crypto.randomUUID(), quickAction: 'markets' })).resolves.toMatchObject({ kind: 'market', card: { type: 'MARKET', symbol: 'NVDA' } });
    await expect(service.handle({ userId: 'demo-user', clientRequestId: crypto.randomUUID(), quickAction: 'portfolio' })).resolves.toMatchObject({ kind: 'portfolio', card: { totalValue: '150.00', executionMode: 'paper' } });
  });

  it('creates the canonical quick-action buy and a user-bound secure handoff', async () => {
    let captured: unknown;
    const service = new WebChatService(
      new ChatDexOrchestrator(new DemoMarketDataProvider()),
      { async snapshot() { return portfolio; } },
      { async prepare(intent, key, identity) {
        captured = { intent, key, identity };
        return {
          reviewUrl: `https://usechatdex.com/action/${'a'.repeat(43)}`,
          expiresAt: '2026-10-09T10:10:00.000Z',
          preview: { intentId: intent.id, symbol: 'NVDA', name: 'NVIDIA', amount: '50.00', currency: 'USD', quotedPrice: '182.51', estimatedQuantity: '0.273957', fee: '0.00', orderType: 'market', executionMode: 'paper', quoteAsOf: '2026-10-09T10:00:00.000Z' }
        };
      } }
    );
    const requestId = crypto.randomUUID();
    await expect(service.handle({ userId: 'demo-user', clientRequestId: requestId, quickAction: 'buy_nvda_50' })).resolves.toMatchObject({ kind: 'order', card: { symbol: 'NVDA', amount: '50.00', executionMode: 'paper' } });
    expect(captured).toMatchObject({ intent: { type: 'TRADE.BUY', source: 'quick', amount: { value: '50' } }, key: `web-chat:demo-user:${requestId}`, identity: { userId: 'demo-user' } });
  });

  it('uses visible asset context for short chat commands', async () => {
    let symbol = '';
    const service = new WebChatService(
      new ChatDexOrchestrator(new DemoMarketDataProvider()),
      { async snapshot() { return portfolio; } },
      { async prepare(intent) {
        symbol = intent.instrument.symbol;
        return { reviewUrl: `https://usechatdex.com/action/${'b'.repeat(43)}`, expiresAt: '2026-10-09T10:10:00.000Z', preview: { intentId: intent.id, symbol, name: 'NVIDIA', amount: '25.00', currency: 'USD', quotedPrice: '182.51', estimatedQuantity: '0.136978', fee: '0.00', orderType: 'market', executionMode: 'paper', quoteAsOf: '2026-10-09T10:00:00.000Z' } };
      } }
    );
    await service.handle({ userId: 'demo-user', clientRequestId: crypto.randomUUID(), text: 'Buy $25', context: { symbol: 'NVDA' } });
    expect(symbol).toBe('NVDA');
  });
});
