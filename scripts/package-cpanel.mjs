import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const webRoot = path.join(root, 'apps', 'web');
const standalone = path.join(webRoot, '.next', 'standalone');
const destination = path.join(root, 'dist', 'cpanel');

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(path.join(standalone, 'apps', 'web', 'server.js')))) {
  throw new Error('Standalone server missing. Run the Next.js build before packaging.');
}

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(standalone, destination, { recursive: true, dereference: true });

const staticSource = path.join(webRoot, '.next', 'static');
const staticDestination = path.join(destination, 'apps', 'web', '.next', 'static');
await mkdir(path.dirname(staticDestination), { recursive: true });
await cp(staticSource, staticDestination, { recursive: true });

const publicSource = path.join(webRoot, 'public');
if (await exists(publicSource)) {
  await cp(publicSource, path.join(destination, 'apps', 'web', 'public'), { recursive: true });
}

const appEntry = `process.env.HOSTNAME ||= '0.0.0.0';\nrequire('./apps/web/server.js');\n`;
await writeFile(path.join(destination, 'app.js'), appEntry, 'utf8');

const manifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
await writeFile(
  path.join(destination, 'package.json'),
  `${JSON.stringify({
    name: 'chatdex-cpanel-runtime',
    version: manifest.version,
    private: true,
    scripts: { start: 'node app.js' },
    engines: { node: '>=22' },
  }, null, 2)}\n`,
  'utf8',
);
await writeFile(
  path.join(destination, 'DEPLOYMENT.json'),
  `${JSON.stringify({ name: manifest.name, version: manifest.version, builtAt: new Date().toISOString() }, null, 2)}\n`,
  'utf8',
);

console.log(`cPanel artifact created at ${destination}`);
