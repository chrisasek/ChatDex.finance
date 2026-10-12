# ChatDex Implementation Pack

Agent-ready specification for the Colosseum Crypto World's Fair build.

## Product in one sentence
ChatDex is a chat-first financial application that turns financial intent into execution across WhatsApp Conversation, WhatsApp Templates, WhatsApp Flows, Web Chat, Quick Actions and a familiar Normal View, all using the same intent engine, state and financial rails.

## Pitch wedge
**Two taps from WhatsApp to the stock market.**

The demo uses stocks as the clearest wedge while preserving the larger product: a financial intent and orchestration layer spanning stocks, crypto, payments, perps and local markets.

## Read order
1. `AGENTS.md`
2. `decisions/PRODUCT-GUARDRAILS.md`
3. `docs/01-PRODUCT-SPEC.md`
4. `docs/02-V0-SCOPE.md`
5. `docs/03-TECHNICAL-ARCHITECTURE.md`
6. `docs/13-WHATSAPP-VENUE.md`
7. `docs/19-WHATSAPP-ACTION-POLICY.md`
7. `docs/18-48-HOUR-BUILD-PLAN.md`
8. Read the remaining docs as needed.

## Core stack
- TypeScript end-to-end
- Next.js + React for website/PWA, V0 API/BFF and WhatsApp webhook
- PostgreSQL
- Modular monolith
- WhatsApp interface adapter
- Provider adapters for external financial rails
- Redis/workers deferred until required

## Headline acceptance test
Open ChatDex on WhatsApp → ask `How is NVDA doing?` → tap `Buy` → complete the V0 Buy WhatsApp Flow for NVDA/$50 → receive/open a secure `Review & Buy` handoff → authenticate in ChatDex → confirm → execute in clearly labelled paper mode → persist/show receipt. Free-form `Buy $50 NVDA` must reach the same canonical intent.

## Security boundary
WhatsApp is not just a launcher. Information should complete there; preparation should remain in Conversation/Flows where practical. Only execution, sensitive actions, or genuinely richer UI should escalate to the authenticated ChatDex WebApp, where irreversible financial actions require explicit confirmation.

## Design implementation
Before implementing frontend UI, read `docs/design/00-DESIGN-IMPLEMENTATION.md` and the rest of `docs/design/`. The supplied ChatDex Design System V1 remains the visual source of truth for exact values not captured in Markdown.
