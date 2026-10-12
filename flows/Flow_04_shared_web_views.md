# Flow 04 — Shared Web views

## Entry

An authenticated demo user opens `/app` after completing a paper order or directly from ChatDex.

## Shared state

Chat View, Home and Activity load the same PostgreSQL positions and receipt payloads. The conversation transcript is presentation only; orders, executions, positions and receipts remain authoritative.

## Main interactions

1. Chat shows a compact portfolio face and latest receipt.
2. Home shows total paper value, unrealized P&L, positions and recent activity.
3. Activity lists receipts in reverse chronology and opens immutable-looking receipt detail.
4. Selecting a position opens Chat with structured instrument context.
5. Empty and database-error states provide clear next actions.

## Evidence

The production route was verified at 390 × 844 through authentication, Chat/Home switching, empty canonical state, and horizontal-overflow checks. See `evidence/flows/Flow_04/shared-views-mobile.png`.
