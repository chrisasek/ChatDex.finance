# 03 — Technical Architecture

## V0 topology
```text
WhatsApp Interaction Layer                  Web/PWA
   │        │        │                    ┌──────┼────────┐
Conversation Templates Flows                 Chat   Quick    Normal
   │        │        │                       │      │        │
Webhook / Template Sender / Flow Endpoint     └──────┼────────┘
   │        │        │                              │
   └────────┴────────┴──→ WhatsApp Adapter ─────────┘
   │                          │
   └──────→ Normalized Input / Intent Protocol
                              │
                       Intent Parser/Validator
                              │
                         ChatDex Core
                 Orchestrator | Cards | Domains
                              │
                       Provider Adapters
             Market Data | Paper Trade | Crypto Rail
                              │
                         PostgreSQL
```

## Modules
- identity/auth
- whatsapp/interface adapter (conversation, templates, flows)
- conversations
- intents
- handoffs
- cards
- markets
- trading
- portfolio
- transfers
- claims
- receipts
- providers

## Interface normalization
Inbound WhatsApp payloads are verified and normalized before they reach the intent layer. Meta-specific objects must not leak into `markets`, `trading`, `portfolio`, `claims` or provider modules.

Suggested normalized input:
```ts
interface NormalizedMessage {
  source: 'whatsapp_conversation' | 'whatsapp_flow' | 'web_chat';
  externalMessageId?: string;
  userId?: string;
  phone?: string;
  text?: string;
  structuredInput?: Record<string, unknown>;
  context?: Record<string, unknown>;
}
```

## Core execution pipeline
`input → normalize → parse intent → validate → policy/eligibility → quote → preview → secure handoff if external → explicit confirm in ChatDex → provider execute → persist → receipt → update state`.

## Secure handoff
For an irreversible intent created from WhatsApp, persist server-side action state and issue a short-lived opaque token. Deep link example: `/action/<token>`. Do not encode authoritative order instructions in query parameters. On open, resolve token, require/bind authentication, revalidate quote/eligibility, show review UI, then accept explicit confirmation. Tokens should expire and be single-purpose; confirmation must be idempotent.

## AI boundary
LLM output may create/complete structured intent candidates and answer explanatory questions. It must never directly call a provider with irreversible financial instructions. WhatsApp messages are intent input, not transaction authorization.

## Scaling path
Keep module interfaces clean. Add queues when webhook retries, outbound messaging, alerts or provider reconciliation actually require them. Extract services only after measured operational need.


## WhatsApp escalation router
Before choosing a renderer, classify the next action as `information`, `preparation`, or `execution_sensitive`. The WhatsApp adapter should answer `information` directly, render `preparation` through Conversation/interactive UI/Flows, and create a secure handoff only for `execution_sensitive` (or when dense/rich UI is materially required). Never make WebApp navigation the default WhatsApp renderer.

## WhatsApp surface rule
Conversation and Flow submissions are inbound intent surfaces. Template Messages are primarily an outbound rendering/delivery surface. A template button may open a Flow or secure ChatDex handoff, but template payloads must never become authoritative execution instructions. Flow submissions must be normalized and validated into the same Intent Protocol as chat/quick/normal inputs.
