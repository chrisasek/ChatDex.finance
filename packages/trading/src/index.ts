import { createHash } from 'node:crypto';
import type { SecureTradeHandoffService, TradePreview } from '@chatdex/core';
import type { MarketDataProvider } from '@chatdex/markets';

export type PaperExecution = {
  externalId: string;
  price: string;
  quantity: string;
  fee: string;
  executedAt: string;
};

export type TradeReceipt = {
  reference: string;
  status: 'completed';
  executionMode: 'paper';
  symbol: string;
  amount: string;
  currency: string;
  quantity: string;
  price: string;
  fee: string;
  executedAt: string;
};

export interface TradeConfirmationRepository {
  completePaper(input: { tokenHash: string; userId: string; preview: TradePreview; execution: PaperExecution; now: Date }): Promise<TradeReceipt>;
  findReceipt(tokenHash: string, userId: string): Promise<TradeReceipt | null>;
}

export class PaperTradingProvider {
  async execute(preview: TradePreview, idempotencyKey: string, now: Date): Promise<PaperExecution> {
    return {
      externalId: `paper_${createHash('sha256').update(idempotencyKey).digest('hex').slice(0, 24)}`,
      price: preview.quotedPrice,
      quantity: preview.estimatedQuantity,
      fee: '0.00',
      executedAt: now.toISOString()
    };
  }
}

export class MemoryTradeConfirmationRepository implements TradeConfirmationRepository {
  private readonly receipts = new Map<string, TradeReceipt>();
  async completePaper(input: { tokenHash: string; userId: string; preview: TradePreview; execution: PaperExecution }) {
    const existing = this.receipts.get(input.tokenHash);
    if (existing) return existing;
    const receipt: TradeReceipt = {
      reference: `CDX-${input.execution.externalId.slice(-10).toUpperCase()}`,
      status: 'completed', executionMode: 'paper', symbol: input.preview.symbol,
      amount: input.preview.amount, currency: input.preview.currency,
      quantity: input.execution.quantity, price: input.execution.price,
      fee: input.execution.fee, executedAt: input.execution.executedAt
    };
    this.receipts.set(input.tokenHash, receipt);
    return receipt;
  }
  async findReceipt(tokenHash: string) { return this.receipts.get(tokenHash) ?? null; }
}

function decimalToMinor(value: string) {
  const [whole, fractional = ''] = value.split('.');
  return BigInt(whole) * 100n + BigInt((fractional + '00').slice(0, 2));
}

function quantityFor(amount: string, price: string) {
  const scaled = decimalToMinor(amount) * 1_000_000n / decimalToMinor(price);
  const raw = scaled.toString().padStart(7, '0');
  return `${raw.slice(0, -6)}.${raw.slice(-6)}`;
}

export class PaperTradeConfirmationService {
  constructor(
    private readonly handoffs: SecureTradeHandoffService,
    private readonly markets: MarketDataProvider,
    private readonly provider: PaperTradingProvider,
    private readonly repository: TradeConfirmationRepository,
    private readonly now: () => Date = () => new Date()
  ) {}

  async confirm(token: string, userId: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const handoff = await this.handoffs.resolve(token);
    if (handoff.status === 'used') {
      const receipt = await this.repository.findReceipt(tokenHash, userId);
      return receipt ? { status: 'completed' as const, receipt } : handoff;
    }
    if (handoff.status !== 'pending') return handoff;
    const quote = await this.markets.getQuote(handoff.preview.symbol);
    if (!quote || quote.currency !== handoff.preview.currency) return { status: 'unavailable' as const };
    const refreshed = {
      ...handoff.preview,
      quotedPrice: quote.price,
      estimatedQuantity: quantityFor(handoff.preview.amount, quote.price),
      quoteAsOf: quote.asOf
    };
    const execution = await this.provider.execute(refreshed, `handoff:${token}`, this.now());
    const receipt = await this.repository.completePaper({ tokenHash, userId, preview: refreshed, execution, now: this.now() });
    return { status: 'completed' as const, receipt };
  }
}
