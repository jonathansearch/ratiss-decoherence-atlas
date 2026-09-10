# Catalogue des démonstrations WebGL — Studio Personnel

Le Studio Personnel est distribué avec deux pages WebGL autonomes, conçues pour ouvrir directement par `file://`. Elles reçoivent des snapshots JavaScript générés depuis les artefacts JSON versionnés du dépôt. Leur rôle est de rendre visible le fonctionnement sans serveur, pas de recalculer ou modifier les données.

| Démonstration | Fichier | Source de données | Interaction |
|---|---|---|---|
| Replay de trajectoire topologique | [`demos/trajectory-replay.html`](../demos/trajectory-replay.html) | `data/full_timeline.json` | Timeline, rotation, zoom, route TSP exportée |
| Comparaison d’ablation TTF | [`demos/ttf-ablation.html`](../demos/ttf-ablation.html) | `data/ttf/timeline_baseline.json` et `timeline_regularized.json` | Basculer référence/régularisation, timeline, rotation et zoom |

Les deux pages ont été ouvertes directement depuis le système de fichiers. Le replay de trajectoire a rendu l’artefact `internal_studio_import`, sa route `0 → 1 → 0` et ses métriques exportées. La comparaison TTF a rendu les deux snapshots séparés, la frontière de variation et les contrôles de bascule.

> Les snapshots sont générés par `node scripts/build_demo_snapshots.mjs`. Ils sont versionnés pour l’ouverture hors ligne et doivent être régénérés après tout changement des artefacts source.

Ces pages ne soumettent aucun circuit, ne simulent pas une matrice densité dans le navigateur et ne déclarent aucune validation de matériel.

## Médias visibles dans le README

Les aperçus animés suivent le rendu réel sous `file://`. Ils rendent la démonstration visible directement dans le README GitHub, où l’exécution de JavaScript local ne peut pas être embarquée. Les vidéos WebM conservent les mêmes captures de session hors ligne.

| Démonstration | Aperçu Markdown | Vidéo versionnée | États réellement capturés |
|---|---|---|---|
| Trajectoire | [`personal-trajectory-webgl-preview.gif`](media/personal-trajectory-webgl-preview.gif) | [`personal-trajectory-webgl.webm`](media/personal-trajectory-webgl.webm) | Étapes `1 / 3` et `3 / 3` de `internal_studio_import` |
| Ablation TTF | [`personal-ttf-webgl-preview.gif`](media/personal-ttf-webgl-preview.gif) | [`personal-ttf-webgl.webm`](media/personal-ttf-webgl.webm) | `ttf_smooth_baseline`, puis `ttf_smooth_correlation_regularization` |

La capture de l’espace de travail complet est conservée dans [`media/personal-studio-workspace.webp`](media/personal-studio-workspace.webp). Les contrôles `file://` et les limites de représentation sont consignés dans [`DEMO_VISUAL_AUDIT.md`](DEMO_VISUAL_AUDIT.md).
