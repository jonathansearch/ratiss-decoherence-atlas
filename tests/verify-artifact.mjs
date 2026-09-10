import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const artifact = JSON.parse(await readFile(new URL('../data/full_timeline.json', import.meta.url), 'utf8'));
assert.equal(artifact.schema, 'ratiss.topological-decoherence.timeline.v1');
assert.ok(['local', 'internal_studio_import', 'external_qiskit_statevector'].includes(artifact.provenance.mode));
assert.equal(artifact.provenance.validated_on_hardware, false);
assert.ok(Array.isArray(artifact.steps) && artifact.steps.length > 1);
assert.ok(artifact.steps.every((step) => Array.isArray(step.qubits) && Array.isArray(step.edges) && Array.isArray(step.cube_slice)));
assert.ok(artifact.steps.every((step) => typeof step.topology?.psig === 'number'));
assert.ok(artifact.steps.every((step) => step.logical_topology?.scope === 'algorithmic_topological_logical_qubit_simulation'));
console.log(`Atlas artifact validated: ${artifact.steps.length} timeline steps.`);
