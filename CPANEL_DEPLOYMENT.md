# cPanel deployment

ChatDex must run as a Node.js application. A static `public_html` upload cannot serve its webhook, Flow endpoint, authentication, or confirmation routes.

## Hosting requirements

- cPanel **Web Apps**, **Application Manager**, or **Setup Node.js App** access
- Node.js 22 or newer
- a domain or subdomain with a valid HTTPS certificate
- a PostgreSQL database reachable from the cPanel server
- permission to add application environment variables

## Build the upload artifact

Run locally:

```text
npm ci
npm run package:cpanel
```

Upload the contents of `dist/cpanel` into a private application directory outside `public_html`, for example `~/chatdex`. Do not upload `.env`, `.env.local`, source credentials, or private keys as public files.

## Register the application

Create a Node.js application in cPanel with:

- application root: the directory containing the uploaded artifact
- application URL: the final HTTPS domain or subdomain
- Node.js version: 22 or newer
- startup file: `app.js`
- mode: Production

cPanel supplies `PORT`; do not create or override it. Restart the application after every artifact or environment change.

## Environment variables

Add these through the cPanel application environment editor:

```text
NODE_ENV=production
APP_URL=https://your-domain.example
DATABASE_URL=postgresql://...
DEMO_MODE=true
HANDOFF_TOKEN_SECRET=...
SESSION_SECRET=...
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_BUSINESS_ACCOUNT_ID=...
WHATSAPP_VERIFY_TOKEN=...
WHATSAPP_APP_SECRET=...
WHATSAPP_GRAPH_API_VERSION=v23.0
WHATSAPP_BUY_FLOW_ID=...
WHATSAPP_FLOW_PRIVATE_KEY=...
WHATSAPP_FLOW_PRIVATE_KEY_PASSPHRASE=...
WHATSAPP_TEMPLATE_ORDER_UPDATE=...
WHATSAPP_TEMPLATE_CLAIM_UPDATE=...
```

Use distinct random values of at least 32 characters for the handoff and session secrets. Keep the Flow private key server-only. Production identity must replace demo sign-in before private or real-money use.

## Database

Run `npm run package:database`, then import `dist/chatdex-postgres.sql` into the deployment database before accepting webhook traffic. The generated file applies the versioned migrations and deterministic demo seed in one transaction and is safe to rerun. The packaged runtime does not automatically alter the production schema at startup.

## Smoke checks

1. `GET https://your-domain.example/api/health` returns a successful response.
2. `GET /api/webhooks/whatsapp` with Meta's verification parameters returns the challenge.
3. Register `https://your-domain.example/api/webhooks/whatsapp` in Meta and subscribe to `messages`.
4. Set the WhatsApp Flow data endpoint to `https://your-domain.example/api/whatsapp/flows/data` and pass Meta's health check.
5. Send `How is NVDA doing?`, open **Buy**, prepare `$50`, and complete the paper receipt flow on mobile.
6. After Meta approves the Utility templates, complete another paper buy and verify the order receipt update arrives in WhatsApp and its status appears in `template_deliveries`.

See `META_TEMPLATES_SETUP.md` for the exact template bodies and positional variables. Leave a template environment variable empty until its matching Meta template is approved; ChatDex will use its safe in-window text fallback.

If cPanel does not offer a Node.js application feature or only provides Node.js below version 22, this hosting account cannot run the current ChatDex build.
