# Client questions

## Decisions that unblock later milestones

1. Which PostgreSQL host should back the deployed demo? Recommended: a managed preview database with a separate demo role. Affects durable deduplication and all later financial state.
2. Which market-data provider should replace the deterministic demo quote? Recommended: choose the provider already available to the team. Affects live quote freshness and attribution.
3. Which auth/phone verification provider should secure the handoff? Recommended: a managed OTP provider. Affects Flow 03 and cannot remain assumed before execution.
4. Which deployment platform/public HTTPS URL will Meta call? Recommended: the team’s fastest supported Next.js host. Affects real webhook proof.

## Confirm or correct

- ASSUMED: npm workspaces are acceptable for the modular monolith.
- ASSUMED: deterministic NVDA demo data is acceptable until market credentials are supplied, with explicit demo labelling.
- ASSUMED: use Meta's test number before any production phone-number activation.

## Deferred or discoverable

Meta app IDs, tokens, Flow ID, and secrets are configuration values and must not be placed in this document or committed.
