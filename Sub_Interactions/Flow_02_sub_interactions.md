# Flow 02 interaction sweep

## Interaction map

Buy → native Flow opens → NVDA context visible → amount entry → Review → prepared confirmation → Done.

## Surface decisions

A WhatsApp Flow is the correct container because it gathers one structured amount while keeping preparation in WhatsApp. Execution and authentication are absent.

## Spawned surfaces

No WebApp surface is spawned in Milestone 2. Flow 03 will replace the terminal completion with a secure Review & Buy handoff.

## Hidden states

Endpoint ping, encrypted INIT, invalid signature, decryption failure, invalid amount, duplicate token, database failure, and expired future session state.

## Edge cases

Lowercase symbols/currency normalize safely. Negative, zero, excessive, malformed, or tampered inputs reject. Repeated submission reports already prepared and creates no duplicate intent.

## Micro-interactions

The amount field uses a numeric input type. Review copy names the symbol, amount, currency, and paper mode, and states that execution has not happened.

## Motion and interruption

WhatsApp owns native screen transitions. A repeated submission after interruption resolves idempotently through the Flow token.

## Feedback and semantic haptics

Text status provides feedback. No custom haptic is claimed.

## Gaps found

Meta must validate the Flow JSON version/components and encrypted health check against the configured account before the native experience can be claimed.
