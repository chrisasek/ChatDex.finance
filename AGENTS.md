# ChatDex repository constitution

The authoritative product and architecture source is `implementation-pack/`. Read its `AGENTS.md`, decisions, required docs, and `docs/design/` before changing behavior.

## Locked rules

- Information completes in WhatsApp, preparation stays in Conversation or Flows, and execution/sensitive actions use an authenticated ChatDex handoff.
- WhatsApp, Web Chat, Quick Actions, and Normal View share one Intent Protocol and domain services.
- Meta-specific code stays in `packages/whatsapp`; route handlers and UI components contain no financial business logic.
- AI may interpret input but never authorizes or executes a financial action.
- Paper execution is always explicitly labelled.
- PostgreSQL is authoritative. Provider code stays behind interfaces.

## Build order

Follow `implementation-pack/docs/18-48-HOUR-BUILD-PLAN.md` vertically. Do not begin the next dependent milestone while the current one is red.

## Required proof

For each milestone run typecheck, lint, focused tests, relevant full tests, and build. Separate local automated/static proof from real Meta, PostgreSQL, deployed, or provider proof.

## Stop conditions

Do not invent credentials or IDs. Stop for production deployment, DNS, payment/provider activation, legal acceptance, costly actions, or destructive real-data operations without exact authority.
