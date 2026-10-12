# 13 — WhatsApp Interaction Layer: Conversation, Templates & Flows

WhatsApp is a **first-class interaction layer** into ChatDex with three surfaces: **Conversation, Template Messages and WhatsApp Flows**. It is also a distribution, phone-identity and claims venue. It is not the authoritative financial runtime.

## Product boundary
**Stay in WhatsApp when WhatsApp is sufficient. Open ChatDex when the action requires richer context, stronger authorization, or execution.**

Supporting principle: **Conversation can start anywhere. Money moves through ChatDex.**

WhatsApp may:
- accept free-form financial intent through Conversation
- answer lightweight market questions
- return a private portfolio summary for a safely linked user
- present interactive buttons/lists where supported
- use approved Template Messages for relevant outbound updates/actions
- use WhatsApp Flows to collect structured inputs
- prepare canonical transaction/order intents
- open secure `Review & Buy` / `Open ChatDex` handoffs
- distribute claims/receipts/links

WhatsApp must not:
- be the sole authorization mechanism for irreversible financial actions
- directly execute a trade because a user typed `buy`, tapped a template button or submitted a Flow
- own financial domain state
- contain a separate trading/portfolio implementation

## Three-level action policy
Every WhatsApp interaction must be classified before rendering the next step. Do not deep-link to the WebApp by default.

| Level | Purpose | Default surface | Examples |
|---|---|---|---|
| **1 — Information** | Read/query state | Complete inside WhatsApp | price lookup, portfolio summary, positions, recent activity, basic comparison |
| **2 — Preparation** | Collect enough structured input to prepare an action | WhatsApp Conversation, interactive messages or Flow | choose Buy, select/resolve NVDA, enter $50, choose supported options |
| **3 — Execution / Sensitive** | Authorize an irreversible or security-sensitive operation | Authenticated ChatDex WebApp | confirm buy/sell, send/withdraw, connect account/wallet, security changes |

Routing rule:
```text
Information?             → answer in WhatsApp
Needs structured input?  → stay in WhatsApp / open a Flow
Needs authorization, execution, dense UI or sensitive account control?
                         → secure ChatDex handoff
```

A WebApp handoff is a deliberate escalation, not the default response to every WhatsApp action. If WhatsApp can safely answer or collect the required input, keep the user there.

## The three WhatsApp surfaces
### 1. Conversation
Free-form input such as:
- `How is NVDA doing?`
- `How's my portfolio?`
- `Buy $50 NVDA`

Conversation input is normalized and parsed into the same Intent Protocol as Web Chat.

### 2. Template Messages
Use approved structured outbound messages where WhatsApp requires/allows them and where they improve the product. V0 keeps this deliberately small. Suitable categories include:
- order/transaction status or receipt follow-up
- claim/update notification
- onboarding/re-engagement only if needed for the demo and permitted by the approved template/policy context

Domain code must use stable internal keys such as `ORDER_UPDATE` or `CLAIM_UPDATE`; the WhatsApp adapter maps them to provider-approved names, languages, variables and buttons. Templates may contain a button that opens the V0 Buy Flow or a secure ChatDex handoff.

### 3. WhatsApp Flows
Use Flows when structured tapping/input is better than conversational back-and-forth. V0 implements **one Buy Flow**.

Recommended demo:
`How is NVDA doing? → NVDA response → Buy → Buy Flow → amount $50 → prepare TRADE.BUY → Review & Buy → ChatDex → authenticate → confirm → receipt`.

The Flow may receive safe context such as the selected instrument and collect amount/currency. Treat all Flow data as untrusted input; validate again server-side. The Flow creates/prepares an intent, never the final irreversible execution.

## Unified intent rule
These must converge:
```text
Conversation:  "Buy $50 NVDA"
WhatsApp Flow: symbol=NVDA, amount=50, currency=USD
Web Chat:      "Buy $50 NVDA"
Quick Action:  Buy → NVDA → $50
Normal View:   Buy NVDA / $50

                     ↓
              canonical TRADE.BUY
                     ↓
                  Orchestrator
```
Only source/context metadata differs.

## Adapter layout
Suggested location:
```text
apps/web/app/api/webhooks/whatsapp/route.ts
apps/web/app/api/whatsapp/flows/data/route.ts
packages/whatsapp/
  client.ts
  webhook.ts
  normalize-message.ts
  conversation-renderer.ts
  templates/
    registry.ts
    sender.ts
  flows/
    buy-flow.ts
    handler.ts
    types.ts
  types.ts
```

Responsibilities:
1. Verify webhook/provider requests.
2. Deduplicate inbound event/message IDs.
3. Map sender phone to ChatDex identity/account where allowed.
4. Normalize Conversation and Flow input.
5. Call shared intent/query services.
6. Render/send the appropriate Conversation response, approved Template, Flow entry point or secure deep link.
7. Persist messaging/Flow audit state without duplicating financial truth.

No financial business logic belongs in `packages/whatsapp`.

## V0 Buy Flow contract
At minimum collect/resolve:
- `symbol` (may be prefilled from safe context; demo: NVDA)
- `amount`
- `currency` (demo: USD)

Server output after validation:
```ts
{
  type: 'TRADE.BUY',
  source: 'whatsapp_flow',
  instrument: { symbol: 'NVDA', assetType: 'stock' },
  amount: { value: '50', currency: 'USD' }
}
```

Then quote, persist the intent/handoff, and present/open `Review & Buy`. Do not execute from the Flow completion event.

## Secure Review & Buy link
Use an opaque short-lived token, e.g. `https://usechatdex.com/action/<opaque-token>`. Persist authoritative intent/order preview server-side. Do not put trusted amount, symbol or provider instructions in the URL.

On open:
1. resolve token
2. authenticate/link user
3. verify handoff belongs to that user/phone where applicable
4. refresh/revalidate quote and eligibility
5. render review screen
6. require explicit confirmation
7. execute idempotently
8. persist receipt

## Template registry rule
Never scatter Meta template names throughout the codebase. Use an internal registry:
```ts
type WhatsAppTemplateKey = 'ORDER_UPDATE' | 'CLAIM_UPDATE';
```
Each registry entry owns provider template name, language, variable schema and allowed buttons. If approval/name changes, only the adapter/config changes.

## Distribution loop
`WhatsApp information/preparation → secure ChatDex handoff only when needed → execution → receipt/claim → WhatsApp`.

## Independence rule
The WebApp/PWA must work without WhatsApp. Treat WhatsApp as an adapter so changes in Meta pricing, policy, template approval or Flow capabilities do not redefine the core product.

## V0 restraint
Do not implement every ChatDex capability in WhatsApp. Ship:
- three conversational capabilities
- one Buy Flow
- a minimal approved Template set
- secure handoff into ChatDex

Get the headline Flow and free-form `Buy $50 NVDA` paths working against the same intent engine before adding more commands, Flows, templates or automation.
