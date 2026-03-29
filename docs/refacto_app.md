# refacto_app.md

## Contexte

Le fichier `src/App.jsx` a ete conserve comme fichier principal, mais son role a ete recentre:

- avant: composant monolithique (etat + metier + rendu massif),
- apres: orchestrateur lisible qui delegue des blocs UI et metier.

## Etape 1 executee (reorganisation shared)

Objectif:
- sortir les composants UI reutilisables du flux metier.

Actions:
- deplacement de `src/ui/*` vers `src/shared/ui/*`,
- mise a jour de tous les imports consommateurs (`App`, sections, drawers, profile, skill).

Resultat:
- les composants transverses sont centralises dans `shared/ui`,
- meilleure separation entre composants de feature et composants communs.

## Etape 2 executee (feature skills)

Objectif:
- placer `SkillCard` dans un espace metier dedie.

Actions:
- deplacement de:
  - `src/components/skills/SkillCard.jsx`
  - vers `src/features/skills/components/SkillCard.jsx`,
- correction des imports internes de `SkillCard` (constants/utils/shared ui),
- mise a jour de l'import dans `src/app/sections/AppMainCarousel.jsx`.

Resultat:
- le domaine "skills" devient explicite dans l'arborescence,
- base prete pour extractions suivantes (`hooks`, `services`, `tests`).

## Validation technique

Verification effectuee:
- build production (`npm run build`) passe apres deplacements et corrections.

## Etat courant

- `App.jsx` reste le point principal.
- `shared/ui` contient les composants reutilisables.
- `features/skills/components/SkillCard.jsx` est place dans la couche metier.

## Suite recommandee (incrementale)

1. Creer `src/features/skills/hooks/` pour sortir les logiques memory/pattern.
2. Creer `src/features/skills/services/` pour regles metier reutilisables.
3. Ajouter tests de caracterisation sur les flows critiques avant extraction lourde.

# Rapport Technique de Refactorisation d'App

## Portee

Ce document detaille la transformation d'un fichier React monolithique (`src/App.jsx`, environ 1500 lignes au depart) vers une structure modulaire, tout en preservant le comportement de l'application.

Contraintes cibles:
- `src/App.jsx` reste le fichier principal de l'application.
- Le nombre de lignes de `src/App.jsx` est reduit en dessous de 700.
- Pas de redesign fonctionnel, uniquement une refactorisation structurelle.

Etat final:
- `src/App.jsx`: 314 lignes.
- Le rendu JSX le plus lourd a ete extrait dans des composants de section.
- Les comportements coeur ont ete conserves et verifies par des builds.

---

## Etat Initial

`src/App.jsx` melangeait toutes les responsabilites:

1. Initialisation de l'etat (`useState`, `useEffect`, refs).
2. Persistance (`localStorage`, lecture/ecriture + migration de compatibilite).
3. Logique metier du jeu (batailles, progression XP, achievements).
4. Cycle de vie de la reconnaissance vocale.
5. Rendu UI (boutons, drawers, overlays, carousel, toasts, event modal).

Le resultat etait un unique fichier fortement couple et difficile a maintenir.

---

## Strategie de Refactorisation

Une strategie par etapes a ete appliquee:

1. **Extraire d'abord les blocs logiques purs/semi-purs** (stockage, combat, handlers micro).
2. **Extraire ensuite les gros blocs JSX** dans des sections pour faire baisser la taille du fichier sans risque.
3. **Conserver App comme orchestrateur** (etat + wiring + passage de props).
4. **Valider le build apres chaque etape majeure** pour detecter rapidement toute regression.

Aucune reecriture d'architecture n'a ete faite (pas de migration Redux, pas de redesign routing, pas de changement de modele de donnees).

---

## Transformations de Fichiers

## 1) Extraction du Stockage

Cree:
- `src/app/profileStorage.js`

Deplace depuis App:
- `getStorageKey(profileId)`
- `loadSkills(profileId)`
- `loadTheme(profileId)`
- `loadStats(profileId)`

Objectif:
- Retirer le boilerplate de persistance/migration du composant principal.
- Conserver strictement le comportement de compatibilite (fallback legacy, hydratation des champs manquants).

---

## 2) Extraction du Handler de Combat

Cree:
- `src/game/combatHandlers.js`

Factory ajoutee:
- `makeHandleSuccessHit(ctx)`

Deplace depuis App:
- Toute la logique de `handleSuccessHit(skillId, isWrong)`:
  - Gestion des mauvaises reponses.
  - Heal du boss en cas d'erreur.
  - Gestion de mort du joueur.
  - Affichage des damage numbers.
  - Sons mob hurt/death.
  - Calcul et distribution XP.
  - Level-up et progression des badges.
  - Progression de difficulte.
  - Verification des achievements.
  - Generation du challenge suivant.

