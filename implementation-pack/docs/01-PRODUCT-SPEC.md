# 01 — Product Specification

## Thesis
Financial software is moving from navigation toward intent. ChatDex lets users say what they want from WhatsApp or Web Chat, tap common actions, or use familiar financial controls. Every interface becomes the same structured financial intent and execution flow.

## Pitch wedge
**Two taps from WhatsApp to the stock market.**

Stocks make the product immediately understandable. The deeper opportunity is the financial intent layer that can eventually route across stocks, crypto, payments, perps and local markets.

## Interaction model
### WhatsApp Interaction Layer
WhatsApp has three first-class surfaces:
- **Conversation:** free-form market/portfolio questions and financial intent.
- **Template Messages:** approved structured outbound messages for relevant order/receipt/claim/alert/onboarding updates.
- **WhatsApp Flows:** structured in-WhatsApp forms/workflows when tapping/selecting is better than conversational back-and-forth.

All three surfaces normalize into the same ChatDex contracts. WhatsApp can collect/prepare an action, but sensitive execution hands off to authenticated ChatDex for review and explicit confirmation.

### WhatsApp progressive-escalation policy
- **Information:** finish inside WhatsApp.
- **Preparation:** keep the user in Conversation/interactive messages/Flows while collecting structured intent.
- **Execution / sensitive:** hand off to authenticated ChatDex for review, explicit confirmation and execution.

Do not make every WhatsApp button/action a WebApp link. The handoff happens only when the security boundary or richer UI justifies it.

### Web Chat View
Primary in-app conversational surface. Conversation, cards, contextual prompts and Quick Actions.

### Quick Actions
Buttons/chips inside Web Chat for common actions such as Buy, Sell, Send, Receive, Markets and Portfolio. Quick Actions are not a separate product mode.

### Normal View
Familiar fintech interface: portfolio, assets, markets, charts, buy/sell forms and activity. Users can switch to it at any time.

### Context bridging
All surfaces share canonical state. Normal → Chat carries screen context. Chat/WhatsApp → Web can deep-link to the relevant review/detail screen with server-side state attached to a short-lived token.

## Headline V0 flow
`WhatsApp → market conversation → Buy → V0 Buy Flow → TRADE.BUY intent → order preview → Review & Buy → authenticated ChatDex → review → confirm → paper execution → receipt`.

Free-form `Buy $50 NVDA` is an alternate input path and must produce the same `TRADE.BUY` contract as the Flow.

Information-only WhatsApp examples:
- `How is NVDA doing?`
- `How's my portfolio?`

## WhatsApp role
WhatsApp is a multi-surface interaction layer (Conversation + Templates + Flows) and a distribution/identity/claims venue. It is **not** the authoritative financial runtime or sole authorization mechanism. ChatDex must remain usable directly as a WebApp/PWA.

## Growth loop
`WhatsApp conversation/share → ChatDex action → receipt/claim → WhatsApp → recipient/user → ChatDex`.

## Long-term direction
ChatDex can evolve from a consumer financial application into an intent/card/execution infrastructure layer for chat-native applications. V0 proves the interface-to-intent-to-execution model rather than attempting the full platform.
