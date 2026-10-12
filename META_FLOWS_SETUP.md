# ChatDex Meta Flows setup

## V0 Flow inventory

ChatDex needs one WhatsApp Flow for V0:

| Flow | Purpose | Environment variable |
|---|---|---|
| Buy Flow | Collect `symbol`, `amount`, and `currency`; prepare a canonical paper buy; return a secure Review & Buy link | `WHATSAPP_BUY_FLOW_ID` |

Market and portfolio lookups are Conversation capabilities. Order/receipt and claim updates are Template Messages. A separate Claim Flow is deferred.

## Endpoint environment

The Buy Flow uses this encrypted data endpoint:

`https://usechatdex.com/api/whatsapp/flows/data`

Configure cPanel with:

```env
WHATSAPP_BUY_FLOW_ID=
WHATSAPP_FLOW_PRIVATE_KEY=
WHATSAPP_FLOW_PRIVATE_KEY_PASSPHRASE=
```

The private key belongs to the encrypted Flow endpoint, so it is intentionally not named `WHATSAPP_BUY_FLOW_PRIVATE_KEY`. Upload/register the matching RSA-2048 public key with Meta. Never give Meta the private key.

## Meta setup sequence

1. Open **WhatsApp Manager → Account tools → Flows**.
2. Create `ChatDex Buy` with category `OTHER`.
3. Import `meta/flows/buy-flow.json` into the Flow JSON editor.
4. Set the endpoint URI to `https://usechatdex.com/api/whatsapp/flows/data`.
5. Generate an encrypted RSA-2048 key pair. Put the private key and passphrase in cPanel. For a cPanel single-line value, replace every real line break in the PEM with the two characters `\n`. Do not wrap the value in quotes.
6. Register the matching public key for the live WhatsApp phone number in Meta.
7. Run Meta's endpoint health check. The encrypted `ping` must pass.
8. Publish the Flow and copy its numeric ID into `WHATSAPP_BUY_FLOW_ID`.
9. Restart the cPanel Node application.
10. Send `How is NVDA doing?`, tap **Buy**, enter `50`, and open the returned secure Review & Buy link.

`WHATSAPP_FLOW_ID` remains a backward-compatible alias. New deployments should use `WHATSAPP_BUY_FLOW_ID`.

If the endpoint returns `FLOW_REQUEST_FAILED`, open the Node application's `stderr.log` and find the `whatsapp_flow_failed` entry with the correlation ID returned by the endpoint. Common causes are a private key that does not match Meta's registered public key, an incorrect passphrase, or PEM newlines lost when entering the cPanel variable. Restart the Node application after every key-variable change.

## Link the live WhatsApp number to the demo account

Private portfolio data is returned only when the inbound WhatsApp number matches an active ChatDex user. Replace the example with your live sender number in E.164 format:

```sql
UPDATE users
SET phone = '+2348012345678', updated_at = now()
WHERE id = '00000000-0000-4000-8000-000000000001';
```

After linking, both `How's my portfolio?` and `How’s my portfolio?` resolve to the demo user's PostgreSQL portfolio.
