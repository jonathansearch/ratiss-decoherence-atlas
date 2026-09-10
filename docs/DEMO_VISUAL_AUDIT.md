# Vérification visuelle — Studio Personnel

La démonstration `demos/trajectory-replay.html` a été ouverte directement sous `file://` le 22 août 2026. Le rendu confirme que le modèle Quantum Studio embarqué fournit le design `transmon-microcell` sans serveur : schéma, composants et liens, couches conceptuelles, fréquence nominale, overlay de diaphonie et console de provenance locale restent visibles à côté du snapshot WebGL RATISS.

| Propriété contrôlée | Résultat |
|---|---|
| Ouverture directe par fichier local | Confirmée |
| Chargement du modèle Quantum Studio classique | Confirmé |
| Chargement du snapshot WebGL versionné | Confirmé |
| Timeline, pause, reset, orbite et zoom | Confirmés |
| Dépendance réseau pour la démo | Aucune |

> La démonstration rejoue un artefact local versionné. Elle ne constitue pas une exécution QPU, une calibration électromagnétique ni une démonstration de correction d’erreur matérielle.

## Interface complète

La page `index.html` du Studio Personnel a été vérifiée avec son modèle local prêt et sans timeline chargée. Elle préserve les contrôles de conception, ajout de transmon, optimisation, export, import d’artefact, comparaison TTF, atlas 3D, timeline, inspecteur de nœud, métriques, légende et avertissement de portée. La hiérarchie fonctionnelle est présente ; la prochaine étape applique la même profondeur chromatique que les démonstrations sans modifier la logique hors ligne.

## Aperçus animés documentaires

Les aperçus animés du Studio Personnel sont assemblés exclusivement à partir de captures réelles sous `file://`. Le premier état de trajectoire provient de l’étape `1 / 3`, porte `h(0)`, avec une signature logique affichée `0.765` et une route d’inspection `0 → 1 → 0`.

Le second état de trajectoire a été capturé à l’étape `3 / 3`, porte `cz(0,1)`, avec la signature logique affichée `0.768`, `P_sig` de graphe `0.000` et aucune route TSP. Les valeurs restent inchangées durant l’assemblage de l’aperçu.

Pour l’aperçu d’ablation personnelle, la première image provient du snapshot `ttf_smooth_baseline`. Le contrôle de la démo a ensuite sélectionné `ttf_smooth_correlation_regularization` avant la seconde capture ; les deux états restent donc visibles dans l’aperçu sans calcul ajouté.

Les aperçus GIF du Studio Personnel ont été vérifiés après assemblage : les cartes de design, la scène WebGL, les métriques et la différence référence/régularisation restent lisibles à la largeur documentaire de 640 pixels.

Après la refonte topologique, `trajectory-replay.html` affiche sous `file://` l’anneau logique, les brins de tresse, l’arc de phase et les métriques `P_sig`, `phase`, `twist`, `coherence` et `protected` extraites du snapshot. `ttf-ablation.html` affiche explicitement « graphe d’inspection » et « non exportée » lorsque l’artefact d’ablation ne fournit pas de sidecar logique : aucun anneau de qubit n’est alors inventé par le lecteur.

Les captures actuelles de l’ablation Personnelle comparent l’état initial `ttf_smooth_baseline` à l’état final `ttf_smooth_correlation_regularization` : porte `cx(2,4)`, frontière `[4, 3]`, support total `1.006`, activation lisse moyenne `0.505` et `P_sig` graphe `0.000`. Les deux états sont rendus sous `file://` et affichent explicitement l’absence de signature logique exportée.

Le GIF actualisé `docs/media/personal-trajectory-webgl-preview.gif` a été vérifié : l’interface Quantum Studio locale, l’anneau, la tresse, l’arc de phase et les métriques de qubit logique sont lisibles à la largeur d’intégration README, sans dépendance réseau.
