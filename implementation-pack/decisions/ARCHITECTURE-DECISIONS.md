# Architecture Decisions

## ADR-001 — TypeScript end-to-end
Chosen for shared contracts across frontend, WhatsApp adapter, intent/card protocols, API and provider adapters.

## ADR-002 — PostgreSQL
Chosen as canonical relational store with JSONB available for provider/card/intent metadata.

## ADR-003 — Modular monolith
No microservices for V0. Maintain module boundaries so services can be extracted later.

## ADR-004 — Next.js API/BFF for V0
Use one deployable application for the hackathon build. Next.js also hosts the V0 WhatsApp webhook. A dedicated Node API/worker can be extracted later without changing domain contracts.

## ADR-005 — Provider abstraction
Market data, paper trading and real crypto execution sit behind interfaces. Vendor SDKs do not leak into domain/UI code.

## ADR-006 — Shared Intent Protocol across every interface
WhatsApp, Web Chat, Quick and Normal produce identical canonical intents. `source` identifies origin but does not change domain semantics.

## ADR-007 — WhatsApp is a multi-surface interface adapter
WhatsApp-specific Conversation webhook parsing, Template rendering/sending and Flow handling live at the edge. Domain services never depend on Meta payloads, Flow schemas or template names. Conversation and Flow inputs normalize to shared intents; domain results render to WhatsApp-safe free-form/interactive responses, approved Templates, Flows or secure deep links as appropriate.

## ADR-008 — Secure handoff for irreversible actions
WhatsApp may prepare an action but cannot be the sole authorization mechanism. Use a short-lived, single-purpose handoff token/deep link to authenticated ChatDex, where the user reviews and explicitly confirms.

## ADR-009 — Shared Card Protocol
Cards are structured domain responses with renderers; React components do not own financial business logic. WhatsApp can render a reduced representation of the same underlying response.

## ADR-010 — PostgreSQL is authoritative, not conversation history
Portfolio, orders, balances, claims and receipts are queried from domain state. Chat/WhatsApp history is context/UI history only.


## ADR-011 — WhatsApp Flows are structured intent capture, not execution
A Flow is another UI/controller for collecting structured fields. Its submission is validated and converted to the same canonical Intent Protocol as Conversation/Quick/Normal. Flow completion alone never authorizes irreversible execution.

## ADR-012 — Template registry isolates provider policy/configuration
Domain code refers to stable internal template keys. `packages/whatsapp` maps those keys to currently approved provider template names, languages, variables and buttons. Template approval/policy changes must not change financial domain contracts.

## ADR-013 — WhatsApp uses progressive escalation, not universal deep links
Classify WhatsApp actions into three levels: information, preparation, and execution/sensitive. Information is answered in WhatsApp. Preparation remains in Conversation/interactive messages/Flows when practical. Only execution, sensitive controls, or interactions that materially need richer/dense UI escalate to authenticated ChatDex. This keeps WhatsApp a real product surface rather than a launcher for the WebApp.
