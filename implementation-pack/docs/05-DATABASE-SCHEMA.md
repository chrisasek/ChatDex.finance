# 05 — Database Schema

Use PostgreSQL. IDs may be UUID/ULID consistently. Include created_at/updated_at where appropriate.

## Tables
### users
`id, phone, name, country_code, status`

### accounts
`id, user_id, type, currency, provider, external_id, status`

### instruments
`id, symbol, name, asset_type, currency, provider_symbol, metadata_json`

### balances
`id, account_id, asset, available, locked`

### conversations
`id, user_id`

### messages
`id, conversation_id, role, content, intent_id nullable, card_payload_json nullable`

### intents
`id, user_id, type, source, status, payload_json, context_json`

### orders
`id, user_id, instrument_id, side, order_type, amount, quantity, quoted_price, status, execution_mode, provider, intent_id`

### executions
`id, order_id, provider, external_id, price, quantity, fee, status, executed_at, metadata_json`

### positions
`id, user_id, instrument_id, quantity, avg_entry, current_price, realized_pnl, unrealized_pnl`

### transactions
`id, user_id, type, amount, currency, status, provider, external_id, metadata_json`

### receipts
`id, user_id, type, reference, status, payload_json`

### claims
`id, sender_id, recipient_phone nullable, amount, currency, token unique, status, expires_at, claimed_by nullable`

## Rules
- Store money using integer minor units or a decimal type with explicit precision; never binary float.
- Provider payloads may be JSONB, but canonical financial fields remain typed columns.
- Never derive authoritative balances only from chat history.

## WhatsApp + secure handoff additions
Add persistence for external message deduplication and secure action handoffs.

### `external_messages`
- id
- provider (`whatsapp`)
- external_message_id (unique)
- user_id nullable
- sender_phone
- direction (`inbound`/`outbound`)
- status
- metadata JSONB
- created_at

### `action_handoffs`
- id
- token_hash (unique; never store a reusable raw secret if avoidable)
- user_id nullable until safely linked
- phone nullable
- intent_id
- status (`pending`/`used`/`expired`/`cancelled`)
- expires_at
- used_at nullable
- created_at

Indexes: unique provider+external_message_id; unique token_hash; index pending handoffs by expires_at. The handoff stores/references authoritative server-side intent state; URLs carry only opaque tokens.


## WhatsApp Templates + Flows additions
### `whatsapp_flow_sessions`
- id
- user_id nullable
- phone
- flow_key
- provider_flow_id nullable
- status (`started`/`submitted`/`expired`/`cancelled`)
- input_json JSONB
- intent_id nullable
- expires_at
- created_at / updated_at

### `whatsapp_template_deliveries`
- id
- user_id nullable
- phone
- template_key
- provider_template_name
- language
- external_message_id nullable
- status
- variables_json JSONB
- created_at / updated_at

Do not duplicate authoritative financial state in these tables. Flow sessions reference the canonical intent after normalization; template delivery rows are messaging/audit state only.
