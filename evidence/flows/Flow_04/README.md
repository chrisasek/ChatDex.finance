# Flow 04 — Web Chat and shared views

## Contract

An authenticated user can use typed Chat or explicit Quick Actions to query NVDA, view the authoritative PostgreSQL portfolio, and prepare a `$50 NVDA` paper buy. Chat and Quick Actions create the same canonical intents used by WhatsApp. Preparation returns an opaque, user-bound Review & Buy handoff; execution still requires explicit confirmation on the secure action route.

Normal View continues to render the same persisted positions, activity, and receipts. Selecting a position carries visible instrument context into Chat, allowing constrained commands such as `Buy $25` and `How is this doing?`.

## Regression impact

- Informational actions complete inside Chat.
- Quick Actions do not fake text messages.
- Paper execution remains explicitly labelled.
- Chat cards contain presentation only; intent parsing, portfolio lookup, and handoff preparation remain in shared services.
- Notification, WhatsApp Conversation, WhatsApp Flow, confirmation, and receipt behavior remain unchanged.

## Verification — 2026-10-09

- Focused intent, Web Chat, and handoff tests — PASS, 14 tests.
- Full suite — PASS, 41 tests across 9 files.
- TypeScript — PASS.
- Focused ESLint for all changed Web files — PASS with the existing custom-pages-directory warning.
- Next.js production build — PASS; `/api/chat/messages` included as a dynamic route.
- Visible-browser mobile and desktop flow — PASS: demo authentication, Markets Quick Action, typed NVDA query, Buy Quick Action, order card, opaque Review & Buy URL, zero browser console errors.
- Deployed cPanel runtime — UNVERIFIED until the generated artifact is uploaded and smoke-tested.

Review type: self-reviewed, lower assurance.
