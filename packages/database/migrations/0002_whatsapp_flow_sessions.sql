CREATE TABLE IF NOT EXISTS whatsapp_flow_sessions (
  id uuid PRIMARY KEY DEFAULT chatdex_random_uuid(),
  user_id uuid REFERENCES users(id),
  phone text,
  flow_key text NOT NULL,
  provider_flow_id text,
  flow_token_hash text UNIQUE NOT NULL,
  status text NOT NULL CHECK (status IN ('started', 'submitted', 'expired', 'cancelled')),
  input_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  intent_id uuid REFERENCES intents(id),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whatsapp_flow_sessions_pending_expiry_idx
  ON whatsapp_flow_sessions (expires_at)
  WHERE status IN ('started', 'submitted');
