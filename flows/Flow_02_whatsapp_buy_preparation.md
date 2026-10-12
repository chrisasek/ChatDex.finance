# Flow 02: WhatsApp buy preparation

## Goal

A WhatsApp user taps Buy or types `Buy $50 NVDA`, supplies the minimum safe fields, and produces one validated canonical `TRADE.BUY` preparation without authorizing execution.

## References and coverage

REF-001 owns the V0 Buy Flow, Intent Protocol equivalence, encrypted Flow endpoint, progressive escalation, and preparation-only boundary.

## Entries, sequence, and exits

The NVDA response launches `BUY_ASSET` with safe symbol/currency context and a unique Flow token. The user enters an amount. Meta calls the encrypted data endpoint. ChatDex verifies the app signature, decrypts, validates, creates the shared intent, persists the session idempotently, and returns encrypted `REVIEW_BUY` data. Flow 03 will add the secure Review & Buy handoff.

## States and feedback

INIT/navigate returns the input screen. Ping returns active health. Valid input returns prepared or already-prepared. Invalid/tampered fields fail without persistence. Unsupported transitions fail closed. This milestone labels the future execution mode `Paper trade` and explicitly says no trade has been placed.

## Interaction surface and transitions

Preparation stays in the native WhatsApp Flow. It uses one amount form and one review screen. It does not open the WebApp yet.

## Actions and functions

`POST /api/whatsapp/flows/data` owns HTTP verification/encrypted transport. `decryptFlowRequest` and `encryptFlowResponse` own Meta crypto. `BuyFlowService.handle` owns Flow transitions. `createTradeBuyIntent` owns canonical financial input normalization. `PostgresWhatsAppFlowStore.savePreparedBuy` owns idempotent persistence.

## Data and integrations

- Persistent data: yes

`intents` stores the canonical intent and `whatsapp_flow_sessions` stores adapter audit/session state. The raw Flow token is hashed before persistence. Meta Cloud API and WhatsApp Manager remain external.

## Security and abuse cases

App-signature verification happens before decryption. AES-GCM authenticates ciphertext. Runtime schemas reject missing/unknown transition shapes. Amount must be positive and no greater than USD 100,000 for the constrained demo parser. Duplicate Flow tokens cannot create multiple prepared intents.

## Accessibility

The Flow uses native labelled text inputs, headings, body copy, and footers. Paper/prepared meaning is expressed in text.

## Platform behavior

WhatsApp renders the Flow. ChatDex returns raw encrypted response text within Meta's endpoint protocol. The WebApp is not involved in this milestone.

## Contracts

Consumes `whatsapp-edge` and `intent`. Produces the preparation input for the Flow 02 → Flow 03 opaque-handoff contract.

## Verification

Automated tests cover RSA/AES round-trip, ping, intent equivalence, field tampering, encrypted-payload tampering, idempotency, and zero persistence on rejection. Typecheck, lint, and build must pass. Meta Flow Builder validation and real-device execution remain external.

## Open decisions

The production Meta Flow ID and public HTTPS URL are external configuration. Flow 03 will define the prepared quote/handoff response.

## Build seed

Use symbol NVDA, amount 50, currency USD, and a unique opaque Flow token.