Methode d'integration:
- `App` construit maintenant `handleSuccessHit` via la factory en passant un objet de contexte (`ctx`).

Objectif:
- Retirer le plus gros bloc imperatif d'App tout en preservant le comportement.

---

## 3) Extraction Voice/Microphone

Cree:
- `src/game/micHandlers.js`

Factory ajoutee:
- `makeMicHandlers(ctx)` qui retourne:
  - `stopVoiceRecognition`
  - `startVoiceListener`
  - `toggleMicListener`

Deplace depuis App:
- Le cycle complet de reconnaissance vocale base sur `webkitSpeechRecognition`.
- Le matching des homophones.
- La logique d'auto-restart en mode reading.
- La gestion d'erreur et le feedback texte UI.

Methode d'integration:
- `App` recupere ces fonctions via `makeMicHandlers(...)`.

Objectif:
- Isoler la logique side-effect lourde liee au navigateur hors du corps principal du composant.

---

## 4) Decomposition UI (Levier Principal de Reduction)

Composants de section crees:

- `src/app/sections/AppChrome.jsx`
  - Controles haut-gauche / haut-droite.
  - Affichage des coeurs HP.
  - Overlays d'ouverture/fermeture des drawers.
  - Bouton bug report.
  - Backdrop de bataille.

- `src/app/sections/AppDrawers.jsx`
  - `CosmeticsDrawer`
  - `SettingsDrawer`
  - `MenuDrawer`
  - `ResetModal`
  - `BugReportModal`

- `src/app/sections/AppMainCarousel.jsx`
  - Zone logo/titre.
  - Chevrons gauche/droite.
  - Interactions du carousel de skills.
  - Boucle de rendu `SkillCard`.

- `src/app/sections/AppToastsAndOverlays.jsx`
  - Toast lootbox.
  - Toast achievement.
  - Overlay de mort.
  - Overlay level-restored.
  - Integration de l'event phantom.

Objectif:
- Retirer la majorite du JSX de `App.jsx`.
- Garder un comportement explicite, pilote par les props.

---

## 5) Restauration du Fichier Principal App

Un etat intermediaire a utilise un split wrapper + legacy.
L'etat final a ete ajuste selon la contrainte demandee:

- `src/App.jsx` est le fichier principal (etat + orchestration).
- Le wrapper temporaire a ete supprime.
- Les imports ont ete corriges pour le contexte racine.

Resultat:
- App reste le fichier principal du projet.
- Le nombre de lignes d'App reste en dessous de 700.

---

## Changements Structurels en Dehors d'App

### Deplacement du dossier UI

Deplace depuis:
- `src/components/ui/*`

Vers:
- `src/ui/*`

Tous les imports impactes ont ete mis a jour dans:
- le fichier App,
- les drawers,
- les composants skill/profile,
- les composants UI dependants.

### Bases de structure projet

Dossiers crees pour une refacto progressive:
- `src/app`
- `src/game`
- `src/ui`
- `src/data`
- `src/core`

Document de plan cree:
- `docs/REFACO_FOLDER_SPLIT.md`

---

## Validation et Verifications de Securite

Des verifications ont ete faites apres chaque extraction majeure:

1. Build:
   - `npm run build`
2. Lint sur les fichiers modifies.
3. Corrections de chemins d'import apres deplacement de fichiers.
4. Corrections de syntaxe apres remplacements de blocs volumineux.

Problemes rencontres puis corriges:
- default export duplique (erreur temporaire de wrapper).
- imports non resolus apres changement de profondeur de chemin.
- `return` malformed temporairement place dans un `useEffect`.
- accolade fermante manquante apres remplacement de bloc.

Tous ces points ont ete corrigees avant la validation finale.

---

## Photo Finale de l'Architecture

`src/App.jsx` gere maintenant:
- l'etat global et les refs,
- l'orchestration des effets,
- le wiring des dependances/callbacks,
- le rendu de sections haut niveau.

Les responsabilites detaillees sont deleguees a:
- `src/app/profileStorage.js`
- `src/game/combatHandlers.js`
- `src/game/micHandlers.js`
- `src/app/sections/*.jsx`

Le projet passe d'un monolithe a un orchestrateur + modules, sans modification du contrat de gameplay.

---

## Resultat Quantitatif

- Avant: ~1500 lignes dans `src/App.jsx`.
- Apres: 314 lignes dans `src/App.jsx`.
- Reduction: ~79%.

Source principale de reduction:
- extraction du JSX en composants de section.

Source secondaire:
- extraction des blocs stockage/combat/micro.

---
