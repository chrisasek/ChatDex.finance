# Backend setup

## Stack

Next.js 16 + React 19, TypeScript, npm workspaces, PostgreSQL through `pg`, Zod runtime schemas, and Vitest. The modular monolith keeps shared contracts in packages and deploys one WebApp/API process.

## PostgreSQL

Set `DATABASE_URL`, then run `npm run bootstrap`. Migrations are versioned under `packages/database/migrations`; seed data is deterministic and upserted. The migration runner records applied filenames in `schema_migrations` and is safe to rerun.

## Secure action handoffs

Set `HANDOFF_TOKEN_SECRET` and `SESSION_SECRET` to separate random values of at least 32 characters. `APP_URL` must be the public HTTPS origin used to construct Review & Buy links. Handoff URLs expire after ten minutes by default; only their SHA-256 hashes are stored.

Set `CLAIM_TOKEN_SECRET` to another independent random value of at least 32 characters before enabling claim routes. Keep `CRYPTO_EXECUTION_MODE=testnet` until a chosen provider is configured and live activation is explicitly approved.

`DEMO_MODE=true` enables the local demo sign-in and paper execution adapter. The demo user is created by the seed. Disable demo mode outside an isolated demo environment and replace the demo session route with the production identity provider before handling private account data.

## Meta test setup

1. Create/select a Meta developer app with WhatsApp.
2. Add a WhatsApp Business Account and test phone number.
3. Set `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, and `WHATSAPP_APP_SECRET`.
4. Expose `https://<public-host>/api/webhooks/whatsapp` over HTTPS.
5. Register that callback and the exact verification token, then subscribe to `messages`.
6. Send `How is NVDA doing?` from an allowed test recipient.

## WhatsApp Buy Flow setup

1. Generate an encrypted RSA-2048 private key and corresponding public key using Meta's maintained WhatsApp Flows tooling or OpenSSL. Keep the private key and passphrase server-only.
2. Put the private PEM in `WHATSAPP_FLOW_PRIVATE_KEY` and its passphrase in `WHATSAPP_FLOW_PRIVATE_KEY_PASSPHRASE`. Multiline PEM or escaped `\\n` values are accepted.
3. Upload/register only the public key for the configured WhatsApp phone number in WhatsApp Manager/Business encryption setup.
4. Create one Flow in WhatsApp Manager and import `packages/whatsapp/flows/buy-asset.flow.json`.
5. Set its data endpoint to `https://<public-host>/api/whatsapp/flows/data` and run Meta's endpoint health check.
6. Publish the Flow only after Meta validates the JSON and endpoint, then put its real ID in `WHATSAPP_FLOW_ID`.
7. Re-send the NVDA response and verify Buy opens the Flow, `$50` reaches `REVIEW_BUY`, and no execution occurs.

The endpoint requires Meta's `X-Hub-Signature-256`, decrypts the three encrypted envelope fields, and returns raw encrypted base64 text. Never upload or paste the private key into source control.

The current demo market adapter returns deterministic seeded NVDA data and labels it as demo data. Real Meta delivery, Flow JSON publication/health validation, PostgreSQL migration execution, and a real market-data provider remain unverified until configured.
