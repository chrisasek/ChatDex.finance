-- Hosting-portable UUID generation for identifiers. Security-sensitive handoff
-- tokens are generated in the application with Node.js cryptography.
CREATE OR REPLACE FUNCTION chatdex_random_uuid()
RETURNS uuid
LANGUAGE sql
VOLATILE
AS $$
  SELECT (
    substr(value, 1, 8) || '-' ||
    substr(value, 9, 4) || '-4' ||
    substr(value, 14, 3) || '-a' ||
    substr(value, 18, 3) || '-' ||
    substr(value, 21, 12)
  )::uuid
  FROM (SELECT md5(random()::text || clock_timestamp()::text) AS value) AS generated;
$$;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT chatdex_random_uuid(),
  phone text UNIQUE NOT NULL,
  name text,
  country_code text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS instruments (
  id uuid PRIMARY KEY DEFAULT chatdex_random_uuid(),
  symbol text UNIQUE NOT NULL,
  name text NOT NULL,
  asset_type text NOT NULL,
  currency char(3) NOT NULL,
  provider_symbol text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS intents (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  type text NOT NULL,
  source text NOT NULL,
  status text NOT NULL,
  payload_json jsonb NOT NULL,
  context_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS external_messages (
  id uuid PRIMARY KEY DEFAULT chatdex_random_uuid(),
  provider text NOT NULL,
  external_message_id text NOT NULL,
  user_id uuid REFERENCES users(id),
  sender_phone text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status text NOT NULL,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, external_message_id)
);

CREATE INDEX IF NOT EXISTS external_messages_sender_created_idx ON external_messages (sender_phone, created_at DESC);
