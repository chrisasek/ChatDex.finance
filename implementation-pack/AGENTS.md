# AGENTS.md — Read First

You are implementing ChatDex. Do not reinterpret the product.

## Non-negotiable product decisions
- ChatDex is **chat-first, not chat-only**.
- WhatsApp is a **first-class interaction layer** with three surfaces: free-form Conversation, approved Template Messages, and WhatsApp Flows; it is also a distribution, identity and claims venue.
- The ChatDex WebApp/PWA remains the secure financial application and rich execution environment. **Do not open it for every WhatsApp action:** information completes in WhatsApp; preparation stays in Conversation/Flows; execution/sensitive actions escalate to authenticated ChatDex.
- WhatsApp Conversation may interpret intent; Templates may deliver structured outbound updates/actions; Flows may collect structured inputs and prepare intents. Sensitive/irreversible financial actions must be authenticated and explicitly confirmed inside the ChatDex WebApp.
- Quick Actions are embedded inside Web Chat so users can tap instead of typing.
- A switchable **Normal View** provides the familiar fintech UI users already understand.
- WhatsApp, Web Chat, Quick Actions and Normal View all feed the **same Intent Protocol, orchestrator, state, orders, portfolio, transactions and receipts**. Never create separate WhatsApp business logic for financial domains.
- Conventional UI is preferred when it is faster/better: charts, lists, settings, history, forms and dense exploration do not need to pretend to be chat.
- The hackathon does not redefine ChatDex as a Solana/crypto app. Stocks are the sharp demo wedge; crypto, perps, local markets and money movement belong to the broader product. V0 may use paper execution for unsupported rails and one real crypto/onchain rail.
- AI interprets intent. Deterministic software validates and executes financial actions. Never allow free-form LLM output to directly move money or place orders.
- Real actions require an explicit confirmation step in ChatDex.
- Clearly label paper/demo execution. Never imply a simulated transaction is real.

## Hackathon headline flow
The first vertical slice to prove is:
`WhatsApp market conversation → Buy action → V0 Buy Flow (NVDA + $50) → canonical TRADE.BUY intent → order preview → Review & Buy handoff → authenticated ChatDex WebApp → confirm → paper execution → receipt`.

Free-form `Buy $50 NVDA` must create the same canonical `TRADE.BUY` intent. Template messages are used for the small approved V0 outbound set (for example order/receipt or claim/update messaging) rather than ad-hoc business-initiated text.

Also support two lightweight WhatsApp information intents when practical:
- `How's my portfolio?`
- `How is NVDA doing?`

Do not expand the WhatsApp surface until the headline flow works deployed.

## Engineering decisions
- TypeScript throughout.
- Next.js/React WebApp + PWA. For V0, Next.js may also provide API/BFF and WhatsApp webhook endpoints.
- PostgreSQL is the source of truth.
- Start as a modular monolith, not microservices.
- WhatsApp is an **interface adapter**, not a domain service.
- External providers must be behind adapters/interfaces.
- Intent Protocol and Card Protocol are first-class shared contracts.
- Avoid Redis, queues, separate workers or extra infrastructure until the vertical slice actually needs them.

## Scope discipline
Before adding a feature, preserve the progressive-escalation rule and ask: does it directly strengthen the demo loop `WhatsApp Conversation/Flow → Intent → ChatDex review/confirmation → Execution → Receipt`, the small V0 Template set, or prove the shared Web Chat/Quick/Normal architecture? If not, defer it.

## Implementation priority
Working deployed flow > architecture perfection > extra features. Preserve clean module boundaries, but do not over-engineer.

## Design implementation — source of truth
- Do **not** redesign ChatDex. Implement the supplied ChatDex design system and its established visual language.
- Read `docs/design/00-DESIGN-IMPLEMENTATION.md` before building UI.
- Chat UI uses the existing chat primitives, complications, financial faces/cards, typography, geometry and interaction rules.
- The core interaction rule is: **one glance, one job, three replies at most**. Keep cards focused and scannable.
- Quick Actions are part of Web Chat, not a third top-level product mode.
- Normal View is new application surface area. Where a Normal View component is not explicitly present in the supplied design system, extend the same tokens, typography, geometry and interaction principles. Do not import a generic Binance/Robinhood/Coinbase visual language.
- Preserve the distinction between the light chat environment and dark financial “face” surfaces where the supplied designs use it.
- Reuse design tokens; do not scatter hard-coded colors, radii, typography or spacing across components.
- Minimum interactive target: 44×44px. Avoid body text below the supplied 11px floor.
- Financial meaning must never depend on color alone.
