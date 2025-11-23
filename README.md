# KAP.ai Chrome Extension (Clean Rebuild)

Ce dépôt contient une version reconstruite et nettoyée de l’extension **KAP.ai Enhanced**.  
L’objectif est de fournir une base de code claire et maintenable en conservant toutes les fonctionnalités d’origine sans en ajouter de nouvelles.  
L’extension aide les utilisateurs à réfléchir à leur usage de l’IA (quiz de triage, prompts favoris, constructeur de prompt) et propose désormais une interface “Mieux Prompter” moderne intégrée au panneau latéral.

## Structure du projet

L’arborescence a été réorganisée pour séparer clairement les responsabilités :

```
kap_ai_extension/
│── manifest.json            # Déclaration de l’extension (MV3)
│── assets/
│   └── images/             # Icônes et images utilisées par l’extension
│── styles/
│   └── style.css           # Feuille de style globale partagée
│── src/
│   ├── background/
│   │   └── background.js   # Service worker qui configure le panneau latéral
│   ├── sidepanel/
│   │   ├── sidepanel.html  # Point d’entrée du panneau latéral
│   │   └── sidepanel.js    # Logique d’onglets et “Mieux Prompter”
│   ├── pages/              # Pages chargées dans l’iframe du panneau
│   │   ├── about/
│   │   │   └── index.html
│   │   ├── constructor/
│   │   │   ├── index.html
│   │   │   └── script.js
│   │   ├── entry/
│   │   │   ├── index.html
│   │   │   └── script.js
│   │   ├── favorites/
│   │   │   ├── index.html
│   │   │   └── script.js
│   │   ├── profile/
│   │   │   ├── index.html
│   │   │   └── script.js
│   │   ├── quiz/
│   │   │   ├── index.html
│   │   │   └── script.js
│   │   ├── recent/
│   │   │   ├── index.html
│   │   │   └── script.js
│   │   ├── recommendation/
│   │   │   ├── index.html
│   │   │   └── script.js
│   │   └── triage/
│   │       ├── index.html
│   │       └── script.js
│   ├── utils/
│   │   └── ai_database.js   # Base de données d’IA pour les recommandations
│   └── data/
│       ├── data.json        # Données statistiques (restées inchangées)
│       └── suggestions.json # Suggestions de chips pour l’interface de profil
```

## Installation de l’extension

1. Ouvrez Chrome/Chromium et rendez-vous sur `chrome://extensions`.
2. Activez le **mode développeur** (coin supérieur droit).
3. Cliquez sur **“Charger l’extension non empaquetée”** et sélectionnez le dossier `kap_ai_extension` contenant le fichier `manifest.json`.
4. L’icône de l’extension apparaît dans la barre d’outils ; cliquez‑dessus pour ouvrir le panneau latéral.

## Fonctionnement général

* **Panneau latéral** : un panneau latéral personnalisé remplace l’ancien popup. Il propose des onglets (“Mieux Prompter”, “Quelle IA choisir ?”, “Mes prompts favoris”, “Paramètres”) et charge les pages internes dans un iframe afin de préserver leur logique et leur style originaux.
* **Pages** : chaque fonctionnalité (constructeur, quiz, favoris, profil, triage, etc.) est isolée dans son propre répertoire sous `src/pages/`. Les fichiers `index.html` et `script.js` correspondants sont chargés dynamiquement depuis le panneau.
* **Styles** : la feuille de style globale `styles/style.css` est partagée par toutes les pages. Les chemins des images ont été mis à jour pour pointer vers `assets/images/`.
* **Données et utilitaires** : les fichiers `data.json`, `suggestions.json` et `ai_database.js` ont été placés respectivement sous `src/data/` et `src/utils/`.

## Usage

L’extension conserve toutes les fonctionnalités du projet d’origine :

* **Quiz de triage** pour choisir la bonne IA selon vos besoins.
* **Constructeur de prompt** avec des modes Rapide et Expert, intégrant une jauge d’impact environnemental.
* **Gestion des favoris et des prompts récents** avec possibilité de copier, éditer, supprimer et réorganiser.
* **Profil utilisateur** permettant de renseigner ses préférences et de générer des prompts personnalisés (“Mieux Prompter”).

## Contribuer

Ce dépôt est une base propre pour continuer le développement. Merci de respecter l’architecture en place ; toute nouvelle fonctionnalité doit être discutée et justifiée avant d’être intégrée. Les commentaires dans le code expliquent le rôle des principaux fichiers et aideront à la maintenance.