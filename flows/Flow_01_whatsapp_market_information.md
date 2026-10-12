# Flow 01: WhatsApp market information

## Goal

A WhatsApp user asks about NVDA and receives a compact, explicitly demo-labelled market response inside WhatsApp, with a Buy preparation action. No trade or handoff is created.

## References and coverage

REF-001 owns the WhatsApp Conversation headline path from the product spec, V0 scope, venue, action policy, API contract, tests, and build plan.

## Entries, sequence, and exits

Meta GET verification proves callback ownership. A signed POST is verified, normalized, deduplicated, parsed into `MARKET.VIEW`, orchestrated through `MarketDataProvider`, rendered as an interactive response, and delivered. Buy exits to Flow 02.

## States and feedback

Valid information returns a market card. Unknown symbols return a helpful text response. Unsupported/missing input returns a constrained prompt. Invalid signatures return 401. Delivery failure returns a generic 500 and marks/releases the event for retry. Duplicate completed events are acknowledged without another response.

## Interaction surface and transitions

The information stays inside WhatsApp. The compact response has one primary 44px-equivalent provider control: Buy. No WebApp transition occurs in this flow.

## Actions and functions

`POST /api/webhooks/whatsapp` validates the request. `WhatsAppMessageService.handleWebhook` owns adapter sequencing. `parseTextIntent` creates the canonical intent. `ChatDexOrchestrator.handle` queries a provider. `renderResult` creates the Meta-safe response.

## Data and integrations

- Persistent data: yes

`external_messages` records provider IDs and processing status. Meta Cloud API is external. Demo market data is deterministic until a live provider is configured.

## Security and abuse cases

HMAC uses constant-time comparison and rejects malformed digests. Payloads are schema-checked. Raw bodies/secrets are not logged. Public market data needs no linked account. Retries cannot duplicate completed responses.

## Accessibility

Meaning uses text (`up`, percent, `Demo market data`) and does not rely on color. The single action has a concise text label.

## Platform behavior

Meta controls the native WhatsApp rendering. The Next.js route runs in the Node runtime because HMAC and PostgreSQL require server APIs.

## Contracts

Consumes `whatsapp-edge`, `intent`, `market-data`, and `observability` from `00_Flow_Contracts.md`.

## Verification

Eight unit/contract tests cover parsing, missing input, challenge, signature, normalization, information rendering, deduplication, and retry. Typecheck, lint, build, health runtime, and webhook challenge runtime are required. Real Meta send and PostgreSQL persistence remain externally unverified.

## Open decisions

The live market provider, deployed database, and Meta app configuration are deferred to their external setup checkpoints.

## Build seed

Use `How is NVDA doing?`, Meta message ID `wamid.1`, and deterministic quote `$182.51`, up `2.40%`, labelled demo.
