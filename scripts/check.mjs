import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = resolve(__dirname, '..');
const cliPath = resolve(projectRoot, 'dist', 'cli.js');
const dataPath = resolve(projectRoot, 'examples', 'sample.csv');

const run = spawnSync(process.execPath, [cliPath, dataPath, '-c', 'price', '--header', '-p', '4'], {
  encoding: 'utf8'
});

if (run.error) {
  console.error('Failed to run CLI:', run.error);
  process.exit(1);
}

const out = run.stdout || '';
const err = run.stderr || '';

const expectations = [
  'Column: price',
  'Count: 4',
  'Average: 2.0625',
  'Max: 3.7500'
];

const ok = expectations.every((e) => out.includes(e));
if (!ok) {
  console.error('Output did not match expectations.\n--- STDOUT ---\n' + out + '\n--- STDERR ---\n' + err);
  process.exit(1);
}

console.log('Check passed.');

