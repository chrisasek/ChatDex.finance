import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createPool } from '@chatdex/database';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required');
const pool = createPool(databaseUrl);

try {
  const directory = resolve('packages/database/seed');
  for (const filename of (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort()) {
    await pool.query(await readFile(resolve(directory, filename), 'utf8'));
    console.log(`Seeded ${filename}`);
  }
} finally {
  await pool.end();
}
