/* global THREE */
(function () {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const dom = {
    file: $("#artifact-file"), stage: $("#stage"), tooltip: $("#tooltip"),
    sourceDot: $("#source-dot"), sourceLabel: $("#source-label"), stepNumber: $("#step-number"),
    gate: $("#gate-name"), summary: $("#step-summary"), graphPsig: $("#graph-psig"), logicalPsig: $("#logical-psig"),
    averageDecoherence: $("#average-decoherence"), criticality: $("#criticality-state"), topology: $("#topology-detail"),
    tsp: $("#tsp-detail"), selected: $("#selected-detail"), slider: $("#step-slider"), output: $("#step-output"),
    play: $("#play-button"), reset: $("#reset-button"), chart: $("#timeline-chart"),
    ttfBaselineFile: $("#ttf-baseline-file"), ttfRegularizedFile: $("#ttf-regularized-file"),
    showTtfBaseline: $("#show-ttf-baseline"), showTtfRegularized: $("#show-ttf-regularized"), ttfStatus: $("#ttf-comparison-status"),
  };
  const state = { artifact: null, stepIndex: 0, selectedId: null, playing: false, lastPlay: 0, nodeMeshes: [], edgeMeshes: [], tspMeshes: [], drag: null, ttfScenarios: { baseline: null, regularized: null } };
  const COLORS = { stable: 0x57d4bf, watch: 0xf5c96b, critical: 0xff6b6b, quantum: 0x69aaff, classical: 0x778692, route: 0xf2abff, selected: 0xffffff };

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x071017, 0);
  dom.stage.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
  const homeCamera = new THREE.Vector3(0, 0.8, 12);
  camera.position.copy(homeCamera);
  const target = new THREE.Vector3(0, 0, 0);
  scene.add(new THREE.AmbientLight(0xb9e1ea, 1.2));
  const light = new THREE.DirectionalLight(0x8ce8ff, 1.8); light.position.set(4, 7, 10); scene.add(light);
  const floor = new THREE.GridHelper(14, 14, 0x24414b, 0x172a32); floor.position.y = -3.8; floor.material.transparent = true; floor.material.opacity = 0.28; scene.add(floor);
  const content = new THREE.Group(); scene.add(content);
  const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();

  function numeric(value, digits = 3) { return value === null || value === undefined || !Number.isFinite(Number(value)) ? "—" : Number(value).toFixed(digits); }
  function clearGroup(group) { while (group.children.length) { const child = group.children.pop(); child.geometry?.dispose?.(); child.material?.dispose?.(); } }
  function criticalityThreshold() { return Number(state.artifact?.config?.criticality_threshold ?? 0.45); }
  function nodeColor(node) { if (node.criticality >= criticalityThreshold()) return COLORS.critical; if (node.local_decoherence >= 0.10) return COLORS.watch; return COLORS.stable; }
  function currentStep() { return state.artifact?.steps?.[state.stepIndex] || null; }
  function createTube(a, b, color, width, opacity, dashed) {
    const start = new THREE.Vector3(...a); const end = new THREE.Vector3(...b); const direction = end.clone().sub(start); const length = direction.length();
    if (length < 1e-8) return null;
    const geometry = new THREE.CylinderGeometry(width, width, 1, 10, 1, false);
    const material = new THREE.MeshBasicMaterial({ color, transparent: opacity < 0.999, opacity, depthWrite: opacity >= 0.999 });
    const mesh = new THREE.Mesh(geometry, material); mesh.position.copy(start.clone().add(end).multiplyScalar(.5)); mesh.scale.y = length;
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()); if (dashed) mesh.userData.route = true;
    return mesh;
  }
  function fitRenderer() { const width = dom.stage.clientWidth; const height = dom.stage.clientHeight; renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); }
  function render() { camera.lookAt(target); renderer.render(scene, camera); }
  function resetCamera() { camera.position.copy(homeCamera); target.set(0, 0, 0); render(); }

  function normalizeArtifact(input) {
    if (input?.schema === "ratiss.topological-decoherence.timeline.v1" && Array.isArray(input.steps)) return input;
    if (Array.isArray(input?.timeline)) {
      const n = input.n_qubits || 0;
      return {
        schema: "ratiss.topological-decoherence.timeline.v1/legacy-adapter",
        provenance: { mode: "legacy_import", simulation: "unspecified", validated_on_hardware: false },
        steps: input.timeline.map((record) => ({
          step: record.step,
          gate: record.op || "unknown",
          qubits: Array.from({ length: n }, (_, id) => ({
            id,
            position: [
              Math.cos(id * Math.PI * 2 / Math.max(n, 1)) * 2.8,
              Math.sin(id * Math.PI * 2 / Math.max(n, 1)) * 2.8,
              0,
            ],
            local_decoherence: 0,
            topology_support: 0,
            criticality: 0,
            degree: 0,
          })),
          edges: (input.graphs?.find((graph) => graph.step === record.step)?.edges || []).map(([source, target]) => ({ source, target, correlation: .5, type: "legacy_proxy", stability: .5 })),
          avg_psig: record.psig || 0,
          topology: { psig: record.psig || 0, betti: [0, 0, 0], distance_model: "legacy_artifact" },
          logical_topology: { P_sig: null, scope: "not_present_in_legacy_artifact" },
          tsp_inspection: { path: [], cost: 0, method: "not_exported" },
          cube_slice: [],
        })),
      };
    }
    throw new Error("Schéma non reconnu. Sélectionne un timeline.v1 ou l’ancien full_timeline RATISS.");
  }

  function setArtifact(raw, label) {
    state.artifact = normalizeArtifact(raw); state.stepIndex = 0; state.selectedId = null; state.playing = false;
    dom.sourceLabel.textContent = `${label} · ${state.artifact.steps.length} étapes`;
    dom.sourceDot.style.background = "#57d4bf"; dom.slider.max = Math.max(0, state.artifact.steps.length - 1); dom.slider.value = "0";
    [dom.slider, dom.play, dom.reset].forEach((element) => { element.disabled = false; }); dom.play.textContent = "Lire";
    drawStep();
  }

  function scenarioSummary(artifact) { const last = artifact.steps?.at(-1); if (!last) return null; const support = (last.qubits || []).reduce((sum, node) => sum + Number(node.topology_support || 0), 0); return { step: last.step, support, boundary: last.ttf_smooth_ablation?.boundary_nodes || [], psig: last.topology?.psig }; }
  function updateTtfControls() { const baseline = state.ttfScenarios.baseline; const regularized = state.ttfScenarios.regularized; dom.showTtfBaseline.disabled = !baseline; dom.showTtfRegularized.disabled = !regularized; if (!baseline && !regularized) { dom.ttfStatus.textContent = "En attente des deux timelines TTF calculées."; return; } const left = baseline ? scenarioSummary(baseline) : null; const right = regularized ? scenarioSummary(regularized) : null; dom.ttfStatus.textContent = `Référence : ${left ? `étape ${left.step}, support ${numeric(left.support)}, frontière [${left.boundary.join(", ")}]` : "non chargée"} · Régularisation : ${right ? `étape ${right.step}, support ${numeric(right.support)}, frontière [${right.boundary.join(", ")}]` : "non chargée"}. Comparaison logicielle de graphes uniquement.`; }
  function loadTtfScenario(kind, file) { if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const artifact = normalizeArtifact(JSON.parse(reader.result)); const expected = kind === "baseline" ? "ttf_smooth_baseline" : "ttf_smooth_correlation_regularization"; if (artifact.provenance?.mode !== expected) throw new Error(`La provenance attendue est ${expected}.`); state.ttfScenarios[kind] = artifact; updateTtfControls(); } catch (error) { dom.ttfStatus.textContent = `Impossible de charger ce scénario : ${error.message}`; } }; reader.readAsText(file); }

  function drawStep() {
    const step = currentStep(); if (!step) return;
    clearGroup(content); state.nodeMeshes = []; state.edgeMeshes = []; state.tspMeshes = [];
    const positionById = new Map(step.qubits.map((node) => [node.id, node.position]));
    (step.edges || []).forEach((edge) => {
      const tube = createTube(positionById.get(edge.source), positionById.get(edge.target), edge.type === "quantum_candidate" ? COLORS.quantum : COLORS.classical, .018 + .095 * (edge.correlation || 0), .22 + .78 * (edge.stability ?? 1), false);
      if (tube) { tube.userData.edge = edge; content.add(tube); state.edgeMeshes.push(tube); }
    });
    const route = step.tsp_inspection?.path || [];
    for (let index = 0; index + 1 < route.length; index += 1) { const line = createTube(positionById.get(route[index]), positionById.get(route[index + 1]), COLORS.route, .032, .92, true); if (line) { content.add(line); state.tspMeshes.push(line); } }
    step.qubits.forEach((node) => {
      const scale = .30 + .45 * Math.min(1, node.topology_support ?? node.psig ?? 0) + .065 * (node.degree || 0);
      const isCritical = node.criticality >= criticalityThreshold();
      const geometry = new THREE.SphereGeometry(scale, 26, 18); const material = new THREE.MeshStandardMaterial({ color: nodeColor(node), emissive: isCritical ? COLORS.critical : 0x000000, emissiveIntensity: isCritical ? .36 : 0, roughness: .34, metalness: .16 });
      const mesh = new THREE.Mesh(geometry, material); mesh.position.set(...node.position); mesh.userData.node = node;
      if (state.selectedId === node.id) { const halo = new THREE.Mesh(new THREE.SphereGeometry(scale * 1.22, 22, 14), new THREE.MeshBasicMaterial({ color: COLORS.selected, wireframe: true, transparent: true, opacity: .8 })); mesh.add(halo); }
      content.add(mesh); state.nodeMeshes.push(mesh);
    });
    dom.stepNumber.textContent = String(step.step); dom.gate.textContent = step.gate || "Étape sans porte"; dom.output.textContent = `${step.step} / ${state.artifact.steps.length - 1}`;
    const externalAssociation = step.metric_scope?.density_metrics_available === false;
    dom.graphPsig.textContent = numeric(step.topology?.psig ?? step.avg_psig); dom.logicalPsig.textContent = numeric(step.logical_topology?.P_sig); const avgDec = externalAssociation ? null : (step.qubits.length ? step.qubits.reduce((sum, node) => sum + (node.local_decoherence || 0), 0) / step.qubits.length : 0);
    const threshold = criticalityThreshold(); dom.averageDecoherence.textContent = numeric(avgDec); const critical = step.qubits.filter((node) => node.criticality >= threshold); dom.criticality.textContent = critical.length ? `${critical.length} nœud(s)` : "Aucun"; dom.criticality.style.color = critical.length ? "var(--red)" : "var(--teal)";
    dom.summary.textContent = externalAssociation ? "Association importée : la criticité et la route TSP sont structurelles. Aucune fidélité, pureté, décohérence quantique ou entanglement n’est inféré." : (step.decoherence_detected ? "Des zones critiques sont calculées à cette étape ; la route TSP ne sert qu’à leur inspection." : "Aucune zone critique selon le seuil exporté. Les tubes affichent uniquement les liens présents dans le JSON.");
    dom.topology.classList.remove("empty"); dom.topology.innerHTML = `<div><b>Betti</b> : [${(step.topology?.betti || []).join(", ")}]</div><div><b>Cycles H1 finis</b> : ${step.topology?.n_finite_h1 ?? "—"}</div><div><b>Distance</b> : ${step.topology?.distance_model || "—"}</div><div><b>Noyau logique</b> : ${step.logical_topology?.scope || "non exporté"}</div>`;
    const tsp = step.tsp_inspection || {}; dom.tsp.classList.toggle("empty", !tsp.path?.length); dom.tsp.innerHTML = tsp.path?.length ? `<div><b>Méthode</b> : ${tsp.method}</div><div><b>Chemin</b> : ${tsp.path.join(" → ")}</div><div><b>Coût</b> : ${numeric(tsp.cost)}</div>` : "Aucun ensemble critique n’a déclenché de route à cette étape.";
    updateSelected(); drawChart(); render();
  }
  function updateSelected() { const step = currentStep(); const node = step?.qubits.find((item) => item.id === state.selectedId); if (!node) { dom.selected.className = "detail-list empty"; dom.selected.textContent = "Clique un nœud dans la scène pour suivre sa signature."; return; } const externalAssociation = step.metric_scope?.density_metrics_available === false; dom.selected.className = "detail-list"; dom.selected.innerHTML = `<div><b>Nœud ${node.id}</b> · degré ${node.degree}</div><div>${externalAssociation ? "Fidélité : non applicable" : `Fidélité simulée : ${numeric(node.fidelity_to_ideal)}`}</div><div>${externalAssociation ? "Métrique : association importée" : `Décohérence locale : ${numeric(node.local_decoherence)}`}</div><div>Support topologique : ${numeric(node.topology_support ?? node.psig)}</div><div>Criticité : ${numeric(node.criticality)}</div>`; }
  function drawChart() { const context = dom.chart.getContext("2d"); const { width, height } = dom.chart; context.clearRect(0, 0, width, height); context.fillStyle = "#071017"; context.fillRect(0, 0, width, height); if (!state.artifact) return; const values = state.artifact.steps.map((step) => Number(step.topology?.psig ?? step.avg_psig ?? 0)); const logical = state.artifact.steps.map((step) => Number(step.logical_topology?.P_sig ?? 0)); const max = Math.max(.1, ...values, ...logical); const pad = { x: 54, y: 26 }; context.strokeStyle = "rgba(187,215,229,.12)"; context.lineWidth = 1; for (let row = 0; row < 4; row += 1) { const y = pad.y + (height - pad.y * 2) * row / 3; context.beginPath(); context.moveTo(pad.x, y); context.lineTo(width - pad.x / 2, y); context.stroke(); }
    const plot = (series, color) => { context.strokeStyle = color; context.lineWidth = 3; context.beginPath(); series.forEach((value, index) => { const x = pad.x + (width - pad.x * 1.5) * index / Math.max(1, series.length - 1); const y = height - pad.y - (height - pad.y * 2) * value / max; index ? context.lineTo(x, y) : context.moveTo(x, y); }); context.stroke(); };
    plot(values, "#69aaff"); if (logical.some((value) => value > 0)) plot(logical, "#57d4bf"); const x = pad.x + (width - pad.x * 1.5) * state.stepIndex / Math.max(1, values.length - 1); context.strokeStyle = "#f5c96b"; context.beginPath(); context.moveTo(x, pad.y); context.lineTo(x, height - pad.y); context.stroke(); context.font = "18px system-ui"; context.fillStyle = "#91a7b5"; context.fillText("P_sig graphe", pad.x, 19); context.fillStyle = "#57d4bf"; context.fillText("P_sig logique RATISS", pad.x + 150, 19); }
  function setStep(index) { state.stepIndex = Math.max(0, Math.min(state.artifact.steps.length - 1, Number(index))); dom.slider.value = String(state.stepIndex); drawStep(); }
  function hover(event, click) { const rect = renderer.domElement.getBoundingClientRect(); pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1; pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1; raycaster.setFromCamera(pointer, camera); const intersects = raycaster.intersectObjects(state.nodeMeshes, false); const hit = intersects[0]?.object?.userData?.node; if (click && hit) { state.selectedId = hit.id; drawStep(); return; } if (!hit) { dom.tooltip.hidden = true; return; } const externalAssociation = currentStep()?.metric_scope?.density_metrics_available === false; dom.tooltip.hidden = false; dom.tooltip.style.left = `${event.clientX + 14}px`; dom.tooltip.style.top = `${event.clientY + 14}px`; dom.tooltip.innerHTML = `<b>Nœud ${hit.id}</b><br>P<sub>sig</sub> support : ${numeric(hit.topology_support ?? hit.psig)}<br>${externalAssociation ? "Association importée" : `Décohérence : ${numeric(hit.local_decoherence)}`}<br>Criticité : ${numeric(hit.criticality)}`; }
  function rotateCamera(dx, dy) { const vector = camera.position.clone().sub(target); const spherical = new THREE.Spherical().setFromVector3(vector); spherical.theta -= dx * .008; spherical.phi = Math.max(.14, Math.min(Math.PI - .14, spherical.phi - dy * .008)); camera.position.copy(target).add(new THREE.Vector3().setFromSpherical(spherical)); render(); }
  renderer.domElement.addEventListener("pointerdown", (event) => { state.drag = { x: event.clientX, y: event.clientY, moved: false }; renderer.domElement.setPointerCapture(event.pointerId); }); renderer.domElement.addEventListener("pointermove", (event) => { if (state.drag) { const dx = event.clientX - state.drag.x; const dy = event.clientY - state.drag.y; if (Math.abs(dx) + Math.abs(dy) > 3) state.drag.moved = true; rotateCamera(dx, dy); state.drag.x = event.clientX; state.drag.y = event.clientY; } else hover(event, false); }); renderer.domElement.addEventListener("pointerup", (event) => { if (!state.drag?.moved) hover(event, true); state.drag = null; }); renderer.domElement.addEventListener("pointerleave", () => { if (!state.drag) dom.tooltip.hidden = true; }); renderer.domElement.addEventListener("wheel", (event) => { event.preventDefault(); const factor = event.deltaY > 0 ? 1.09 : .91; camera.position.sub(target).multiplyScalar(factor).add(target); camera.position.distanceTo(target); render(); }, { passive: false });
  dom.file.addEventListener("click", () => { dom.file.value = ""; }); dom.file.addEventListener("change", (event) => { const [file] = event.target.files; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { setArtifact(JSON.parse(reader.result), file.name); } catch (error) { alert(`Impossible de lire cet artefact : ${error.message}`); } }; reader.readAsText(file); }); dom.ttfBaselineFile.addEventListener("click", () => { dom.ttfBaselineFile.value = ""; }); dom.ttfRegularizedFile.addEventListener("click", () => { dom.ttfRegularizedFile.value = ""; }); dom.ttfBaselineFile.addEventListener("change", (event) => loadTtfScenario("baseline", event.target.files[0])); dom.ttfRegularizedFile.addEventListener("change", (event) => loadTtfScenario("regularized", event.target.files[0])); dom.showTtfBaseline.addEventListener("click", () => { const artifact = state.ttfScenarios.baseline; if (artifact) setArtifact(artifact, "TTF · référence"); }); dom.showTtfRegularized.addEventListener("click", () => { const artifact = state.ttfScenarios.regularized; if (artifact) setArtifact(artifact, "TTF · régularisation"); }); dom.slider.addEventListener("input", () => setStep(dom.slider.value)); dom.reset.addEventListener("click", resetCamera); dom.play.addEventListener("click", () => { state.playing = !state.playing; dom.play.textContent = state.playing ? "Pause" : "Lire"; });
  window.RatissAtlas = { loadArtifact: setArtifact, getArtifact: () => state.artifact };
  function animate(timestamp) { requestAnimationFrame(animate); if (state.playing && state.artifact && timestamp - state.lastPlay > 1000) { state.lastPlay = timestamp; setStep((state.stepIndex + 1) % state.artifact.steps.length); } render(); } window.addEventListener("resize", () => { fitRenderer(); render(); }); fitRenderer(); render(); requestAnimationFrame(animate);
}());
