# ChatDex Meta template setup

## V0 inventory

Create these two templates in WhatsApp Manager as **Utility** templates. Use English (`en`) and preserve the variable order exactly because the application sends positional body parameters.

### 1. Order receipt update

- Suggested Meta name: `chatdex_order_receipt_update`
- Environment variable: `WHATSAPP_TEMPLATE_ORDER_UPDATE`
- Body:

```text
Your ChatDex paper order {{1}} is {{2}}. {{3}} {{4}} of {{5}}. Open ChatDex to view the receipt.
```

Sample values:

| Position | Value | Meaning |
|---|---|---|
| `{{1}}` | `CDX-ABC123` | Receipt reference |
| `{{2}}` | `completed` | Order status |
| `{{3}}` | `USD` | Currency |
| `{{4}}` | `50.00` | Amount |
| `{{5}}` | `NVDA` | Symbol |

This template is sent after authenticated paper-order confirmation. If its environment variable is empty, ChatDex sends the equivalent text message while the 24-hour conversation window permits it.

### 2. Claim update

- Suggested Meta name: `chatdex_claim_status_update`
- Environment variable: `WHATSAPP_TEMPLATE_CLAIM_UPDATE`
- Body:

```text
Your ChatDex claim {{1}} is now {{2}}. Amount: {{3}} {{4}}. Open ChatDex to view the claim details.
```

Sample values:

| Position | Value | Meaning |
|---|---|---|
| `{{1}}` | `CLM-ABC123` | Claim reference |
| `{{2}}` | `pending` | Claim status |
| `{{3}}` | `USD` | Currency |
| `{{4}}` | `25.00` | Amount |

Optionally add a static **Open ChatDex** website button pointing to `https://usechatdex.com/app`. Do not add a one-time password, verification code, login instruction, or authentication wording to this template.

The claim sender is implemented and validated, but its product trigger remains deferred until the claim flow milestone.

## Activation

1. Submit both templates in Meta and wait for approval.
2. Put the exact approved names into the matching cPanel environment variables.
3. Import the latest `dist/chatdex-postgres.sql` so `template_deliveries.idempotency_key` exists.
4. Upload the latest `dist/chatdex-cpanel.zip` and restart the Node application.
5. Complete a paper buy from WhatsApp. After confirmation, verify the receipt update arrives in WhatsApp.
6. Query `template_deliveries` to confirm the provider message ID and current status were stored.

```sql
SELECT template_key, provider_template_name, recipient_phone,
       external_message_id, status, created_at, updated_at
FROM template_deliveries
ORDER BY created_at DESC
LIMIT 20;
```

Do not put template IDs or names in financial domain code. Approval or naming changes are handled only through the environment mapping.
