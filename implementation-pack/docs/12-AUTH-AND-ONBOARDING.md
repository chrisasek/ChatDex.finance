# 12 — Auth and Onboarding

## Product decision
The user's WhatsApp phone number is the primary onboarding/account identifier. An inbound WhatsApp message can help identify the originating phone number, but **message origin is not sufficient authorization for an irreversible financial action**.

## Web/PWA V0 flow
`Open ChatDex → enter phone → verify → create session → optional name/country → Chat`.

Use an existing reliable verification/auth provider if available. For a demo-only fallback, make the limitation explicit and do not present weak verification as production security.

## WhatsApp linking
When a known phone messages ChatDex, resolve it to the corresponding account where possible. For unknown phones, informational market queries may be answered without private account data; private portfolio requests should return an onboarding/link prompt. Do not expose private portfolio data until account linkage/auth policy is satisfied.

## Secure handoff
A trade intent started on WhatsApp creates a short-lived action handoff. When the user taps `Review & Buy`, ChatDex requires an authenticated session. If login is needed, preserve the handoff across login and then show the review screen. Revalidate price/quote, eligibility and balance before confirmation.

## Real financial actions
Require explicit confirmation inside ChatDex. Wallet/provider signing may satisfy the real crypto rail. Passkeys/strong transaction auth are a post-demo priority if not feasible within the build window.
