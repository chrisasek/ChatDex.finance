CREATE TABLE IF NOT EXISTS executions (
  id uuid PRIMARY KEY DEFAULT chatdex_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  provider text NOT NULL,
  external_id text UNIQUE NOT NULL,
  price numeric(20, 8) NOT NULL,
  quantity numeric(28, 8) NOT NULL,
  fee numeric(20, 8) NOT NULL DEFAULT 0,
  status text NOT NULL,
  executed_at timestamptz NOT NULL,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT chatdex_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  instrument_id uuid NOT NULL REFERENCES instruments(id),
  quantity numeric(28, 8) NOT NULL DEFAULT 0,
  avg_entry numeric(20, 8) NOT NULL DEFAULT 0,
  current_price numeric(20, 8) NOT NULL DEFAULT 0,
  realized_pnl numeric(20, 8) NOT NULL DEFAULT 0,
  unrealized_pnl numeric(20, 8) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, instrument_id)
);

CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY DEFAULT chatdex_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  order_id uuid UNIQUE NOT NULL REFERENCES orders(id),
  type text NOT NULL,
  reference text UNIQUE NOT NULL,
  status text NOT NULL,
  payload_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
