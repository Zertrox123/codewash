# Comment `App.jsx` est passé d'environ 1550 lignes à ~300 lignes

## Résumé court

Conformément à la **Scout Rule** ("laisser le code dans un meilleur état que celui dans lequel on l'a trouvé"), le fichier n'a pas été simplement "raccourci en supprimant de la logique".  
Il a été **transformé en orchestrateur** :

- `App.jsx` garde l'état global et le câblage (wiring).
- Les gros blocs de rendu JSX sont déplacés dans des composants de section.
- Les gros handlers métier (combat, stockage) sont déplacés dans des modules dédiés.

Résultat : moins de lignes dans `App.jsx`, une meilleure lisibilité, et le même comportement global.

---

## État initial (le problème)

Le `App.jsx` initial mélangeait :

1. État React (beaucoup de `useState`/`useEffect`).
2. Logique métier complexe (combat, progression, gestion de l'XP).
3. Persistance locale (`localStorage`).
4. Logique d'interactions UI.
5. Gros rendu JSX (menus, overlays, carousel, toasts).

C'était un "God component" (composant Dieu) : très long, difficile à lire, et extrêmement difficile à faire évoluer sans introduire de régressions.

---

## Principe de transformation utilisé

La refactorisation a été faite en **petites étapes réversibles** :

1. Extraire les blocs logiques qui n'ont pas besoin de vivre dans le composant principal.
2. Extraire la logique de combat dans des fonctions pures.
3. Extraire les gros blocs de rendu visuel dans des composants de section.
4. Laisser `App.jsx` agir comme "chef d'orchestre" (conservation de l'état + passage de props + callbacks).

Important : la stratégie n'était pas de "tout refaire depuis zéro", mais de **déplacer proprement** les responsabilités.

---

## Étape par étape (ce qui a été séparé)

### Étape A - Extraction du stockage profil

Nouveau fichier :
- `src/app/profileStorage.js`

Ce qui a été déplacé :
- Toute la logique liée au `localStorage` (`loadSkills`, `loadTheme`, `loadStats`).
- La fonction utilitaire `getProfileStats`.

Effet : 
- `App.jsx` ne gère plus la mécanique de sauvegarde, il se contente d'appeler ces fonctions au montage du composant ou lors d'un changement d'état. Les dépendances externes (comme le thème actif) sont passées explicitement en paramètres.

### Étape B - Extraction de la logique métier (combat)

Nouveau fichier :
- `src/game/combatHandlers.js`

Ce qui a été déplacé :
- La volumineuse fonction de calcul des dégâts, de l'XP, des niveaux et de gestion de la vie des monstres et du joueur.
- Création d'une "factory" `makeHandleSuccessHit(ctx)` qui reçoit le contexte (setters React, états actuels, et fonctions annexes).

Effet :
- Le plus gros morceau de code impératif et conditionnel est retiré de `App.jsx`.

### Étape C - Décomposition du rendu JSX en sections

Nouveaux fichiers :
- `src/app/sections/AppChrome.jsx`
- `src/app/sections/AppDrawers.jsx`
- `src/app/sections/AppMainCarousel.jsx`
- `src/app/sections/AppToastsAndOverlays.jsx`

Ce qui a été déplacé :
- Boutons top-left/top-right (Interface HUD).
- Overlays des tiroirs (drawers) et le fond noir de combat (battle backdrop).
- Les modales de paramètres et les cosmétiques.
- La zone logo + le carousel principal + les cartes de compétences (`SkillCard`).
- Les notifications (toasts), écrans de mort, restauration de niveau et événements Phantom.

Effet :
- Baisse massive du nombre de lignes dans `App.jsx` sans aucune perte de fonctionnalité visuelle.

---

## Ce que `App.jsx` fait maintenant

Aujourd'hui, `App.jsx` agit uniquement comme un contrôleur centralisé. Il contient :

- Les déclarations d'état global (`useState`).
- Les effets globaux (sauvegarde déclenchée par `useEffect`, gestion du volume sonore, mode plein écran).
- L'instanciation des handlers métier via des factories (`makeHandleSuccessHit`, etc.).
- Le rendu haut niveau des composants de section avec la distribution des propriétés (props).

Il ne porte plus aucun détail d'implémentation UI ou métier en "inline" (en dur dans le fichier).

---

## Pourquoi ça marche (et pourquoi c'est mieux)

Cette nouvelle architecture fonctionne car nous avons changé la forme, pas le comportement :

1. **Même source de vérité :** L'état global vit toujours au même endroit.
2. **Mêmes contrats :** Les callbacks passés aux composants enfants sont identiques.
3. **Même logique métier :** Elle est juste isolée dans des fichiers spécialisés.

### Testabilité et Filet de Sécurité

La plus grande victoire de ce refactoring est la **testabilité**. En séparant la logique métier (notamment dans `combatHandlers.js`) des composants d'interface React, il est désormais possible d'écrire des **tests de caractérisation** (characterization tests) robustes. 

Nous pouvons valider unitairement que la prise de dégâts, les soins des boss et les gains d'XP fonctionnent correctement sans avoir à monter tout l'arbre DOM de React dans nos tests. Cela crée un filet de sécurité indispensable avant d'ajouter de nouveaux systèmes complexes (comme de nouveaux mini-jeux).

---

## Vérifications utilisées pendant la refacto

Pour s'assurer de ne rien casser lors de ce refactoring, les validations suivantes ont été appliquées en continu :

- Tests unitaires de caractérisation en mode "watch" pour figer les règles de combat.
- Build de l'application : `npm run build`.
- Correction immédiate des imports cassés par le déplacement des fichiers.