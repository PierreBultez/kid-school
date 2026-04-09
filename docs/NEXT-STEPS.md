# Prochaines étapes proposées

> Mis à jour : 2026-04-09, après la refonte complète du 1er mini-jeu (« Le Miroir Magique » v2).

L'ordre ci-dessous est une **proposition** — à trancher ensemble en début de
prochaine session. Chaque bloc est pensé pour être livrable indépendamment.

---

## Étape A — Gamification minimale (petite, ludique, utile)

**Pourquoi maintenant :** on a un mini-jeu jouable, c'est le meilleur moment
pour transformer les bonnes réponses en récompenses visibles. Sans ça, l'enfant
joue « pour rien ».

- Table `xp_ledger` (append-only) : `child_id`, `source` (ex: `game_session`),
  `source_id`, `amount`, `created_at`.
- Calcul d'XP à la fin d'une `GameSession` : XP = `answers_correct` × 10 + bonus
  si score ≥ 80 %.
- Endpoint `GET /api/children/{child}/xp` → total + historique récent.
- Affichage côté Angular : compteur d'XP dans le header du `/play`, animation
  simple en fin de session (« +80 XP ! »).
- **Pas encore** d'étoiles / avatars / collection : on garde ça pour la phase 3.

---

## Étape B — Dashboard parent v1

**Pourquoi :** c'est la moitié du produit côté acheteur. Tant qu'il n'y a rien,
le parent n'a aucune raison d'ouvrir l'app.

- Route Angular `/dashboard` (déjà dans `app.routes.ts`, à remplir).
- Vue « Mes enfants » : pour chaque enfant, 3-4 KPIs sur **30 jours**
  glissants :
  - Temps joué (somme des durées de `game_sessions` terminées).
  - Nombre d'objectifs travaillés.
  - Nombre d'objectifs « en bonne voie » (`mastery ≥ 70`).
  - Dernière session.
- Endpoint `GET /api/children/{child}/progress/summary` qui agrège côté Laravel.
- Vue détail par enfant : liste des objectifs avec leur `mastery`, triée par
  « plus faible d'abord » (= où il faut aider).
- **Pas de graphiques** au départ, juste des chiffres et une barre de
  progression Tailwind.

---

## Étape C — 2ᵉ mini-jeu PixiJS (fractions ou calcul mental)

**Pourquoi :** valider que l'architecture « un composant par jeu + clé
`component_key` côté DB + résolution côté Angular » tient la route avec
**plusieurs** jeux. Aujourd'hui on n'a qu'un cas, donc on ne sait pas.

Pistes, à trancher ensemble :
1. **Calcul mental « train des opérations »** — objectif très dense en usage,
   bon pour tester la boucle « question → réponse → feedback » à forte
   cadence. Cible plusieurs objectifs CM1/CM2 du domaine NCA.
2. **Fractions visuelles** — plus original, utilise mieux Pixi (parts de
   pizza, curseurs à déplacer). Cible les objectifs `CY3-MAT-NCA-FRA-*`.

Livrables :
- Nouveau composant dans `features/play/<slug>/`.
- Router : ajouter la route + la route serveur.
- Seeder : nouveau `Game` en base lié aux bons `LearningObjective`.
- Réutiliser `GamesService` tel quel (c'est le test de l'archi).

---

## Étape D — Passage du mastery EWMA → SM-2 (moyen terme, pas pressé)

Tout est déjà préparé en DB. La migration sera purement logique :

- Étendre `ObjectiveProgress::recordAnswer()` pour mettre à jour les colonnes
  `sm2_*` selon l'algo SuperMemo-2 (quality 0-5 dérivée de `correct` + vitesse).
- Ajouter `GET /api/children/{child}/due-objectives` qui renvoie les objectifs
  dont `sm2_due_at <= now()` — c'est la **file de révision**.
- Côté front, biaiser `buildQueue()` des mini-jeux pour tirer en priorité dans
  les objectifs dus.

À faire **seulement quand** on a au moins 3 jeux et assez de données pour que
la notion de « révision espacée » ait du sens.

---

## Étape E — Hygiène projet (à caser dès que ça gratte)

- CI GitHub Actions : `composer install` + `php artisan test` + `ng build` +
  lint front.
- Linter / formatter front : confirmer ESLint + Prettier en strict mode.
- Factorisation du « canvas host + boot Pixi » dans un composant ou une
  directive réutilisable (anticipe le 2ᵉ jeu Pixi).
- ADR courts dans `docs/adr/` pour les gros choix (Sanctum SPA, active_child_id
  en DB, EWMA → SM-2, etc.).

---

## Questions à trancher avant de coder l'étape A

- **XP : valeurs fixes ou paramétrables par jeu ?** (proposé : fixe au début,
  paramétrable via colonne `games.xp_per_correct` quand un jeu sortira du lot.)
- **Étoiles : on les introduit tout de suite ou on attend ?** (proposé :
  attendre — XP d'abord, étoiles dans la phase « avatar évolutif ».)
- **Feedback visuel fin de session : animation Pixi dans le canvas existant ou
  écran HTML ?** (proposé : HTML, plus rapide et plus accessible.)
