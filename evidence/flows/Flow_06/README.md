# Flow 06 — Portfolio privacy and demo claims

## Goal

An authenticated sender can create an opaque, expiring demo claim and deliberately share its private link. A different authenticated recipient can preview the safe claim details, confirm once, and see the completion state. Reopening the same link shows that it was already collected.

WhatsApp portfolio requests continue to require a safely linked phone before private holdings are returned.

## Security and product boundaries

- Claim tokens contain no amount, recipient, or sender data.
- PostgreSQL performs the pending, unexpired, recipient-matched, not-self, one-time update atomically.
- Public preview exposes only sender display name, amount, currency, expiry, reference, and Demo status.
- Claim settlement is explicitly demo-only; it does not represent withdrawable money.
- ChatDex does not automatically send claim details to a user-entered phone. The sender must explicitly share the private link.
- The approved claim template remains registered but is not automatically triggered without a trusted recipient-authorization step.

## Verification — 2026-10-10

- Claim and template focused tests — PASS.
- Full suite — PASS: 43 tests across 10 files.
- TypeScript — PASS.
- ESLint — PASS.
- Production build — PASS; claim create, resolve, and complete APIs plus `/c/[token]` included.
- Visible-browser sender/recipient flow — PASS: create, opaque link, sender boundary, demo-recipient authentication, one-time completion, used-link state, zero console errors.
- Deployed cPanel runtime — UNVERIFIED until the generated artifact is uploaded and smoke-tested.

Review type: self-reviewed, lower assurance.
