import { createHash, createHmac } from 'node:crypto';
import type { TradeBuyIntent } from '@chatdex/intents';
import type { MarketDataProvider } from '@chatdex/markets';

export type TradePreview = {
  intentId: string;
  symbol: string;
  name: string;
  amount: string;
  currency: string;
  quotedPrice: string;
  estimatedQuantity: string;
  fee: string;
  orderType: 'market';
  executionMode: 'paper';
  quoteAsOf: string;
};

export type PreparedHandoff = {
  reviewUrl: string;
  expiresAt: string;
  preview: TradePreview;
};

export type HandoffRecord = {
  tokenHash: string;
  intent: TradeBuyIntent;
  phone?: string;
  userId?: string;
  expiresAt: string;
  preview: TradePreview;
};

export interface TradeHandoffRepository {
  createOrGet(record: HandoffRecord): Promise<{ expiresAt: string; preview: TradePreview }>;
  resolve(tokenHash: string, now: Date): Promise<{ status: 'pending'; expiresAt: string; preview: TradePreview } | { status: 'expired' | 'invalid' | 'used' }>;
}

export class MemoryTradeHandoffRepository implements TradeHandoffRepository {
  readonly records = new Map<string, HandoffRecord & { status: 'pending' | 'used' }>();
  async createOrGet(record: HandoffRecord) {
    const existing = this.records.get(record.tokenHash);
    if (existing) return { expiresAt: existing.expiresAt, preview: existing.preview };
    this.records.set(record.tokenHash, { ...record, status: 'pending' });
    return { expiresAt: record.expiresAt, preview: record.preview };
  }
  async resolve(tokenHash: string, now: Date) {
    const record = this.records.get(tokenHash);
    if (!record) return { status: 'invalid' as const };
    if (record.status === 'used') return { status: 'used' as const };
    if (new Date(record.expiresAt) <= now) return { status: 'expired' as const };
    return { status: 'pending' as const, expiresAt: record.expiresAt, preview: record.preview };
  }
}

function decimalToMinor(value: string) {
  const [whole, fractional = ''] = value.split('.');
  return BigInt(whole) * 100n + BigInt((fractional + '00').slice(0, 2));
}

function formatScaled(value: bigint, scale: number) {
  const raw = value.toString().padStart(scale + 1, '0');
  return `${raw.slice(0, -scale)}.${raw.slice(-scale)}`;
}

export class SecureTradeHandoffService {
  constructor(
    private readonly markets: MarketDataProvider,
    private readonly repository: TradeHandoffRepository,
    private readonly config: { tokenSecret: string; appUrl: string; ttlMinutes?: number; now?: () => Date }
  ) {
    if (config.tokenSecret.length < 32) throw new Error('HANDOFF_TOKEN_SECRET must contain at least 32 characters');
  }

  async prepare(intent: TradeBuyIntent, idempotencyKey: string, identity: { phone?: string; userId?: string } = {}): Promise<PreparedHandoff> {
    if (!idempotencyKey.trim()) throw new Error('An idempotency key is required');
    const quote = await this.markets.getQuote(intent.instrument.symbol);
    if (!quote) throw new Error('Instrument quote is unavailable');
    if (quote.currency !== intent.amount.currency) throw new Error('Quote currency does not match the intent');

    const token = createHmac('sha256', this.config.tokenSecret).update(`trade-handoff:${idempotencyKey}`).digest('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const now = (this.config.now ?? (() => new Date()))();
    const expiresAt = new Date(now.getTime() + (this.config.ttlMinutes ?? 10) * 60_000).toISOString();
    const quantityScaled = decimalToMinor(intent.amount.value) * 1_000_000n / decimalToMinor(quote.price);
    const preview: TradePreview = {
      intentId: intent.id,
      symbol: quote.symbol,
      name: quote.name,
      amount: Number(intent.amount.value).toFixed(2),
      currency: intent.amount.currency,
      quotedPrice: quote.price,
      estimatedQuantity: formatScaled(quantityScaled, 6),
      fee: '0.00',
      orderType: 'market',
      executionMode: 'paper',
      quoteAsOf: quote.asOf
    };
    const persisted = await this.repository.createOrGet({ tokenHash, intent, phone: identity.phone, userId: identity.userId, expiresAt, preview });
    return { reviewUrl: `${this.config.appUrl.replace(/\/$/, '')}/action/${token}`, ...persisted };
  }

  async resolve(token: string) {
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return { status: 'invalid' as const };
    return this.repository.resolve(createHash('sha256').update(token).digest('hex'), (this.config.now ?? (() => new Date()))());
  }
}
