import type { Intent } from '@chatdex/intents';
import type { MarketDataProvider } from '@chatdex/markets';
import type { MarketCard } from '@chatdex/shared';

export * from './handoffs';
export * from './chat';
export * from './normal';

export type OrchestratorResult =
  | { kind: 'market'; card: MarketCard; actionLevel: 'information' }
  | { kind: 'preparation'; prompt: string; actionLevel: 'preparation' }
  | { kind: 'not_found'; message: string; actionLevel: 'information' };

export class ChatDexOrchestrator {
  constructor(private readonly markets: MarketDataProvider) {}

  async handle(intent: Intent): Promise<OrchestratorResult> {
    if (intent.type === 'MARKET.VIEW') {
      const quote = await this.markets.getQuote(intent.instrument.symbol);
      if (!quote) return { kind: 'not_found', message: `I couldn't find ${intent.instrument.symbol}. Try another symbol.`, actionLevel: 'information' };
      return {
        kind: 'market', actionLevel: 'information',
        card: {
          type: 'MARKET', version: 1, id: crypto.randomUUID(), ...quote,
          actions: [{ id: `buy:${quote.symbol}`, label: 'Buy', intentType: 'TRADE.BUY', emphasis: 'primary' }]
        }
      };
    }
    if (intent.type === 'TRADE.BUY') return { kind: 'preparation', actionLevel: 'preparation', prompt: `Review the ${intent.instrument.symbol} amount before continuing.` };
    return { kind: 'preparation', actionLevel: 'preparation', prompt: 'Your portfolio is available after account verification.' };
  }
}
