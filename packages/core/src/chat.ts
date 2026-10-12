import { createTradeBuyIntent, marketViewIntentSchema, parseTextIntent, portfolioViewIntentSchema, type TradeBuyIntent } from '@chatdex/intents';
import type { ChatDexOrchestrator, PreparedHandoff } from './index';

export type WebChatQuickAction = 'markets' | 'portfolio' | 'buy_nvda_50';

export type WebChatPortfolio = {
  totalValue: string;
  unrealizedPnl: string;
  positions: Array<{ symbol: string; name: string; quantity: string; marketValue: string }>;
};

export interface WebChatPortfolioLookup {
  snapshot(userId: string): Promise<WebChatPortfolio>;
}

export interface WebChatHandoffPreparer {
  prepare(intent: TradeBuyIntent, idempotencyKey: string, identity: { userId: string }): Promise<PreparedHandoff>;
}

export type WebChatResult =
  | { kind: 'message'; reply: string }
  | { kind: 'market'; reply: string; card: { type: 'MARKET'; symbol: string; name: string; price: string; currency: string; changePercent: string; dataMode: 'demo' | 'live' } }
  | { kind: 'portfolio'; reply: string; card: { type: 'PORTFOLIO'; totalValue: string; unrealizedPnl: string; positions: WebChatPortfolio['positions']; executionMode: 'paper' } }
  | { kind: 'order'; reply: string; card: { type: 'ORDER'; symbol: string; amount: string; currency: string; estimatedQuantity: string; quotedPrice: string; executionMode: 'paper'; reviewUrl: string; expiresAt: string } };

export class WebChatService {
  constructor(
    private readonly orchestrator: ChatDexOrchestrator,
    private readonly portfolios: WebChatPortfolioLookup,
    private readonly handoffs: WebChatHandoffPreparer
  ) {}

  async handle(input: { userId: string; clientRequestId: string; text?: string; quickAction?: WebChatQuickAction; context?: { symbol?: string } }): Promise<WebChatResult> {
    const now = new Date();
    const parsed = input.quickAction === 'markets'
      ? { kind: 'intent' as const, intent: marketViewIntentSchema.parse({ id: crypto.randomUUID(), type: 'MARKET.VIEW', source: 'quick', instrument: { symbol: input.context?.symbol ?? 'NVDA', assetType: 'stock' }, createdAt: now.toISOString() }) }
      : input.quickAction === 'portfolio'
        ? { kind: 'intent' as const, intent: portfolioViewIntentSchema.parse({ id: crypto.randomUUID(), type: 'PORTFOLIO.VIEW', source: 'quick', createdAt: now.toISOString() }) }
        : input.quickAction === 'buy_nvda_50'
          ? { kind: 'intent' as const, intent: createTradeBuyIntent({ symbol: input.context?.symbol ?? 'NVDA', amount: '50', currency: 'USD' }, 'quick', { now, context: input.context }) }
          : parseTextIntent(input.text ?? '', 'chat', now, input.context);

    if (parsed.kind !== 'intent') return { kind: 'message', reply: parsed.prompt };
    if (parsed.intent.type === 'PORTFOLIO.VIEW') {
      const snapshot = await this.portfolios.snapshot(input.userId);
      return {
        kind: 'portfolio',
        reply: snapshot.positions.length ? 'Here is your current demo portfolio.' : 'Your demo portfolio has no positions yet.',
        card: { type: 'PORTFOLIO', totalValue: snapshot.totalValue, unrealizedPnl: snapshot.unrealizedPnl, positions: snapshot.positions.slice(0, 3), executionMode: 'paper' }
      };
    }
    if (parsed.intent.type === 'TRADE.BUY') {
      const handoff = await this.handoffs.prepare(parsed.intent, `web-chat:${input.userId}:${input.clientRequestId}`, { userId: input.userId });
      return {
        kind: 'order',
        reply: 'Your paper order is prepared. Review it in ChatDex before confirming.',
        card: {
          type: 'ORDER', symbol: handoff.preview.symbol, amount: handoff.preview.amount, currency: handoff.preview.currency,
          estimatedQuantity: handoff.preview.estimatedQuantity, quotedPrice: handoff.preview.quotedPrice,
          executionMode: 'paper', reviewUrl: handoff.reviewUrl, expiresAt: handoff.expiresAt
        }
      };
    }
    const result = await this.orchestrator.handle(parsed.intent);
    if (result.kind !== 'market') return { kind: 'message', reply: result.kind === 'not_found' ? result.message : result.prompt };
    return {
      kind: 'market',
      reply: `${result.card.symbol} is ${Number(result.card.changePercent) >= 0 ? 'up' : 'down'} ${Math.abs(Number(result.card.changePercent)).toFixed(2)}% today.`,
      card: {
        type: 'MARKET', symbol: result.card.symbol, name: result.card.name, price: result.card.price,
        currency: result.card.currency, changePercent: result.card.changePercent, dataMode: result.card.dataMode
      }
    };
  }
}
