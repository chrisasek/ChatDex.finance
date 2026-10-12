# 18 — 48-Hour Build Plan

> Headline promise: **Two taps from WhatsApp to the stock market.** WhatsApp V0 includes Conversation + one Buy Flow + a minimal Template set. Apply progressive escalation: information stays in WhatsApp, preparation stays in Conversation/Flow, and only execution/sensitive actions hand off to ChatDex. If time shrinks, protect the end-to-end demo and cut from the bottom.

## Hours 0–4 — Foundation + deploy
- initialize repo/monorepo
- Next.js + TypeScript
- PostgreSQL + migrations/ORM
- env validation
- deploy immediately with public HTTPS URL
- design tokens/app shell
- seed script
- Meta/WhatsApp test setup, webhook and Flow prerequisites
- identify/create the two V0 template keys and submit/configure approved templates as early as possible because approval is an external dependency

**Exit:** deployed app + database + webhook endpoint reachable; WhatsApp setup path known; template approval/config started.

## Hours 4–8 — WhatsApp Conversation adapter
- webhook verification/signature handling
- inbound event deduplication
- `packages/whatsapp` client/normalizer/conversation renderer
- map sender phone to user where possible
- echo/basic response test
- market lookup response with Buy action

**Exit:** real/test WhatsApp message receives a useful NVDA response entirely inside WhatsApp and exposes Buy without forcing a WebApp handoff.

## Hours 8–13 — WhatsApp Buy Flow
- implement one Buy Flow only
- wire provider-required Flow data endpoint/encryption/signing contract
- carry safe instrument context into Flow where supported
- collect amount/currency
- validate/treat Flow submission as untrusted input
- normalize Flow completion into canonical input

**Exit:** NVDA → Buy → Flow → $50 stays in WhatsApp through preparation and produces validated structured input; no WebApp handoff occurs until Review & Buy is required, and no trade executes.

## Hours 13–18 — Intent core + secure handoff
- Intent runtime schemas
- sources: `whatsapp_conversation | whatsapp_flow | chat | quick | normal`
- constrained parser for free-form `Buy $50 NVDA`
- validator/orchestrator
- market-data adapter
- paper trading provider
- prove Conversation and Flow produce same `TRADE.BUY`
- handoff table/service + short-lived opaque token
- `/action/[token]` review route

**Exit:** both WhatsApp paths produce the same canonical trade intent and secure Review & Buy handoff.

## Hours 18–22 — Confirm + receipt
- auth/session binding
- review screen
- quote/eligibility revalidation
- explicit confirm
- idempotent paper execution
- receipt persistence
- render completion state

**Exit:** WhatsApp → Flow/Conversation → Review & Buy → ChatDex → Confirm → Receipt works end-to-end.

## Hours 22–25 — Minimal Template set
- internal template registry
- map stable keys to approved provider names/languages/variables
- implement send service + delivery persistence
- wire one order/receipt update template and one claim/update template if approved/available
- buttons open Flow or secure ChatDex handoff where useful
- graceful fallback if external template approval is not ready

**Exit:** approved V0 templates can be sent without domain code knowing Meta template details.

## Hours 25–30 — Web Chat + cards
- Chat View
- core financial cards
- Quick Actions
- same intent/orchestrator path
- receipt shown in conversation

**Exit:** Web Chat and WhatsApp produce the same domain behavior.

## Hours 30–35 — Normal finance flow
- Normal Home
- markets/search
- asset detail
- Normal buy flow
- portfolio/activity
- shared state
- Normal → Chat context bridge

**Exit:** completed WhatsApp/Web order is visible in Normal View.

## Hours 35–38 — Portfolio intent + claims
- `How's my portfolio?` privacy/linking guard
- basic claim page/service
- WhatsApp share/deep link
- claim/update template if approved

## Hours 38–41 — Real crypto/onchain rail
- chosen provider adapter
- quote/confirmation/execution
- persist provider reference
- live/testnet receipt
- keep separate from stock-paper demo and label modes clearly

## Hours 41–44 — Marketing + polish
- hero: `Two taps from WhatsApp to the stock market.`
- demonstrate Conversation + Flow + secure execution
- explain Chat vs familiar Normal UI
- mobile/loading/error/empty states
- demo mode/reset/seed controls

## Hours 44–48 — Submission only
No new features. Repeatedly test deployed WhatsApp Conversation and Flow paths, template fallbacks, handoff expiry/idempotency, demo reset/seed, video, screenshots, README, architecture diagram, submission copy and backup deployment/config.
