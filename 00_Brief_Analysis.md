# Brief analysis

- North star: turn the headline WhatsApp market conversation into one shared, deterministic financial intent and execution pipeline.
- Paradigm: web application with API/webhook surfaces.
- Target platforms: mobile Web/PWA and Meta WhatsApp Cloud API; desktop Web remains usable.
- Persistent data: yes.
- Sensitive categories: financial intent, portfolio data, phone identity, transaction authorization.
- Proof environment: local automated/static proof first; Meta test account, public HTTPS, PostgreSQL, and deployment require external configuration.

## Actors and measurable goals

- WhatsApp user: receive an NVDA market answer without leaving WhatsApp.
- Linked ChatDex user: later prepare and explicitly confirm a paper trade through secure handoff.
- Demo operator: reliably demonstrate the same intent path across surfaces.

## Scope and non-goals

The current build owns Milestone 1 from inbound WhatsApp message through a compact market response. Trade execution, auth, handoffs, Buy Flow data exchange, templates, full UI, and real providers stay in their ordered milestones.

## Signature moments

1. `How is NVDA doing?` returns useful information in WhatsApp.
2. Buy preparation eventually crosses to ChatDex only at `Review & Buy` for explicit confirmation.

## Supplied materials

The complete authoritative pack is preserved under `implementation-pack/`; its README, AGENTS, decisions, named specification docs, and all design docs were inspected before scaffolding.

## Constraints

TypeScript, Next.js, PostgreSQL, modular monolith, provider isolation, one canonical Intent Protocol, clear demo labelling, and no invented Meta credentials.

## Decision register

- LOCKED (user/spec): progressive WhatsApp escalation and shared intents.
- LOCKED (user/spec): Meta Cloud API and PostgreSQL.
- ASSUMED (builder, reversible): npm workspaces as the monorepo mechanism.
- ASSUMED (builder, reversible): deterministic market adapter until a real API key/provider is chosen.

## Open questions

No question blocks Milestone 1 local proof. Meta app ownership, public deployment target, real market provider, auth provider, and PostgreSQL host must be supplied before their external proof gates.
