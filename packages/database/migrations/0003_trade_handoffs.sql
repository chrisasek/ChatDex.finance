CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT chatdex_random_uuid(),
  user_id uuid REFERENCES users(id),
  instrument_id uuid NOT NULL REFERENCES instruments(id),
  side text NOT NULL CHECK (side IN ('buy', 'sell')),
  order_type text NOT NULL,
  amount numeric(20, 2) NOT NULL CHECK (amount > 0),
  quantity numeric(28, 8) NOT NULL CHECK (quantity > 0),
  quoted_price numeric(20, 8) NOT NULL CHECK (quoted_price > 0),
  status text NOT NULL,
  execution_mode text NOT NULL CHECK (execution_mode IN ('paper', 'live')),
  provider text NOT NULL,
  intent_id uuid NOT NULL REFERENCES intents(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS action_handoffs (
  id uuid PRIMARY KEY DEFAULT chatdex_random_uuid(),
  token_hash text UNIQUE NOT NULL,
  user_id uuid REFERENCES users(id),
  phone text,
  intent_id uuid NOT NULL REFERENCES intents(id),
  order_id uuid NOT NULL REFERENCES orders(id),
  preview_json jsonb NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'used', 'expired', 'cancelled')),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS action_handoffs_pending_expiry_idx
  ON action_handoffs (expires_at)
  WHERE status = 'pending';
