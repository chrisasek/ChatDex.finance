# 04 — Repository Structure

```text
chatdex/
├── apps/
│   └── web/
│       ├── app/
│       │   ├── (marketing)/
│       │   ├── (auth)/
│       │   ├── (app)/
│       │   ├── c/[token]/
│       │   └── api/
│       ├── components/
│       └── public/
├── packages/
│   ├── ui/
│   ├── cards/
│   ├── intents/
│   ├── core/
│   ├── database/
│   ├── markets/
│   ├── trading/
│   ├── portfolio/
│   ├── claims/
│   ├── providers/
│   └── shared/
├── AGENTS.md
└── README.md
```

Keep business logic out of React components and route handlers. Route handlers call application/domain services. Provider-specific code lives only under provider adapters.

## Design-system implementation
Recommended UI package structure:
```text
packages/ui/src/
  tokens/
  primitives/
  chat/
  complications/
  financial-cards/
  application/
  navigation/
```
Read `docs/design/` before creating these components. Reuse tokens/primitives across Chat and Normal View.


## WhatsApp interface adapter additions
```text
apps/web/app/api/webhooks/whatsapp/route.ts
apps/web/app/(app)/action/[token]/page.tsx
packages/whatsapp/
  client.ts
  webhook.ts
  normalize-message.ts
  message-renderer.ts
  types.ts
packages/core/handoffs/
```
`packages/whatsapp` is an edge adapter only. It may call shared intent/query/application services but must not own trading, portfolio, claims or provider business logic.
