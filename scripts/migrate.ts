import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createPool } from '@chatdex/database';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required');

const pool = createPool(databaseUrl);
const directory = resolve('packages/database/migrations');

try {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (filename text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
  for (const filename of (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort()) {
    const alreadyApplied = await pool.query('SELECT 1 FROM schema_migrations WHERE filename = $1', [filename]);
    if (alreadyApplied.rowCount) continue;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(await readFile(resolve(directory, filename), 'utf8'));
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
      await client.query('COMMIT');
      console.log(`Applied ${filename}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
} finally {
  await pool.end();
}
