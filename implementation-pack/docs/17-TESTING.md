# 17 — Testing and Definition of Done

## Critical shared-core tests
- WhatsApp `Buy $50 NVDA`, Web Chat equivalent, Quick and Normal equivalents create the same canonical intent shape except `source`/context metadata.
- Missing amount/symbol requests clarification rather than guessing.
- Paper/live label is correct.
- Confirmation is required before execution.
- Provider errors do not corrupt order state.
- Completed order updates portfolio/activity and appears across Web Chat/Normal.
- Normal → Chat carries asset context.
- Claim token is one-time and expiry is enforced.
- Unauthorized user cannot access private portfolio/order data.

## WhatsApp action-policy tests
- market lookup completes in WhatsApp without opening the WebApp
- portfolio summary completes in WhatsApp without opening the WebApp
- Buy preparation can collect amount through WhatsApp/Flow without premature WebApp handoff
- execution requires the secure authenticated handoff and explicit confirmation
- sensitive account actions cannot complete solely from WhatsApp identity
- WebApp handoff is not emitted for an information action unless the user explicitly asks for richer details

## WhatsApp adapter tests
- webhook verification succeeds only with correct verification inputs
- invalid webhook signatures are rejected
- duplicate inbound message/event IDs do not create duplicate intents/actions
- `How is NVDA doing?` returns a compact market response
- private portfolio request from an unlinked/unauthorized phone does not leak data
- `Buy $50 NVDA` creates an intent/preview but does **not** execute
- Review & Buy URL contains an opaque token, not authoritative order details
- expired/used handoff tokens fail safely
- handoff survives required login and binds to the intended user
- quote/eligibility are revalidated before confirmation
- repeated confirm requests are idempotent

## WhatsApp Flow + Template tests
- tapping Buy from the NVDA response opens/starts the configured V0 Buy Flow
- valid Flow submission creates the same canonical `TRADE.BUY` as free-form `Buy $50 NVDA`, except source metadata
- invalid/tampered Flow fields fail validation
- duplicate Flow submission cannot create duplicate executable actions
- Flow completion never executes an irreversible action directly
- template registry rejects unknown/unapproved internal template keys
- template variable shape is validated before send
- template delivery IDs/statuses are persisted without changing financial state
- template/Flow buttons use opaque handoff references where required

## Headline demo definition of done
From a real/test WhatsApp interaction: ask `How is NVDA doing?`, tap `Buy`, complete the V0 Buy Flow for $50, receive/open the valid `Review & Buy` handoff, authenticate if needed, review the clearly labelled execution mode, explicitly confirm, see a persisted receipt and updated state. Then demonstrate the same portfolio/order state in Normal View. Free-form `Buy $50 NVDA` must reach the same canonical intent path.

Also smoke-test `How is NVDA doing?` and `How's my portfolio?`.

Run smoke tests against the deployed URL before recording.
