# Guide du Studio Personnel hors ligne

## Principe

Le Studio Personnel est prévu pour une machine personnelle où le navigateur peut ouvrir le dépôt sans processus serveur. Cette contrainte explique deux décisions : Three.js est fourni dans `vendor/`, et les démonstrations embarquent des snapshots générés depuis les artefacts locaux.

## Parcours de présentation

Commencez par `index.html`. Le panneau de conception présente le modèle `transmon-microcell`, ses couches, ses fréquences nominales et sa diaphonie comme overlays de conception. Exportez le design si vous souhaitez le traiter par le Studio Cloud.

Ensuite, chargez `data/full_timeline.json`. L’Atlas affiche la timeline, les nœuds, les arêtes, les métriques disponibles, la route TSP et le statut de provenance. Les champs manquants restent manquants ; le lecteur n’invente jamais une fidélité ou une persistance.

Enfin, ouvrez les deux démos du dossier `demos/`. La première rejoue une trajectoire de conception. La seconde compare deux artefacts TTF. Elles sont utiles pour présenter l’interface sans demander de charger un fichier pendant une démo.

## Ajouter une nouvelle timeline

Un fichier doit porter le contrat `ratiss.topological-decoherence.timeline.v1` ou le format historique explicitement reconnu. Utilisez le sélecteur de fichier de l’interface : le navigateur lit le contenu local en mémoire, sans le téléverser.

> Si vous mettez à jour `data/full_timeline.json` ou les JSON TTF, exécutez `node scripts/build_demo_snapshots.mjs` avant de présenter les pages du dossier `demos/`.

## Lecture responsable

Une arête visualisée est une relation de l’artefact. Une sphère rouge est une criticité calculée ou importée dans ce même artefact. Aucune de ces visualisations ne diagnostique un dispositif matériel, une personne ou un système biologique.
