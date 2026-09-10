import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const load = relative => readFile(resolve(root, relative), 'utf8').then(JSON.parse);
const [trajectory, baseline, regularized] = await Promise.all([
  load('data/full_timeline.json'),
  load('data/ttf/timeline_baseline.json'),
  load('data/ttf/timeline_regularized.json'),
]);
const payload = {
  trajectory: { provenance: trajectory.provenance, steps: trajectory.steps },
  ttf: {
    baseline: { provenance: baseline.provenance, steps: baseline.steps },
    regularized: { provenance: regularized.provenance, steps: regularized.steps },
  },
};
const target = resolve(root, 'demos/demo-snapshots.js');
await mkdir(dirname(target), { recursive: true });
await writeFile(target, `/* Generated from versioned RATISS artifacts. Do not hand-edit. */\nwindow.RATISS_DEMO_SNAPSHOTS = ${JSON.stringify(payload)};\n`);
