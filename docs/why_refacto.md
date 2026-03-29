# Problemes globaux ayant motive la refactorisation

## 1. Probleme global de `App.jsx`

`App.jsx` concentrait trop de responsabilites dans un seul point:

- orchestration UI,
- logique metier (combat, progression, achievements),
- persistance (`localStorage`),
- gestion d'etats transverses,
- appels side-effects (audio, overlays, feedback).

Conséquences:

- Couplage fort entre UI et metier.
- Faible lisibilite et cout de maintenance eleve.
- Risque de regression important a chaque modification.
- Difficulte a isoler/tester des comportements.
- Temps d'onboarding plus long pour un nouveau dev.

## 2. Probleme global de `SkillCard.jsx`

`SkillCard.jsx` etait un composant massif avec plusieurs mini-jeux et interactions dans le meme fichier:

- rendu conditionnel tres volumineux,
- logique memory + pattern + writing + math mélangee,
- etats locaux nombreux et dependants,
- handlers d'input + animations + effets de jeu dans le meme module.

Conséquences:

- Fichier trop long, structure difficile a parcourir.
- Effets de bord plus probables (changement local qui casse un autre mode).
- Evolution lente des features (chaque ajout augmente la complexite cyclomatique).
- Faible separation des preoccupations (presentation vs logique).

## 3. Impact architecture/projet

Au niveau projet, la structure historique freinait l'evolution:

- dossier `components` avec granularite metier inegale,
- composants reutilisables melanges avec composants de feature,
- imports relativement fragiles lors des deplacements.

Conséquences:

- dette technique cumulative,
- difficultes de standardisation des conventions,
- refactorisations plus longues que necessaire.

## 4. Objectif de refacto retenu

- Garder `App.jsx` comme point principal d'orchestration.
- Reduire la taille et la charge cognitive de `App.jsx`.
- Repositionner la reutilisabilite UI dans `shared/ui`.
- Isoler les composants metier dans `features/*`.
- Rendre les futurs decoupages (services/hooks/tests) progressifs et sans big-bang.

