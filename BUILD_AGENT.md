# Build directive

Read root `AGENTS.md` and the entire authoritative `implementation-pack` in its prescribed order. Build the dependency order in `00_Flow_Map.md`, one runnable vertical slice at a time.

For every slice: re-read its contract, add a failing behavior/security test, implement through shared interfaces, run typecheck/lint/tests/build, exercise the runtime path, and state which external claims remain unverified. Keep provider payloads and credentials at the edge. Never let an LLM, WhatsApp message, button, or Flow submission authorize execution.

Do not begin a dependent milestone while the current one is red. Stop for missing execution-auth decisions, production deployment, DNS, financial-provider activation, spending, legal acceptance, destructive data operations, or real-user data changes without exact authority.
