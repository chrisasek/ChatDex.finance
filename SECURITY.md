# Security model

## Trust boundaries

Meta webhook payloads and Flow submissions are untrusted. The adapter verifies `X-Hub-Signature-256`, validates runtime shapes, deduplicates provider IDs, and normalizes input before domain calls. Secrets remain server-only and logs use correlation IDs without request bodies or credentials.

## Authorization

Public market information may be answered for an unknown phone. Private portfolio and order data require a linked user. A WhatsApp identity, reply, button, or Flow completion never authorizes execution. Irreversible actions require a short-lived handoff, authenticated ownership check, state revalidation, and explicit idempotent confirmation.

## Milestone 1 controls

- exact webhook verification token comparison;
- HMAC SHA-256 signature verification using constant-time comparison;
- provider message ID deduplication;
- constrained parser and runtime validation;
- no trade or handoff from a market information request;
- outbound Meta failures are contained and correlated.

## Milestone 2 controls

- encrypted Flow requests use RSA-OAEP with SHA-256 and AES-128-GCM;
- response encryption bitwise-complements the IV as required by Meta's endpoint protocol;
- malformed base64, invalid authentication tags, and invalid runtime shapes fail closed;
- symbol, amount, and currency are revalidated server-side;
- Flow tokens are stored only as SHA-256 hashes in PostgreSQL;
- a repeated Flow token cannot create another prepared action;
- Flow completion creates preparation state only and cannot execute.

## Milestones 3 and 4 controls

- handoff tokens use 256 bits of randomness, are authenticated with HMAC-SHA-256, expire, and are stored only as SHA-256 hashes;
- preview and order values are loaded from server-side state rather than trusted URL parameters;
- review requires an HTTP-only, SameSite=Lax, HMAC-signed session cookie;
- confirmation binds the handoff to the authenticated user and locks the row in the PostgreSQL transaction;
- the execution, order, position, receipt, and consumed handoff update commit atomically;
- repeated confirmation returns the original receipt and cannot create a second execution;
- quotes and estimated quantity are refreshed immediately before paper execution;
- every action and receipt remains visibly labeled Demo and Paper.

The included session route is an explicit demo-only fallback. Production identity integration, rate limiting, live PostgreSQL concurrency testing, and deployment controls remain required before private or real-money use.

## Deployment hardening

- sensitive POST routes use bounded in-process rate limits suitable for the single-process cPanel demo;
- `/api/health?ready=1` verifies PostgreSQL without exposing connection details;
- response headers disable framing, MIME sniffing and unnecessary browser capabilities;
- private WhatsApp portfolio queries require an active phone-to-user link;
- unknown or unapproved template keys fail closed and pending templates use explicit text fallback;
- claims use opaque, signed, expiring, one-time tokens;
- crypto execution fails closed until a provider is configured, and live mode requires explicit activation.

Multi-instance production deployment requires a shared rate-limit store. The demo session must still be replaced with production identity before private or real-money use.
