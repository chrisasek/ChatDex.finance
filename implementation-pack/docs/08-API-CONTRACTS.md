# 08 — API Contracts

V0 endpoints may be Next.js route handlers. Use typed request/response schemas and runtime validation.

## Auth/domain
- `POST /api/auth/start` — begin phone onboarding
- `POST /api/auth/verify` — verify session
- `GET /api/me`
- `GET /api/portfolio`
- `GET /api/activity`
- `GET /api/markets/search?q=`
- `GET /api/markets/:symbol`
- `POST /api/chat/messages` — persist Web Chat message, parse/query, return message + cards/intents
- `POST /api/intents` — create intent from Quick/Normal
- `POST /api/intents/:id/quote`
- `POST /api/intents/:id/confirm` — explicit irreversible-action confirmation in authenticated ChatDex
- `GET /api/orders/:id`
- `POST /api/claims`
- `GET /api/claims/:token`
- `POST /api/claims/:token/claim`

## WhatsApp
- `GET /api/webhooks/whatsapp` — webhook verification/challenge
- `POST /api/webhooks/whatsapp` — verify signature, deduplicate events, normalize Conversation/interactive events, resolve user, invoke intent/query flow, render/send response
- `POST /api/whatsapp/flows/data` (or provider-required equivalent) — handle V0 WhatsApp Flow data exchange/endpoint requests; validate/decrypt/sign according to the current provider contract before normalizing structured input
- Internal `sendTemplate(templateKey, recipient, variables, buttons?)` service — maps stable ChatDex template keys to provider-approved template names/languages/variables; no provider template IDs in domain code

WhatsApp response policy:
- informational query → return/send WhatsApp response; no handoff required
- preparatory action → render interactive WhatsApp response or Flow
- execution/sensitive action → create opaque handoff and render `Review & Buy` / equivalent
- never create a handoff merely because the request originated in WhatsApp

Webhook requirements:
- validate provider signature/challenge according to provider contract
- return quickly; do not expose domain errors to the provider
- deduplicate using provider message/event ID
- log correlation IDs, never secrets
- normalize payload before domain calls
- handle duplicate/retried delivery idempotently

## Secure action handoff
- `POST /api/handoffs` — internal/server creation of short-lived action handoff
- `GET /api/handoffs/:token` — authenticated resolve/preview
- `POST /api/handoffs/:token/confirm` — revalidate + explicit confirmation; idempotent

A WhatsApp `Review & Buy` URL should contain only an opaque handoff token, not trusted amount/symbol/provider parameters.

Use a consistent envelope: `{ data, error, meta }`. Never accept provider-specific payloads directly from clients as authoritative execution instructions.


### WhatsApp Flow requirements
- Keep Flow schema/version/provider details inside `packages/whatsapp`.
- Validate all submitted fields server-side; never trust Flow UI constraints alone.
- Convert a completed Buy Flow to the canonical `TRADE.BUY` intent and continue through the same quote/handoff path as free-form chat.
- A Flow completion is not authorization to execute an irreversible financial action.

### Template requirements
- Maintain an allowlisted registry of V0 template keys and variable schemas.
- Track provider delivery/message IDs for idempotency/observability.
- Use templates only where required/appropriate by WhatsApp messaging rules and approved template status.
- Buttons may open a Flow or secure ChatDex URL; do not encode trusted order data in button URLs.
