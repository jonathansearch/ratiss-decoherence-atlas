# Notes de vérification

## Ouverture locale

Le 22 août 2026, `index.html` a été ouvert directement via une URL locale `file://`. La structure HTML, la scène WebGL, l’inspecteur, le lecteur de timeline et le graphique Canvas se sont tous chargés sans CDN ni serveur.

L’état initial est volontairement vide : l’utilisateur choisit explicitement un artefact JSON au moyen du sélecteur de fichier. Cette approche est requise pour rester compatible avec l’ouverture directe d’un fichier HTML, car un navigateur restreint habituellement la lecture automatique d’un fichier JSON voisin depuis `file://`.

La vérification suivante doit charger `data/full_timeline.json`, généré par le moteur complet, puis confirmer le rendu des nœuds, des tubes et des valeurs exportées.

## Chargement de l’artefact calculé

Le même jour, `data/full_timeline.json` a été sélectionné localement dans l’interface. L’atlas a chargé **11 étapes** et affiché la scène de cinq nœuds, les tubes provenant des arêtes exportées, la timeline, ainsi que les métriques suivantes à l’étape initiale : `P_sig` de graphe `0.000`, signature logique RATISS `1.214`, décohérence moyenne `0.000` et Betti `[1, 0, 0]`.

La différence entre la persistance de graphe nulle à cette étape et la signature du noyau logique non nulle est intentionnelle et visible : les deux pipelines sont exportés séparément. Aucun tube, score ou chemin n’a été inventé par l’atlas.

Le curseur a ensuite été positionné sur l’étape terminale de l’artefact régénéré. Cette étape comporte une route TSP exportée calculée sur les nœuds critiques `3` et `4` : `3 → 4 → 3`, avec la méthode exacte `held_karp_exact` et un coût de `6.670742751` dans les coordonnées de visualisation déterministes.

Le visualiseur a ensuite été corrigé pour lire le seuil de criticité directement dans `config.criticality_threshold` de l’artefact, plutôt que de conserver un seuil d’interface fixe. Cette correction garantit que les couleurs, le compteur de nœuds critiques et la route TSP restent synchronisés avec le calcul du moteur.

L’artefact régénéré a été rechargé avec succès après cette correction ; l’atlas confirme de nouveau le schéma `timeline.v1` et ses onze étapes. La vérification terminale est ensuite menée par positionnement du curseur sur l’étape `10`.

## Vérification terminale alignée

À l’étape `10` (`cx(2,4)`), l’interface affiche désormais exactement les éléments fournis par l’artefact : décohérence moyenne `0.018`, deux nœuds critiques en rouge, `P_sig` logique `0.766`, Betti `[1, 0, 0]` et la route rose `3 → 4 → 3`. Le panneau indique `held_karp_exact` et le coût arrondi `6.671`.

Cette vérification confirme que la couleur, le compteur de criticité, la route et le panneau ne sont pas décoratifs : ils sont synchronisés avec `config.criticality_threshold`, les scores de nœuds et `tsp_inspection` du JSON réel.

## Studio Personnel en ouverture `file://`

Le navigateur peut empêcher le chargement d’un import ES module depuis une origine `file://`, même lorsque l’Atlas classique et Three.js local sont disponibles. Le Studio Personnel utilise donc une passerelle `studio-model.js` et un contrôleur `personal-studio.js` en scripts classiques ; ils sont dérivés du modèle traçable `studio-model.mjs` et ne nécessitent aucune requête réseau.

Après le correctif, le Studio Personnel affiche effectivement le design `transmon-microcell`, ses six composants, le schéma local, les quatre familles de couches conceptuelles, les deux fréquences nominales et la ligne de risque de diaphonie `q0 ↔ q1`. Le contrôleur de modèle est présent dans la page locale et le sélecteur d’artefact est prêt pour une timeline RATISS réelle.

La timeline `studio_transmon_microcell_timeline.json`, générée par le chemin interne du Studio Cloud, a ensuite été chargée dans le Studio Personnel ouvert via `file://`. L’Atlas a reconnu ses quatre étapes, sa provenance `internal_studio_import`, les deux nœuds de la scène, Betti `[1, 0, 0]`, `P_sig` de graphe `0.000`, signature logique `1.214` et l’absence de route TSP à l’étape initiale. Cette vérification confirme qu’un utilisateur peut exporter ou obtenir une simulation depuis le Studio Cloud puis l’analyser dans le Studio Personnel sans serveur, CDN, ni clonage du dépôt Cloud.

## Préparation des imports externes

Les fixtures locales de comptages Qiskit, de distributions de modes photoniques et de matrices de corrélation bio sont présentes sous `data/external/`. Le sélecteur de fichiers et l’API locale du lecteur sont disponibles en ouverture `file://` pour leur contrôle de rendu. Les tests Node valident déjà les trois schémas, leurs provenances et le fait que les métriques de matrice densité sont explicitement indisponibles.

Les artefacts `qiskit_counts_timeline.json` et `photonic_modes_timeline.json` ont été chargés successivement dans le Studio Personnel. Les deux sont lus comme des associations importées, avec `P_sig` logique et métriques de densité affichés comme non applicables. L’interface indique explicitement que la criticité et la route TSP sont structurelles, sans inférer décohérence quantique, pureté, fidélité ou entanglement.

L’artefact `bio_correlation_timeline.json` a également été chargé avec succès : ses deux fenêtres sont reconnues, les trois nœuds et la route structurelle exportée sont dessinés, et la même frontière d’interprétation est affichée. Les trois chemins d’ingestion sont ainsi vérifiés dans le lecteur WebGL hors ligne.

## Comparaison TTF

Le panneau de comparaison TTF est présent dans l’ouverture locale du Studio Personnel. Ses deux emplacements de chargement séparés, « référence » et « régularisation », refusent toute provenance différente des scénarios calculés correspondants. Les contrôles de replay ne sont activés qu’après chargement effectif de leur timeline.

Les deux timelines TTF générées par le Studio Cloud ont été chargées. À l’étape terminale, le panneau compare un support topologique total de `0.118` pour la référence et de `1.006` pour le scénario régularisé, avec la même frontière exportée `[4, 3]`. Cette comparaison est affichée comme une ablation logicielle de graphe, non comme une correction d’erreur physique ou une validation matérielle.

Le bouton de replay « Voir régularisation » a chargé la timeline régularisée puis la navigation a atteint l’étape terminale `10`. Le lecteur confirme sa provenance `TTF · régularisation · 11 étapes` et maintient le libellé « Association importée », qui exclut explicitement toute inférence de fidélité, pureté, décohérence quantique ou entanglement.
