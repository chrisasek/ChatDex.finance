# 14 — Claims and Receipts

## Receipt
Every completed/failed financial action produces a persisted receipt. Receipt fields: id, user, type, status, reference, canonical payload, timestamps, execution mode.

## Claim
Create a random unguessable token and public route `/c/:token`.

Flow: `sender creates claim → ChatDex persists claim → share link → recipient opens → sees amount/sender → authenticate/verify phone if needed → claim → mark claimed → receipt`.

## V0 constraints
Claim settlement may use demo balances if real money movement is not implemented. Label demo behavior. Enforce expiry and one-time claim semantics in the database. Never expose private account details in share previews.
