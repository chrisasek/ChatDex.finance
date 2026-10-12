import { z } from 'zod';

export const intentSourceSchema = z.enum(['whatsapp_conversation', 'whatsapp_flow', 'chat', 'quick', 'normal']);
export type IntentSource = z.infer<typeof intentSourceSchema>;

const intentBase = z.object({
  id: z.uuid(),
  source: intentSourceSchema,
  createdAt: z.iso.datetime(),
  context: z.record(z.string(), z.unknown()).optional()
});

export const marketViewIntentSchema = intentBase.extend({
  type: z.literal('MARKET.VIEW'),
  instrument: z.object({ symbol: z.string().regex(/^[A-Z][A-Z0-9.-]{0,9}$/), assetType: z.enum(['stock', 'crypto', 'perp']) })
});

export const tradeBuyIntentSchema = intentBase.extend({
  type: z.literal('TRADE.BUY'),
  instrument: z.object({ symbol: z.string().regex(/^[A-Z][A-Z0-9.-]{0,9}$/), assetType: z.enum(['stock', 'crypto', 'perp']) }),
  amount: z.object({ value: z.string().regex(/^\d+(?:\.\d{1,2})?$/), currency: z.string().length(3) })
});

export const portfolioViewIntentSchema = intentBase.extend({
  type: z.literal('PORTFOLIO.VIEW')
});

export type MarketViewIntent = z.infer<typeof marketViewIntentSchema>;
export type TradeBuyIntent = z.infer<typeof tradeBuyIntentSchema>;
export type PortfolioViewIntent = z.infer<typeof portfolioViewIntentSchema>;
export type Intent = MarketViewIntent | TradeBuyIntent | PortfolioViewIntent;

export const buyFlowInputSchema = z.object({
  symbol: z.string().trim().toUpperCase().regex(/^[A-Z][A-Z0-9.-]{0,9}$/),
  amount: z.union([z.string(), z.number()]).transform(String).pipe(z.string().regex(/^\d+(?:\.\d{1,2})?$/)),
  currency: z.string().trim().toUpperCase().length(3).default('USD')
}).superRefine((value, context) => {
  const amount = Number(value.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000) {
    context.addIssue({ code: 'custom', path: ['amount'], message: 'Amount must be between 0.01 and 100000' });
  }
});

export function createTradeBuyIntent(
  input: unknown,
  source: IntentSource,
  options: { id?: string; now?: Date; context?: Record<string, unknown> } = {}
): TradeBuyIntent {
  const value = buyFlowInputSchema.parse(input);
  return tradeBuyIntentSchema.parse({
    id: options.id ?? crypto.randomUUID(),
    type: 'TRADE.BUY',
    source,
    instrument: { symbol: value.symbol, assetType: 'stock' },
    amount: { value: value.amount, currency: value.currency },
    context: options.context,
    createdAt: (options.now ?? new Date()).toISOString()
  });
}

export type ParseResult =
  | { kind: 'intent'; intent: Intent }
  | { kind: 'needs_input'; missing: 'symbol' | 'amount'; prompt: string }
  | { kind: 'unsupported'; prompt: string };

const marketPatterns = [
  /(?:how(?:['’]s| is)|what(?:['’]s| is))\s+([A-Z]{1,10})\s+(?:doing|trading)/i,
  /(?:price|quote)(?:\s+(?:of|for))?\s+([A-Z]{1,10})/i
];

export function parseTextIntent(text: string, source: IntentSource = 'whatsapp_conversation', now = new Date(), context?: { symbol?: string }): ParseResult {
  const cleaned = text.trim();
  const contextSymbol = context?.symbol?.trim().toUpperCase();
  const safeContextSymbol = contextSymbol && /^[A-Z][A-Z0-9.-]{0,9}$/.test(contextSymbol) ? contextSymbol : undefined;
  if (/^(?:how(?:['’]s| is)|show|view)\s+(?:my\s+)?portfolio\??$/i.test(cleaned)) {
    return { kind: 'intent', intent: portfolioViewIntentSchema.parse({
      id: crypto.randomUUID(), type: 'PORTFOLIO.VIEW', source, createdAt: now.toISOString()
    }) };
  }
  if (safeContextSymbol && /^(?:how(?:['’]s| is)|what(?:['’]s| is))\s+(?:this|it)\s+(?:doing|trading)\??$/i.test(cleaned)) {
    return { kind: 'intent', intent: marketViewIntentSchema.parse({
      id: crypto.randomUUID(), type: 'MARKET.VIEW', source,
      instrument: { symbol: safeContextSymbol, assetType: 'stock' }, context: { symbol: safeContextSymbol }, createdAt: now.toISOString()
    }) };
  }
  for (const pattern of marketPatterns) {
    const match = cleaned.match(pattern);
    if (match?.[1]) {
      return { kind: 'intent', intent: marketViewIntentSchema.parse({
        id: crypto.randomUUID(), type: 'MARKET.VIEW', source,
        instrument: { symbol: match[1].toUpperCase(), assetType: 'stock' }, createdAt: now.toISOString()
      }) };
    }
  }

  const completeBuy = cleaned.match(/^buy\s+(?:\$|USD\s*)?(\d+(?:\.\d{1,2})?)\s+([A-Z]{1,10})$/i);
  if (completeBuy) {
    return { kind: 'intent', intent: createTradeBuyIntent(
      { symbol: completeBuy[2], amount: completeBuy[1], currency: 'USD' },
      source,
      { now }
    ) };
  }
  const contextualBuy = safeContextSymbol ? cleaned.match(/^buy\s+(?:\$|USD\s*)?(\d+(?:\.\d{1,2})?)$/i) : null;
  if (contextualBuy && safeContextSymbol) {
    return { kind: 'intent', intent: createTradeBuyIntent(
      { symbol: safeContextSymbol, amount: contextualBuy[1], currency: 'USD' },
      source,
      { now, context: { symbol: safeContextSymbol } }
    ) };
  }
  if (/^buy(?:\s+[A-Z]{1,10})?$/i.test(cleaned)) {
    return { kind: 'needs_input', missing: 'amount', prompt: 'How much would you like to prepare?' };
  }
  return { kind: 'unsupported', prompt: 'Try “How is NVDA doing?” or “Buy $50 NVDA”.' };
}
