# 19 — WhatsApp Action Policy

## Rule
**Stay in WhatsApp when WhatsApp is sufficient. Open ChatDex when the action requires richer context, stronger authorization, or execution.**

The goal is to make WhatsApp a real ChatDex product surface, not a menu of deep links.

## Level 1 — Information
Complete inside WhatsApp by default.

Examples: market price, portfolio summary, positions, recent activity, basic comparisons, status/receipt lookup. A user may explicitly choose `View details` to open richer WebApp UI, but the information request itself must not require it.

## Level 2 — Preparation
Keep the user in WhatsApp while collecting safe structured input. Use Conversation, interactive messages and WhatsApp Flows.

Examples: tap Buy, resolve/select NVDA, enter $50, choose supported order options, prepare a claim. Completion produces a validated canonical intent or action preview, not execution authorization.

## Level 3 — Execution / Sensitive
Escalate to authenticated ChatDex.

Examples: confirm buy/sell, send/withdraw money, connect an account/wallet, security changes, or any operation requiring stronger authentication/authorization. The WebApp resolves an opaque short-lived handoff, revalidates state/quote/eligibility, shows the review UI and requires explicit confirmation.

## Decision function
```ts
type WhatsAppActionLevel =
  | 'information'
  | 'preparation'
  | 'execution_sensitive';

function chooseSurface(level: WhatsAppActionLevel) {
  if (level === 'information') return 'whatsapp_response';
  if (level === 'preparation') return 'whatsapp_conversation_or_flow';
  return 'chatdex_secure_handoff';
}
```

Dense information can offer an optional `View in ChatDex` action without forcing navigation.

## V0 example
```text
User: How is NVDA doing?
  → WhatsApp answers with price/basic market data.                 [Level 1]
  → Buy button stays in WhatsApp.
  → Buy Flow collects $50.                                        [Level 2]
  → ChatDex prepares TRADE.BUY and quote/order preview.
  → Review & Buy opens authenticated ChatDex.                      [Level 3]
  → User reviews and confirms.
  → deterministic execution / paper provider.
  → receipt persists; WhatsApp may receive a receipt/status update.
```

Free-form `Buy $50 NVDA` skips redundant preparation fields but does not skip Level 3 authorization.

## Non-goals
- Do not deep-link every button to the WebApp.
- Do not duplicate trading logic in WhatsApp.
- Do not treat a WhatsApp sender ID, message, button tap, template action or Flow completion as sufficient authorization for irreversible execution.
- Do not force dense charts/settings/security workflows into WhatsApp merely to avoid the WebApp.

## Acceptance tests
1. `How is NVDA doing?` is answered without leaving WhatsApp.
2. `How is my portfolio?` is answered without leaving WhatsApp for a safely linked user.
3. Buy preparation can reach a complete order preview without premature execution.
4. `Review & Buy` is the deliberate escalation point for the V0 trade.
5. Confirmation in ChatDex is authenticated, explicit and idempotent.
6. The same `TRADE.BUY` contract is produced from free-form WhatsApp, Flow, Web Chat, Quick Actions and Normal View except source/context metadata.
