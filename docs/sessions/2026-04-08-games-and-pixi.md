# Session 2026-04-08 — Auth, SPA Angular, domaine jeux, 1er mini-jeu PixiJS

Session dense qui a couvert **trois grosses étapes** de la roadmap : le socle
auth/familles, le bootstrap de l'app Angular, puis tout le domaine métier
« jeux » avec un premier mini-jeu PixiJS jouable de bout en bout.

## 1. Auth & familles (backend)

- Tables `families` et `children` (rattachement à une famille, `grade` CM1/CM2/6EME,
  `display_name`, `avatar`, consentement parental tracé).
- `users.role` : `admin` / `parent` / `child`.
- `users.active_child_id` : FK nullable vers `children`. **Choix important** :
  on stocke l'enfant actif en DB et **pas en session** — une première version
  avait empilé un deuxième middleware `web` sur une route déjà dans
  `auth:sanctum` (qui inclut déjà le stack stateful), ce qui régénérait le
  cookie à chaque sélection et cassait toutes les requêtes suivantes jusqu'au
  reload. Leçon : ne **jamais** re-wrapper une route Sanctum SPA dans
  `Route::middleware('web')`.
- Sanctum v4 en mode **SPA** (cookies + XSRF) + Fortify v1 headless pour les
  endpoints login/register/logout/user.
- Middleware `EnsureChildSelected` qui lit `active_child_id` sur l'utilisateur
  et renvoie `409` si rien n'est sélectionné.
- Admin Filament verrouillé : `User implements FilamentUser` avec
  `canAccessPanel(): $this->role === 'admin'`. Un parent qui tape `/admin` se
  prend un 403.
- Tests Pest sur l'inscription, login, CRUD enfants, sélection de profil,
  isolation cross-family.

## 2. Angular SPA (frontend)

- Structure `core/` (services transverses, guards) + `features/` (auth,
  profiles, play, dashboard).
- `ApiService` qui appelle `GET /sanctum/csrf-cookie` puis attaque l'API avec
  `withCredentials: true`. Angular lit automatiquement le cookie `XSRF-TOKEN`.
- Guard d'auth `authGuard` basé sur une signal `currentUser` dans `AuthService`.
- Écrans `/login` et `/register` en Reactive Forms, signals pour l'état.
- **Profile picker style Netflix** (`/profiles`) : grille d'avatars, un clic
  appelle `POST /api/children/{id}/select` et redirige sur `/play`. Un lien
  « Changer de profil » est présent partout.
- CRUD enfants côté parent (création / édition / suppression, avec confirmation
  et état de soumission désactivant les boutons).
- `/play` liste les jeux disponibles pour l'enfant actif.
- Routes lazy-loadées via `loadComponent`, `app.routes.server.ts` mappe les
  routes dynamiques en `RenderMode.Client`.
- Tailwind v4 branché, cohérent avec Filament.

## 3. Domaine jeux + 1er mini-jeu PixiJS

### Schéma DB (pensé pour SM-2 + Elo)

- `games` : `slug`, `name`, `description`, `grade_min`, `grade_max`,
  `engine` (pixi/dom), `component_key` (clé que le front résout en composant).
- `game_learning_objective` : pivot N↔N entre un jeu et les objectifs qu'il
  couvre.
- `game_sessions` : partie jouée par un enfant (`child_id`, `game_id`,
  `started_at`, `finished_at`, `answers_total`, `answers_correct`).
- `objective_progress` : **la table clé**. Un enregistrement par couple
  (enfant, objectif). Unique sur `(child_id, learning_objective_id)`.
  Colonnes :
  - EWMA v1 (en prod) : `attempts`, `correct`, `streak`, `mastery` (0-100),
    `last_practiced_at`, `last_correct_at`.
  - Placeholders **SM-2** (nullable) : `sm2_ease_factor`, `sm2_interval_days`,
    `sm2_repetitions`, `sm2_due_at`.
  - Placeholder **Elo** (nullable) : `elo_rating`.

### Formule EWMA v1

Tout est encapsulé dans `ObjectiveProgress::recordAnswer(bool $correct)` :

