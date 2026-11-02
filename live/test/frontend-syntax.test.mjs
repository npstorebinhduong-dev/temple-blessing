import { test } from 'node:test';
import { readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('every browser module parses before the LIVE bundle is shipped', () => {
  const directory = new URL('..', import.meta.url);
  for (const file of readdirSync(directory).filter(name => name.endsWith('.js'))) {
    execFileSync(process.execPath, ['--check', fileURLToPath(new URL(file, directory))], { stdio: 'pipe' });
  }
});
