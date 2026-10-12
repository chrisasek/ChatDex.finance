import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'packages/database/migrations/0001_foundation.sql',
  'packages/database/migrations/0002_whatsapp_flow_sessions.sql',
  'packages/database/migrations/0003_trade_handoffs.sql',
  'packages/database/migrations/0004_paper_execution.sql',
  'packages/database/migrations/0005_claims_templates.sql',
  'packages/database/migrations/0006_template_delivery_idempotency.sql',
  'packages/database/seed/0001_demo.sql',
];

const sections = [];
for (const file of files) {
  const sql = await readFile(path.join(root, file), 'utf8');
  sections.push(`-- ${file}\n${sql.trim()}\n`);
}

const output = [
  '-- ChatDex PostgreSQL schema and deterministic demo seed',
  '-- Generated from versioned repository migrations. Safe to rerun.',
  'BEGIN;',
  ...sections,
  'COMMIT;',
  '',
].join('\n\n');

const destination = path.join(root, 'dist', 'chatdex-postgres.sql');
await mkdir(path.dirname(destination), { recursive: true });
await writeFile(destination, output, 'utf8');
console.log(`Database import created at ${destination}`);
