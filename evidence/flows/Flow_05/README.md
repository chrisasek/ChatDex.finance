# Flow 05 — Normal finance flow

## Goal

An authenticated user can browse/search demo stock markets, open NVDA detail, carry NVDA into Chat as structured context, and prepare a conventional paper buy that produces the same canonical `TRADE.BUY` intent and secure Review & Buy handoff as WhatsApp and Web Chat.

Completed WhatsApp/Web orders remain visible through the existing PostgreSQL-backed Home portfolio, activity list, and receipt detail.

## Regression impact

- Normal View preparation never executes a trade.
- The secure action route still requires explicit confirmation.
- Handoffs are opaque, short-lived, and bound to the authenticated user.
- Demo market data and paper execution remain visibly labelled.
- Chat, Quick Actions, WhatsApp, confirmation, receipts, portfolio, and template delivery keep their existing paths.

## Verification — 2026-10-09

- Normal service focused tests — PASS.
- Full suite — PASS: 43 tests across 10 files.
- TypeScript — PASS.
- Focused ESLint — PASS.
- Production Next.js compilation — PASS; `/api/markets` and `/api/orders/prepare` included.
- Visible-browser mobile/desktop flow — PASS: demo sign-in, Home, Markets, NVDA detail, `$75` paper-buy preparation, opaque Review & Buy URL, NVDA-to-Chat context, zero console errors.
- Deployed cPanel runtime — UNVERIFIED until the generated artifact is uploaded and smoke-tested.

Review type: self-reviewed, lower assurance.
