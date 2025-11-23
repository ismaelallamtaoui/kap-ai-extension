# Historique des modifications

## Version 1.0 — Clean rebuild (23 novembre 2025)

Cette version constitue une reconstruction complète du projet original pour améliorer la maintenabilité et la cohérence du code :

- **Refactorisation de l’arborescence** : tout le code source a été déplacé dans un dossier `src/` avec des sous‑répertoires pour le service worker (`background/`), le panneau latéral (`sidepanel/`) et les pages chargées dans l’iframe (`pages/`).
- **Séparation des données et utilitaires** : les fichiers JSON (`data.json` et `suggestions.json`) ont été placés dans `src/data/`, et la base de données d’IA (`ai_database.js`) dans `src/utils/`.
- **Organisation des assets** : toutes les images ont été centralisées dans `assets/images/` afin de simplifier leur référence.
- **Fichier unique de styles** : la feuille de style globale a été déplacée dans `styles/style.css`, avec mise à jour de tous les chemins relatifs dans les pages.
- **Mise à jour du manifest** : les nouvelles routes de fichiers (panneau latéral, service worker, web accessible resources) ont été reflétées dans `manifest.json`.
- **Harmonisation des noms** : les fichiers HTML sont désormais nommés `index.html` et les scripts associés `script.js` pour chaque page.
- **Documentation** : un `README.md` détaillé explique l’objectif de l’extension, l’organisation des dossiers et la procédure d’installation.
- **Ignorés dans Git** : ajout d’un `.gitignore` pour exclure les dossiers de dépendances, de build et les fichiers temporaires.

Cette version ne modifie aucune fonctionnalité par rapport au projet d’origine ; elle se concentre exclusivement sur un nettoyage et une restructuration du code.