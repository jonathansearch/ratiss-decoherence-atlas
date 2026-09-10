# Index des preuves et replays hors ligne

Le Studio Personnel ne calcule pas une nouvelle simulation. Ses preuves sont donc des **contrôles de fidélité de lecture** : il doit lire un contrat, conserver sa provenance, afficher les métriques présentes et laisser les métriques absentes vides.

| Sujet | Fichier | Vérification | Frontière |
|---|---|---|---|
| Contrat de timeline | `app.js` | `tests/verify-artifact.mjs` | Les valeurs proviennent du JSON chargé |
| Modèle de conception local | `studio-model.js`, `personal-studio.js` | `tests/verify-studio-model.mjs` | Overlay de conception, non solveur EM |
| Trois imports externes | `data/external/` | `tests/verify-external-artifacts.mjs` | Aucun QPU, dispositif photonique ou jeu bio réel revendiqué |
| Démo trajectoire | `demos/trajectory-replay.html` | Ouverture `file://` consignée dans `DEMO_CATALOG.md` | Snapshot de timeline, pas de recalcul |
| Démo TTF | `demos/ttf-ablation.html` | Ouverture `file://` consignée dans `DEMO_CATALOG.md` | Comparaison de graphes, pas correction matérielle |
| Captures de preuve | `docs/assets/` | Images générées depuis les pages WebGL réelles | Illustrations de l’interface, pas données supplémentaires |

## Régénération contrôlée

Les pages du dossier `demos/` lisent `demos/demo-snapshots.js`. Ce fichier est produit par `scripts/build_demo_snapshots.mjs` à partir des JSON versionnés dans `data/`. Après une modification de ces JSON, régénérez le snapshot et exécutez `pnpm test` avant de committer les deux changements ensemble.
