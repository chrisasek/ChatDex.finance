INSERT INTO instruments (symbol, name, asset_type, currency, provider_symbol, metadata_json)
VALUES ('NVDA', 'NVIDIA', 'stock', 'USD', 'NVDA', '{"demo":true}'::jsonb)
ON CONFLICT (symbol) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

INSERT INTO users (id, phone, name, country_code, status)
VALUES ('00000000-0000-4000-8000-000000000001', '+2348000000000', 'Demo User', 'NG', 'active')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  country_code = EXCLUDED.country_code,
  status = 'active',
  updated_at = now();

INSERT INTO users (id, phone, name, country_code, status)
VALUES ('00000000-0000-4000-8000-000000000002', '+2348000000001', 'Demo Recipient', 'NG', 'active')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  country_code = EXCLUDED.country_code,
  status = 'active',
  updated_at = now();
