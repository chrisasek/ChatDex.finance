ALTER TABLE template_deliveries
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS template_deliveries_idempotency_idx
  ON template_deliveries (idempotency_key);
