import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fixtures = [
  ['../data/external/qiskit_counts_timeline.json', 'external_qiskit_counts', 'classical_count_cooccurrence_association'],
  ['../data/external/photonic_modes_timeline.json', 'external_photonic_modes', 'mode_cooccupation_association'],
  ['../data/external/bio_correlation_timeline.json', 'external_bio_correlation', 'declared_bio_correlation']
];

for (const [path, provenance, metric] of fixtures) {
  const artifact = JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
  assert.equal(artifact.schema, 'ratiss.topological-decoherence.timeline.v1');
  assert.equal(artifact.provenance.mode, provenance);
  assert.equal(artifact.cube.metric, metric);
  assert.equal(artifact.provenance.validated_on_hardware, false);
  assert.ok(artifact.steps.length > 0);
  assert.equal(artifact.steps.at(-1).metric_scope.density_metrics_available, false);
}
console.log(`External fixtures validated: ${fixtures.length}.`);
