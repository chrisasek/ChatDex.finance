CREATE TABLE IF NOT EXISTS claims (
  id uuid PRIMARY KEY DEFAULT chatdex_random_uuid(),
  sender_id uuid NOT NULL REFERENCES users(id),
  recipient_phone text,
  amount numeric(20, 2) NOT NULL CHECK (amount > 0),
  currency char(3) NOT NULL,
  token_hash text UNIQUE NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'claimed', 'expired', 'cancelled')),
  expires_at timestamptz NOT NULL,
  claimed_by uuid REFERENCES users(id),
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS claims_pending_expiry_idx ON claims (expires_at) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS template_deliveries (
  id uuid PRIMARY KEY DEFAULT chatdex_random_uuid(),
  template_key text NOT NULL,
  provider_template_name text,
  recipient_phone text NOT NULL,
  external_message_id text,
  status text NOT NULL,
  variables_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS template_deliveries_recipient_created_idx ON template_deliveries (recipient_phone, created_at DESC);