```php
private const EWMA_ALPHA = 0.30;

$value = $correct ? 100 : 0;
$previous = $this->attempts === 1 ? $value : (int) $this->mastery;
$this->mastery = (int) round(0.30 * $value + 0.70 * $previous);
```

C'est **le seul point à modifier** quand on passera à SM-2 (gérer l'intervalle
de révision) et Elo (comparer la difficulté de la question au rating de
l'enfant). Les colonnes sont déjà là.

### API jeux

- `GET /api/games` : liste filtrée par niveau de l'enfant actif. **Attention** :
  le tri se fait en PHP avec une map `GRADE_ORDER = ['CM1'=>1,'CM2'=>2,'6EME'=>3]`
  parce que SQL triait alphabétiquement (`'6EME' < 'CM1'`), ce qui cassait le
  filtre `grade_min <= child_grade <= grade_max`.
- `GET /api/games/{slug}` avec `learning_objectives` en include.
- `POST /api/game-sessions` → crée la session.
- `POST /api/game-sessions/{id}/answer` → incrémente la session, appelle
  `ObjectiveProgress::recordAnswer`.
- `POST /api/game-sessions/{id}/finish` → marque `finished_at`.
- Toutes les routes sont sous `child.selected` (sinon 409).
- Tests Feature : liste, 409 sans enfant, run complet avec vérif mastery,
  interdiction cross-child.

### Mini-jeu « Chasse à la symétrie » (v1 — remplacé par « Le Miroir Magique » v2, voir session 2026-04-09)

- Cible : `CY3-MAT-EGE-SYM-CM1-01` (« Reconnaître qu'une figure possède un ou
  plusieurs axes de symétrie »).
- 10 questions / session, queue équilibrée (50% symétriques / 50% asymétriques),
  mélangée.
- 12 figures thématiques dessinées en Pixi v8 `Graphics` :
  - symétriques : papillon, cœur, fleur, sapin, maison, étoile
  - asymétriques : éclair, virgule, lettre F, lettre G, poisson, tourbillon
- Canvas 400×400, origine translatée au centre (Container positionné à
  `(200,200)`), les figures sont dessinées en coordonnées locales.
- UX : boutons Oui/Non, feedback 1.2s avec la bonne réponse, score final avec
  emoji (`🌟🌟🌟` / `🌟🌟` / `🌟` / `💪`) et bouton Rejouer.

### Bug Pixi mémorable (et important à retenir)

Premier run : le score avançait mais **aucune figure ne s'affichait**. La
« bordure blanche » visible était en fait la `<div>` hôte avec ses classes
Tailwind, pas un canvas Pixi. Root cause : le `<div #canvasHost>` était dans
la branche `@else` de `@if (loading())`, donc au moment où `bootstrap()`
appelait `initPixi()`, le host n'existait pas encore dans le DOM.

Fix : utiliser `afterNextRender` d'Angular pour lancer `initPixi` une fois le
DOM garanti présent, et sortir le canvas host de la branche `loading` pour
qu'il soit toujours monté pendant la phase « playing ». Avec un signal
`pixiReady` pour déclencher le `effect` de dessin au bon moment.

## 4. Autres trucs appris au passage

- Migrations Laravel avec timestamps identiques → **ordre alphabétique**. Sans
  préfixe `a_/b_/c_/d_`, les FK claquent. Toujours préfixer quand plusieurs
  migrations d'un même domaine partagent le timestamp.
- Les tests Pest tournent sur une base PG **dédiée** `ecole_testing` (PG CHECK
  constraints incompatibles SQLite). `phpunit.xml` pointe dessus.
- Le `Controller` de base de Laravel récent n'inclut plus `AuthorizesRequests` :
  pas de `authorizeResource()`, utiliser `Gate::authorize()` dans chaque méthode.
- Factories : `fake()->unique()->slug(2)` pour éviter les collisions de slug
  entre runs de tests.
- `learning_objectives.period_mode` est NOT NULL → toujours `'none'` par
  défaut dans les factories/tests.
