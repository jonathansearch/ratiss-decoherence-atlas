/*
 * Classic-script bridge derived from Quantum Circuit Studio `src/model.mjs`.
 * It exists beside the unmodified traceable module `studio-model.mjs` because
 * browsers may block ES-module imports from file:// origins. No network is
 * required at runtime.
 */
(function () {
  const components = {
    qubit: { frequency: 5.0, note: "Fixed-frequency superconducting qubit" },
    coupler: { frequency: 5.45, note: "Flux-controlled coupling element" },
    resonator: { frequency: 6.7, note: "Quarter-wave readout structure" },
    feedline: { frequency: 7.0, note: "50 Ω microwave feedline" },
    flux: { frequency: 0, note: "Low-frequency control infrastructure" }
  };
  const layers = { metal: { z: 0 }, josephson: { z: 16 }, resonator: { z: 32 }, control: { z: 48 } };
  const linksFor = (circuit, id) => circuit.edges.flatMap(([a, b]) => a === id ? [b] : b === id ? [a] : []);
  function createDemoCircuit() {
    return { schema: "quantum-circuit-studio/v0.1", name: "transmon-microcell", nodes: [
      { id: "q0", kind: "qubit", frequency: 4.96, unit: "GHz", x: 28, y: 48, notes: "Reference qubit" },
      { id: "q1", kind: "qubit", frequency: 5.18, unit: "GHz", x: 68, y: 48, notes: "Detuned neighbour" },
      { id: "c0", kind: "coupler", frequency: 5.45, unit: "GHz", x: 48, y: 48, notes: "Tunable interaction path" },
      { id: "r0", kind: "resonator", frequency: 6.63, unit: "GHz", x: 28, y: 76, notes: "Readout for q0" },
      { id: "r1", kind: "resonator", frequency: 6.81, unit: "GHz", x: 68, y: 76, notes: "Readout for q1" },
      { id: "fl0", kind: "feedline", frequency: 7.0, unit: "GHz", x: 48, y: 84, notes: "Shared readout path" }
    ], edges: [["q0", "c0"], ["q1", "c0"], ["q0", "r0"], ["q1", "r1"], ["r0", "fl0"], ["r1", "fl0"]] };
  }
  function addNode(circuit, kind) {
    const component = components[kind]; if (!component) throw new Error(`Unsupported component kind: ${kind}`);
    const prefix = { qubit: "q", coupler: "c", resonator: "r", feedline: "fl", flux: "phi" }[kind]; let index = 0;
    while (circuit.nodes.some((node) => node.id === `${prefix}${index}`)) index += 1;
    const position = circuit.nodes.length;
    return { ...circuit, nodes: [...circuit.nodes, { id: `${prefix}${index}`, kind, frequency: component.frequency, unit: "GHz", x: 22 + ((position * 19) % 60), y: 26 + ((Math.floor(position / 3) * 24) % 54), notes: component.note }] };
  }
  function layerStackGraph(circuit) {
    const nodes = []; const links = []; const primary = new Map();
    const add = (source, layer, suffix) => { const id = `${source.id}:${suffix}`; nodes.push({ ...source, id, sourceId: source.id, layer, z: layers[layer].z }); return id; };
    circuit.nodes.forEach((node) => { if (node.kind === "qubit" || node.kind === "coupler") { const metal = add(node, "metal", "metal"); const junction = add(node, "josephson", "jj"); links.push({ source: metal, target: junction, type: "vertical" }); primary.set(node.id, junction); } else { const layer = node.kind === "resonator" ? "resonator" : "control"; primary.set(node.id, add(node, layer, layer)); } });
    circuit.edges.forEach(([source, target]) => { if (primary.has(source) && primary.has(target)) links.push({ source: primary.get(source), target: primary.get(target), type: "circuit" }); }); return { nodes, links };
  }
  function frequencyHeatmap(circuit, collision = .08, watch = .2) {
    const qubits = circuit.nodes.filter((node) => node.kind === "qubit" && Number.isFinite(Number(node.frequency)));
    return qubits.map((qubit) => { const nearest = qubits.filter((candidate) => candidate.id !== qubit.id).map((candidate) => ({ id: candidate.id, separation: Math.abs(Number(qubit.frequency) - Number(candidate.frequency)) })).sort((a, b) => a.separation - b.separation)[0]; const separation = nearest?.separation ?? Infinity; return { id: qubit.id, frequency: Number(qubit.frequency), unit: qubit.unit, nearestId: nearest?.id ?? null, separation, risk: separation < collision ? "collision" : separation < watch ? "watch" : "stable" }; });
  }
  function optimizeCircuit(circuit, { targetFrequencySeparationGHz = .25 } = {}) {
    const nodes = circuit.nodes.map((node) => ({ ...node })); const byId = new Map(nodes.map((node) => [node.id, node])); const placementChanges = []; const frequencyChanges = [];
    const move = (id, x, y) => { const node = byId.get(id); if (!node) return; const next = { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }; if (node.x !== next.x || node.y !== next.y) placementChanges.push({ id, from: { x: node.x, y: node.y }, to: next }); Object.assign(node, next); };
    const qubits = nodes.filter((node) => node.kind === "qubit"); const columns = Math.max(1, Math.ceil(Math.sqrt(qubits.length))); qubits.forEach((qubit, index) => move(qubit.id, columns === 1 ? 50 : 24 + (index % columns) * (52 / (columns - 1)), 32 + Math.floor(index / columns) * 28));
    nodes.filter((node) => node.kind === "coupler").forEach((coupler) => { const attached = linksFor(circuit, coupler.id).map((id) => byId.get(id)).filter((node) => node?.kind === "qubit"); if (attached.length >= 2) move(coupler.id, (attached[0].x + attached[1].x) / 2, (attached[0].y + attached[1].y) / 2); });
    const ordered = [...qubits].sort((a, b) => Number(a.frequency) - Number(b.frequency)); ordered.forEach((qubit, index) => { if (!index) return; const previous = ordered[index - 1]; const required = Number(previous.frequency) + targetFrequencySeparationGHz; if (Number(qubit.frequency) < required) { const from = Number(qubit.frequency); qubit.frequency = Math.round(required * 1000) / 1000; frequencyChanges.push({ id: qubit.id, from, to: qubit.frequency, minimumSeparationGHz: targetFrequencySeparationGHz }); } });
    return { circuit: { ...circuit, nodes }, placementChanges, frequencyChanges, targetFrequencySeparationGHz, assumptions: ["Placement is a local spacing heuristic, not an EM or crosstalk solver.", "Frequency targets require hardware calibration before use."] };
  }
  function crosstalkRiskAnalysis(circuit) {
    const qubits = circuit.nodes.filter((node) => node.kind === "qubit" && Number.isFinite(Number(node.frequency))); const couplers = circuit.nodes.filter((node) => node.kind === "coupler"); const direct = (a, b) => circuit.edges.some(([x, y]) => x === a && y === b || x === b && y === a); const clamp = (value) => Math.max(0, Math.min(1, value)); const pairs = [];
    for (let i = 0; i < qubits.length; i += 1) for (let j = i + 1; j < qubits.length; j += 1) { const a = qubits[i]; const b = qubits[j]; const couplingPaths = couplers.filter((coupler) => { const list = linksFor(circuit, coupler.id); return list.includes(a.id) && list.includes(b.id); }).map((coupler) => coupler.id); const distance = Math.hypot(Number(a.x) - Number(b.x), Number(a.y) - Number(b.y)); const detuning = Math.abs(Number(a.frequency) - Number(b.frequency)); const score = Math.round((.5 * (couplingPaths.length ? .9 : direct(a.id, b.id) ? .7 : .15) + .32 * clamp((.5 - detuning) / .5) + .18 * clamp((60 - distance) / 60)) * 100); pairs.push({ first: a.id, second: b.id, couplingPaths, distance, detuning, score, level: score >= 70 ? "high" : score >= 45 ? "medium" : "low" }); }
    return pairs.sort((a, b) => b.score - a.score);
  }
  const exportCircuit = (circuit) => JSON.stringify({ ...circuit, exportedAt: new Date().toISOString() }, null, 2);
  window.QuantumStudioModel = { addNode, createDemoCircuit, crosstalkRiskAnalysis, exportCircuit, frequencyHeatmap, layerStackGraph, optimizeCircuit };
}());
