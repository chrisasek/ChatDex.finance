# ChatDex

ChatDex is a chat-first financial application. This repository implements the supplied `implementation-pack` as an npm workspace with a Next.js WebApp and shared TypeScript domain packages.

## Completed milestones

Milestone 1 handles `How is NVDA doing?` through the WhatsApp webhook pipeline:

`verify → normalize → deduplicate → parse MARKET.VIEW → orchestrate → market provider → render/send WhatsApp response`

The response stays inside WhatsApp and exposes a Buy preparation action. It never creates or executes a trade.

Milestone 2 adds one encrypted Meta WhatsApp Buy Flow. It carries safe NVDA context, collects and validates amount/currency, persists an idempotent preparation session, and produces the same canonical `TRADE.BUY` semantics as `Buy $50 NVDA`. It still cannot execute a trade.

Milestone 3 adds the approved authenticated Review & Buy handoff. WhatsApp receives an opaque, short-lived URL; the WebApp resolves order data server-side and requires an authenticated session before showing the review.

Milestone 4 adds explicit paper-order confirmation and a durable receipt. Confirmation refreshes the quote, binds the handoff to the authenticated user, records the execution and position transactionally, and returns the original receipt when the same token is submitted again.

Milestone 5 adds the shared authenticated WebApp at `/app`. Chat View and Normal View read the same PostgreSQL positions and receipts, with portfolio, activity, receipt detail, empty/error states, and a structured instrument context bridge.

The pre-upload hardening pass adds linked-phone WhatsApp portfolio queries, a validated Meta template registry with approval-safe fallback, claims and crypto provider boundaries, claims/template persistence, dependency readiness, rate limits, security headers, PWA metadata, architecture and demo documentation.

## Local setup

1. Copy `.env.example` to `.env.local` and configure PostgreSQL.
2. Run `npm install`.
3. Run `npm run bootstrap`.
4. Run `npm run dev`.

Tests do not require Meta or PostgreSQL credentials because provider and persistence seams are injected.

## Checks

```text
npm run typecheck
npm run lint
npm test
npm run build
```

Meta and backend setup are documented in `BACKEND_SETUP.md`. Real Meta delivery, Flow publication, PostgreSQL migration execution, and provider integration remain externally unverified until their credentials and services are configured.
