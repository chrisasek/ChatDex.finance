# 16 — Environment and Configuration

Provide `.env.example`; never commit secrets. Suggested variables:
```env
DATABASE_URL=
APP_URL=http://localhost:3000
DEMO_MODE=true
LLM_API_KEY=
MARKET_DATA_API_KEY=
AUTH_PROVIDER_KEY=
CRYPTO_PROVIDER_API_KEY=
CRYPTO_PROVIDER_SECRET=
CRYPTO_NETWORK=

# WhatsApp / Meta Cloud API (use the exact names required by the chosen integration)
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_FLOW_ID=
WHATSAPP_FLOW_PRIVATE_KEY=
WHATSAPP_FLOW_PRIVATE_KEY_PASSPHRASE=
WHATSAPP_TEMPLATE_ORDER_UPDATE=
WHATSAPP_TEMPLATE_CLAIM_UPDATE=
```

Use server-only environment access for secrets. Validate env at startup. Never expose WhatsApp access/app secrets to the browser. Separate demo/testnet/mainnet configuration. Default hackathon financial execution to demo/testnet where possible.

Provider-specific Flow encryption/signing variables must follow the current Meta contract. Keep keys server-only and document local/test setup without committing secrets. Template names should be configuration mapped to stable internal template keys.
