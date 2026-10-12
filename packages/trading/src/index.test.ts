import { describe, expect, it } from 'vitest';
import { createTradeBuyIntent } from '@chatdex/intents';
import { DemoMarketDataProvider } from '@chatdex/markets';
import { MemoryTradeHandoffRepository, SecureTradeHandoffService } from '@chatdex/core';
import { MemoryTradeConfirmationRepository, PaperTradeConfirmationService, PaperTradingProvider } from './index';

it('requires a valid pending handoff and returns an idempotent paper receipt', async () => {
  const now = new Date('2026-10-07T10:00:00Z');
  const markets = new DemoMarketDataProvider(() => now);
  const handoffs = new SecureTradeHandoffService(markets, new MemoryTradeHandoffRepository(), {
    tokenSecret: 'test-secret-that-is-at-least-32-characters-long', appUrl: 'https://usechatdex.com', now: () => now
  });
  const intent = createTradeBuyIntent({ symbol: 'NVDA', amount: '50', currency: 'USD' }, 'whatsapp_flow', { now });
  const prepared = await handoffs.prepare(intent, 'flow:one');
  const token = prepared.reviewUrl.split('/').at(-1)!;
  const service = new PaperTradeConfirmationService(handoffs, markets, new PaperTradingProvider(), new MemoryTradeConfirmationRepository(), () => now);
  const first = await service.confirm(token, 'demo-user');
  const second = await service.confirm(token, 'demo-user');
  expect(first).toEqual(second);
  expect(first).toMatchObject({ status: 'completed', receipt: { executionMode: 'paper', symbol: 'NVDA', amount: '50.00', status: 'completed' } });
  await expect(service.confirm('bad-token', 'demo-user')).resolves.toEqual({ status: 'invalid' });
});
