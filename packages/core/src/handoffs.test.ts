import { describe, expect, it } from 'vitest';
import { createTradeBuyIntent } from '@chatdex/intents';
import { DemoMarketDataProvider } from '@chatdex/markets';
import { MemoryTradeHandoffRepository, SecureTradeHandoffService } from './handoffs';

const now = new Date('2026-10-07T10:00:00Z');
const secret = 'test-secret-that-is-at-least-32-characters-long';
const intent = createTradeBuyIntent(
  { symbol: 'NVDA', amount: '50', currency: 'USD' },
  'whatsapp_flow',
  { id: '24a6d1d2-5fe8-44fb-9c33-087b5293982f', now }
);

describe('SecureTradeHandoffService', () => {
  it('persists authoritative preview state and puts only an opaque token in the URL', async () => {
    const repository = new MemoryTradeHandoffRepository();
    const service = new SecureTradeHandoffService(new DemoMarketDataProvider(() => now), repository, { tokenSecret: secret, appUrl: 'https://usechatdex.com', now: () => now });
    const result = await service.prepare(intent, 'flow:abc123', { phone: '2348012345678' });
    expect(result.preview).toMatchObject({ symbol: 'NVDA', amount: '50.00', quotedPrice: '182.51', estimatedQuantity: '0.273957', executionMode: 'paper' });
    expect(result.reviewUrl).toMatch(/^https:\/\/usechatdex\.com\/action\/[A-Za-z0-9_-]{43}$/);
    expect(result.reviewUrl).not.toContain('NVDA');
    expect(result.reviewUrl).not.toContain('50');
    expect([...repository.records.values()][0]).not.toHaveProperty('token');
  });

  it('returns the same handoff for a repeated preparation key', async () => {
    const repository = new MemoryTradeHandoffRepository();
    const service = new SecureTradeHandoffService(new DemoMarketDataProvider(() => now), repository, { tokenSecret: secret, appUrl: 'https://usechatdex.com', now: () => now });
    const first = await service.prepare(intent, 'flow:abc123');
    const second = await service.prepare(intent, 'flow:abc123');
    expect(second).toEqual(first);
    expect(repository.records.size).toBe(1);
  });

  it('binds authenticated Web handoffs to the initiating user', async () => {
    const repository = new MemoryTradeHandoffRepository();
    const service = new SecureTradeHandoffService(new DemoMarketDataProvider(() => now), repository, { tokenSecret: secret, appUrl: 'https://usechatdex.com', now: () => now });
    await service.prepare(intent, 'web-chat:user:request', { userId: '00000000-0000-4000-8000-000000000001' });
    expect([...repository.records.values()][0]).toMatchObject({ userId: '00000000-0000-4000-8000-000000000001' });
  });

  it('fails closed for malformed and expired tokens', async () => {
    let clock = now;
    const service = new SecureTradeHandoffService(new DemoMarketDataProvider(() => now), new MemoryTradeHandoffRepository(), { tokenSecret: secret, appUrl: 'https://usechatdex.com', now: () => clock, ttlMinutes: 10 });
    const prepared = await service.prepare(intent, 'flow:abc123');
    const token = prepared.reviewUrl.split('/').at(-1)!;
    expect(await service.resolve('NVDA?amount=50')).toEqual({ status: 'invalid' });
    clock = new Date('2026-10-07T10:11:00Z');
    expect(await service.resolve(token)).toEqual({ status: 'expired' });
  });
});
