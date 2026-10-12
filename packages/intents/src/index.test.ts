import { describe, expect, it } from 'vitest';
import { createTradeBuyIntent, parseTextIntent } from './index';

describe('parseTextIntent', () => {
  it('creates a canonical market intent for the headline information query', () => {
    const result = parseTextIntent('How is NVDA doing?', 'whatsapp_conversation', new Date('2026-10-07T10:00:00Z'));
    expect(result.kind).toBe('intent');
    if (result.kind === 'intent') expect(result.intent).toMatchObject({ type: 'MARKET.VIEW', source: 'whatsapp_conversation', instrument: { symbol: 'NVDA', assetType: 'stock' } });
  });

  it('parses the constrained free-form buy without executing it', () => {
    const result = parseTextIntent('Buy $50 NVDA');
    expect(result.kind).toBe('intent');
    if (result.kind === 'intent') expect(result.intent).toMatchObject({ type: 'TRADE.BUY', amount: { value: '50', currency: 'USD' } });
  });

  it('asks for a missing amount rather than guessing', () => {
    expect(parseTextIntent('Buy NVDA')).toMatchObject({ kind: 'needs_input', missing: 'amount' });
  });

  it('uses explicit Web Chat instrument context without guessing', () => {
    const now = new Date('2026-10-07T10:00:00Z');
    const buy = parseTextIntent('Buy $50', 'chat', now, { symbol: 'NVDA' });
    expect(buy.kind).toBe('intent');
    if (buy.kind === 'intent') expect(buy.intent).toMatchObject({ type: 'TRADE.BUY', source: 'chat', instrument: { symbol: 'NVDA' }, amount: { value: '50' } });
    const market = parseTextIntent('How is this doing?', 'chat', now, { symbol: 'NVDA' });
    expect(market.kind).toBe('intent');
    if (market.kind === 'intent') expect(market.intent).toMatchObject({ type: 'MARKET.VIEW', source: 'chat', instrument: { symbol: 'NVDA' } });
  });

  it('creates a canonical portfolio query', () => {
    const result = parseTextIntent("How's my portfolio?", 'whatsapp_conversation', new Date('2026-10-07T10:00:00Z'));
    expect(result.kind).toBe('intent');
    if (result.kind === 'intent') expect(result.intent).toMatchObject({ type: 'PORTFOLIO.VIEW', source: 'whatsapp_conversation' });
    const curlyApostrophe = parseTextIntent('How’s my portfolio?', 'whatsapp_conversation', new Date('2026-10-07T10:00:00Z'));
    expect(curlyApostrophe.kind).toBe('intent');
    if (curlyApostrophe.kind === 'intent') expect(curlyApostrophe.intent).toMatchObject({ type: 'PORTFOLIO.VIEW' });
  });

  it('normalizes Conversation and Flow input into equivalent trade semantics', () => {
    const now = new Date('2026-10-07T10:00:00Z');
    const conversation = parseTextIntent('Buy $50 NVDA', 'whatsapp_conversation', now);
    const flow = createTradeBuyIntent(
      { symbol: 'nvda', amount: 50, currency: 'usd' },
      'whatsapp_flow',
      { id: '24a6d1d2-5fe8-44fb-9c33-087b5293982f', now }
    );
    expect(conversation.kind).toBe('intent');
    if (conversation.kind !== 'intent' || conversation.intent.type !== 'TRADE.BUY') return;
    expect({ ...flow, id: conversation.intent.id, source: conversation.intent.source }).toEqual(conversation.intent);
  });

  it('rejects tampered or unsafe Flow amounts', () => {
    expect(() => createTradeBuyIntent({ symbol: 'NVDA', amount: '-1', currency: 'USD' }, 'whatsapp_flow')).toThrow();
    expect(() => createTradeBuyIntent({ symbol: 'NVDA<script>', amount: '50', currency: 'USD' }, 'whatsapp_flow')).toThrow();
  });
});
