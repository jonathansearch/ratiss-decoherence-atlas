import assert from 'node:assert/strict';
import { createDemoCircuit, crosstalkRiskAnalysis, exportCircuit, frequencyHeatmap, layerStackGraph } from '../studio-model.mjs';

const circuit = createDemoCircuit();
assert.equal(circuit.schema, 'quantum-circuit-studio/v0.1');
assert.equal(JSON.parse(exportCircuit(circuit)).nodes.length, 6);
assert.equal(layerStackGraph(circuit).nodes.length, 9);
assert.equal(frequencyHeatmap(circuit).length, 2);
assert.equal(crosstalkRiskAnalysis(circuit)[0].first, 'q0');
console.log('Personal Studio model verified.');
