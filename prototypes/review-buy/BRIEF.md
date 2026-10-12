# Review & Buy prototype brief

Goal: Let a user understand a prepared NVDA paper order and explicitly confirm or leave safely.
Human and feel: Mobile WhatsApp entrant; calm, legible, consequential, and never ambiguous about simulation.
Entry and exit: Opaque `/action/<token>` after WhatsApp preparation; exit to receipt, cancellation, login, or WhatsApp.
System: ChatDex mobile-first page; light app environment with one dark financial face and supplied typography/geometry.
Signature: A compact black order face makes amount, estimated shares, and Paper trade status readable at one glance.
Feedback: Localized progress, 160ms opacity/translate continuity, no browser haptic claim, reduced-motion fallback.
Rejecting: Generic trading dashboard and urgency/countdown pressure.
Variants: Auth-required, ready, confirming, success, expired, unavailable/offline, error/retry, and cancelled.

## State and transition map

| From | Trigger | Guard or input | To | Container | Feedback | Recovery or exit |
|---|---|---|---|---|---|---|
| Entry | Open opaque link | no session | Auth required | page | ownership explanation | sign in or return |
| Entry | Open opaque link | valid session/token | Loading | page | localized progress | cancel |
| Loading | Resolve | valid preview | Ready | page | order face appears | confirm or cancel |
| Loading | Resolve | expired token | Expired | page | explicit expired status | return to WhatsApp |
| Loading | Resolve | offline/unavailable | Unavailable | page | reason + retry | retry or return |
| Ready | Confirm paper buy | authenticated + current quote | Confirming | inline page state | button progress + live announcement | request remains idempotent |
| Confirming | Execution succeeds | idempotency accepted | Success | page | receipt reference | view receipt or done |
| Confirming | Provider/domain error | safe failure | Error | inline/page | plain-language failure | retry or cancel |
| Ready | Cancel | any valid preview | Cancelled | page | cancellation acknowledgement | return to WhatsApp |
| Any active | Token/session expires | clock/session guard | Expired/Auth required | page | explicit state change | sign in/restart |

## State applicability

- Empty: N/A because a token either resolves to one prepared order or fails.
- Permission denial: represented by Auth required/ownership failure.
- Destructive confirmation: N/A; paper purchase is consequential but cancellation is reversible and needs no second modal.
- Native haptics: unverified and omitted from the web prototype.
