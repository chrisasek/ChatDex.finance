# 06 — Intent Protocol

## Purpose
WhatsApp, Web Chat, Quick Actions and Normal View must produce the same structured intent contracts.

```ts
type IntentSource = 'whatsapp_conversation' | 'whatsapp_flow' | 'chat' | 'quick' | 'normal';

type Intent =
  | TradeBuyIntent
  | TradeSellIntent
  | PortfolioViewIntent
  | MarketViewIntent
  | TransferSendIntent
  | ClaimCreateIntent;

interface TradeBuyIntent {
  id: string;
  type: 'TRADE.BUY';
  source: IntentSource;
  instrument: { symbol: string; assetType: 'stock'|'crypto'|'perp' };
  amount: { value: string; currency: string };
  context?: Record<string, unknown>;
  createdAt: string;
}
```

## WhatsApp examples
- `How is NVDA doing?` → `MARKET.VIEW { symbol: 'NVDA' }`
- `How's my portfolio?` → `PORTFOLIO.VIEW`
- `Buy $50 NVDA` → `TRADE.BUY { instrument: NVDA, amount: 50 USD, source: whatsapp_conversation }`
- V0 Buy Flow submission `{ symbol: NVDA, amount: 50, currency: USD }` → the same `TRADE.BUY`, with `source: whatsapp_flow`

The same `TRADE.BUY` must be produced by WhatsApp Conversation, the V0 Buy Flow, Web Chat, Quick Actions or the Normal View order form. Only `source`/context metadata differs. Template messages do not create a separate financial intent type; their buttons either open a Flow, open a secure handoff, or invoke an explicitly mapped action.

## Parser requirements
For V0 reliably support constrained market/portfolio queries, `buy <amount> <symbol>`, `sell ...`, and demo transfer/claim commands. Ask for missing required fields instead of guessing. Preserve conversation context only as an aid to completing an intent; canonical state comes from PostgreSQL.

## State machine
`draft → needs_input | ready_for_quote → quoted → awaiting_confirmation → executing → completed | failed | cancelled`.

For WhatsApp, `awaiting_confirmation` means **awaiting confirmation in ChatDex**, not authorization by a WhatsApp reply.

## Safety
The parser cannot execute. Validation checks instrument, amount, user eligibility, execution mode/provider and available funds. A WhatsApp-created irreversible intent requires secure handoff and explicit in-app confirmation before execution.
