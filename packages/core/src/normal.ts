import { createTradeBuyIntent, marketViewIntentSchema } from '@chatdex/intents';
import type { MarketDataProvider, MarketQuote } from '@chatdex/markets';
import type { PreparedHandoff } from './handoffs';

export interface NormalHandoffPreparer {
  prepare(intent: ReturnType<typeof createTradeBuyIntent>, idempotencyKey: string, identity: { userId: string }): Promise<PreparedHandoff>;
}

export class NormalFinanceService {
  constructor(
    private readonly markets: MarketDataProvider & { listQuotes?(query?: string): Promise<MarketQuote[]> },
    private readonly handoffs: NormalHandoffPreparer
  ) {}

  async listMarkets(query = '') {
    if (this.markets.listQuotes) return this.markets.listQuotes(query);
    const quote = await this.markets.getQuote(query || 'NVDA');
    return quote ? [quote] : [];
  }

  async asset(symbol: string) {
    const normalized = symbol.trim().toUpperCase();
    const intent = marketViewIntentSchema.parse({
      id: crypto.randomUUID(), type: 'MARKET.VIEW', source: 'normal',
      instrument: { symbol: normalized, assetType: 'stock' }, createdAt: new Date().toISOString()
    });
    return this.markets.getQuote(intent.instrument.symbol);
  }

  async prepareBuy(input: { userId: string; clientRequestId: string; symbol: string; amount: string; currency?: string }) {
    const intent = createTradeBuyIntent(
      { symbol: input.symbol, amount: input.amount, currency: input.currency ?? 'USD' },
      'normal',
      { context: { symbol: input.symbol.trim().toUpperCase() } }
    );
    return this.handoffs.prepare(intent, `normal:${input.userId}:${input.clientRequestId}`, { userId: input.userId });
  }
}
