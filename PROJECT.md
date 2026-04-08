# Projet « École » — Application de soutien scolaire pour le primaire

> Document de cadrage et directives projet.
> Version : 0.3 — 2026-04-08
> Périmètre MVP : **Mathématiques — Cycle 3 complet (CM1 / CM2 / 6ᵉ)**

---

## 1. Vision

Une application web ludique destinée aux **enfants du primaire** et à leurs **parents**, permettant de réviser et de renforcer les apprentissages scolaires via des **mini-jeux gamifiés**.

L'application s'appuie sur les **programmes scolaires officiels français** (Éducation nationale / Eduscol) et intègre, en plus des matières classiques, une **initiation à la programmation et à l'informatique**.

### Valeurs produit
- **Bienveillance** : pas de mécaniques anxiogènes (timers stressants, streaks punitifs, loot boxes).
- **Confiance des parents** : transparence totale sur la progression, les données collectées et le temps passé.
- **Respect des enfants** : accessibilité, rythme adapté, pas de manipulation comportementale.
- **Conformité** : RGPD, recommandations CNIL pour les services destinés aux mineurs.

---

## 2. Cibles

### Enfant (utilisateur principal)
- 8-11 ans pour le MVP (CM1).
- Cherche du plaisir et de la nouveauté avant tout.
- Lecture parfois encore fragile → privilégier visuel, audio, instructions courtes.

### Parent (acheteur / décideur / co-utilisateur)
- Veut suivre la progression sans avoir à être expert.
- A besoin d'être rassuré sur la pertinence pédagogique et la sécurité.
- Dispose d'un tableau de bord clair : compétences acquises, points faibles, temps passé.

---

## 3. Périmètre MVP (V1)

### Matière unique : **Mathématiques — Cycle 3 (CM1, CM2, 6e)**

> Décision (2026-04-07) : on développe **par cycle**, pas classe par classe.
> Le profil de l'enfant porte son niveau scolaire (CM1/CM2/6e), et chaque
> contenu pédagogique est tagué avec son niveau cible (et sa période 1-5
> quand Eduscol la précise). Cela évite les migrations futures et permet
> à un enfant de rester dans l'app pendant les 3 années du cycle.
>
> ⚠️ **Cycle = scope du référentiel, pas scope des fonctionnalités.**
> On garde **3 mini-jeux** au lancement. Ils sont conçus pour être progressifs
> et couvrir des objectifs sur les 3 niveaux (difficulté adaptative selon
> le profil). On accepte qu'une partie du référentiel ne soit couverte par
> aucun jeu en V1 — ce sera visible dans Filament pour prioriser le contenu V2.

### Domaines couverts (programme cycle 3 complet)
1. **Nombres et calculs** : nombres entiers, fractions, décimaux, calcul mental/en ligne/posé, résolution de problèmes, proportionnalité.
2. **Grandeurs et mesures** : longueurs, durées, aires, contenances et volumes, angles, proportionnalité.
3. **Espace et géométrie** : apprentissages spatiaux, initiation à la programmation, apprentissages géométriques, raisonnement, vocabulaire et notations, instruments, symétrie axiale, proportionnalité.

Le détail (objectifs par niveau et par période) vit dans :
`backend/database/data/referentiel/cycle3/mathematiques.yaml`

### Fonctionnalités MVP
- Compte famille (1 parent + 1 à 4 profils enfants)
- Auth parent (email + mot de passe)
- Profil enfant simplifié : avatar, prénom, code à 4 chiffres optionnel, **niveau scolaire (CM1/CM2/6e)**
- Parcours pédagogique structuré par `LearningObjective` (objectif Eduscol par niveau et période)
- **3 mini-jeux distincts** au lancement, **progressifs sur les 3 niveaux** du cycle (difficulté adaptative)
- Système de progression par objectif (non acquis / en cours / acquis)
- Gamification de base : XP, étoiles, avatar évolutif, collection de cartes
- Tableau de bord parent : progression, temps passé, points faibles, suggestions
- Récompenses « réelles » paramétrables par le parent
- Mode hors-ligne (PWA)

### Hors périmètre V1 (à garder pour plus tard)
- Autres matières (français, sciences, etc.)
- Autres cycles (cycle 2 = CP/CE1/CE2, cycle 4 = 5e/4e/3e)
- Initiation à la programmation comme module dédié avec Blockly (les objectifs Eduscol « Initiation à la programmation » sont dans le référentiel mais ne seront pas traités par un mini-jeu spécifique en V1)
- Multi-comptes parents
- Social / classement entre familles
- Application mobile native
- **Paiement / abonnement** : V1 = **gratuit, bêta fermée**. Aucune intégration Stripe/Cashier au MVP. Le modèle économique sera tranché après validation de l'usage.

---

## 4. Stack technique

| Couche | Choix                                                                |
|---|----------------------------------------------------------------------|
| **Backend API** | Laravel 13 (PHP 8.3+)                                                |
| **Admin / back-office** | Filament v5                                                          |
| **Frontend** | Angular 21 (standalone components, signals)                          |
| **Base de données** | PostgreSQL 17                                                        |
| **Cache & queues** | Redis                                                                |
| **Auth API** | Laravel Sanctum (tokens)                                             |
| **Hébergement** | VPS OVH (région France), Postgres self-hosted sur le même VPS        |
| **Déploiement** | Laravel Forge (à confirmer)                                          |
| **Mini-jeux** | **PixiJS** (renderer 2D bas niveau, on construit la couche jeu autour) |
| **Programmation enfants (V2)** | Blockly                                                              |
| **Monitoring** | Sentry                                                               |
| **Analytics** | PostHog (self-host EU) ou rien en V1                                 |

### Principes d'architecture
- **API REST** propre exposée par Laravel, consommée par Angular. Pas d'Inertia.
- **Monorepo** : un seul dépôt Git contenant `backend/` (Laravel) et `frontend/` (Angular). Commits cohérents back+front, un seul CI.
- **Filament** est utilisé uniquement pour l'**administration** (gestion des contenus pédagogiques, supervision utilisateurs), **pas** comme interface enfant ou parent.
- **Modélisation des compétences** issue d'un référentiel officiel, dérivé manuellement des programmes scolaires officiels (voir section 12).

---

## 5. Conformité & sécurité

### RGPD / CNIL — non négociable
- **Hébergement EU obligatoire** (OVH France ✅).
- **Consentement parental explicite** avant toute création de profil enfant.
- **Minimisation** : ne collecter que ce qui est strictement nécessaire à la pédagogie.
- **Pas de tracking publicitaire**, pas de cookies tiers.
- **Droit à l'effacement** implémenté dès le départ (suppression de compte = suppression effective).
- **Export des données** d'un enfant à la demande du parent.
- **Politique de confidentialité** rédigée en langage clair, accessible aux parents.
- **Mentions CGU** spécifiques aux mineurs.

### Sécurité technique
- HTTPS partout (Let's Encrypt).
- Sanctum + rotation de tokens.
- Rate limiting sur les endpoints sensibles.
- Validation stricte côté Laravel (FormRequest).
- Hash bcrypt/argon2 pour les mots de passe parents.
- Backups Postgres chiffrés, hors VPS, rétention 30 jours minimum.
- Pas de PII dans les logs.
- Audit OWASP Top 10 avant ouverture publique.

---

## 6. Principes UX

### Pour les enfants
- Interface **visuelle** avant textuelle (icônes, illustrations, couleurs).
- Police lisible, option **OpenDyslexic**.
- **Text-to-speech** sur les consignes.
- **Pas de timer anxiogène** par défaut (option seulement).
- **Feedback immédiat et positif** sur chaque action.
- **Récompenses fréquentes** mais pas inflationnistes.
- **Sessions courtes** suggérées (10-15 min) pour respecter l'attention.

### Pour les parents
- Dashboard **synthétique** : 1 coup d'œil = compréhension de la situation.
- Vocabulaire **non-jargon pédagogique**.
- Notifications **opt-in** uniquement.
- Possibilité de **limiter le temps quotidien** par enfant.

### Accessibilité
- Cible **WCAG 2.1 AA**.
- Contrastes vérifiés.
- Navigation clavier complète.
- ARIA correct sur les composants Angular custom.

---

## 7. Modélisation initiale (à raffiner)

### Identité & famille
- **User** (parent, admin)
- **Family** — regroupement parent + enfants
- **ChildProfile** — enfant rattaché à une famille
  - `school_year` : enum `cm1` / `cm2` / `sixieme` (filtre les contenus visibles)
  - `avatar`, `display_name`, `pin_code` (optionnel)

### Référentiel pédagogique (3 niveaux, fidèle Eduscol)
- **Cycle** — ex : `cycle3`
- **Discipline** — ex : `mathematiques`
- **Domain** — un des 3 grands domaines (Nombres et calculs / Grandeurs et mesures / Espace et géométrie)
- **Topic** — thème pédagogique Eduscol (ex : « Les nombres entiers », « Fractions », « Les angles »)
- **LearningObjective** — **unité élémentaire** ciblée par les jeux et suivie en progression
  - `topic_id`, `level` (cm1/cm2/sixieme), `period` (1-5 ou null/all), `description`, `code` stable
- **TransversalSkill** — les 6 compétences majeures (Chercher, Modéliser, Représenter, Raisonner, Calculer, Communiquer), rattachées à l'ensemble du cycle

### Mini-jeux & progression
- **Game** — métadonnées d'un mini-jeu (titre, type, illustration, technologie : pixijs/dom)
- **GameVariant** — variante d'un jeu pour un niveau ou une difficulté donnée (un même Game peut avoir plusieurs Variants progressives sur les niveaux du cycle)
- **GameObjectiveLink** — table pivot Game ↔ LearningObjective (un jeu peut couvrir plusieurs objectifs)
- **GameSession** — une partie jouée par un enfant (durée, score, complétion)
- **ObjectiveProgress** — état d'acquisition d'un objectif par un enfant (`not_started` / `in_progress` / `mastered`, dernière mise à jour, nombre d'essais)

### Gamification
- **XPLedger** — historique des gains d'XP
- **Avatar / Inventory** — cosmétiques débloqués
- **Collection / Card** — cartes/mascottes à collectionner
- **Reward** — récompense réelle paramétrée par un parent (ex : « 100 étoiles = sortie au parc »)
- **RewardClaim** — réclamation d'une récompense par un enfant (à valider parent)

---

## 8. Roadmap macro

### Phase 0 — Cadrage (en cours)
- ✅ Vision et stack
- ⏳ Récupération des programmes scolaires officiels (MCP data.gouv)
- ⏳ Validation du modèle de données

### Phase 1 — Fondations
- ✅ Init du projet Laravel 13 (backend/) + Filament v5 + Laravel Boost
- ✅ Init du projet Angular 21 (frontend/) avec SSR
- ✅ Monorepo git unifié, remote GitHub `PierreBultez/kid-school`
- ✅ Schéma de base du référentiel pédagogique (6 tables : cycles, disciplines, domains, topics, learning_objectives, transversal_skills)
- ✅ Seeder YAML idempotent → 78 objectifs cycle 3 maths en base
- ✅ Back-office Filament complet pour naviguer/éditer le référentiel
- ✅ Auth famille + profils enfants (Sanctum SPA + Fortify headless, rôles admin/parent/enfant)
- ✅ Sélection de profil enfant style Netflix, CRUD enfants côté parent
- ✅ Lockdown admin Filament (FilamentUser + canAccessPanel)
- ⏳ Squelette dashboard parent (vue progression)

### Phase 2 — Premier mini-jeu
- ✅ Choix PixiJS (v8)
- ✅ Domaine métier jeux : `games`, `game_sessions`, `objective_progress` (+ placeholders SM-2 / Elo)
- ✅ 1er mini-jeu PixiJS complet : **Chasse à la symétrie** (objectif CY3-MAT-EGE-SYM-CM1-01)
- ✅ Suivi de progression par objectif (formule EWMA v1, α=0.30)
- ⏳ XP et étoiles (brique gamification)

### Phase 3 — Gamification & 2 jeux supplémentaires
- 2 mini-jeux additionnels (fractions, géométrie)
- Avatar évolutif, collection
- Récompenses parent paramétrables

### Phase 4 — Polish
- PWA / hors-ligne
- Accessibilité WCAG 2.1 AA
- Audit sécurité OWASP
- Onboarding parent

### Phase 5 — Bêta fermée
- 5 à 10 familles testeuses
- Itérations sur retours

---

## 9. Directives de développement

### Pour l'humain et l'IA assistante
- **Scope discipline** : ne pas élargir le périmètre MVP sans décision explicite. Tout ce qui n'est pas dans la section 3 attend.
- **Pédagogie d'abord** : toute fonctionnalité doit pouvoir être justifiée pédagogiquement, pas seulement techniquement.
- **Données enfants = priorité absolue** : aucun raccourci sur la conformité RGPD/sécurité.
- **Apprentissage technique assumé** : ce projet sert aussi à l'apprentissage Angular ; privilégier les patterns modernes (signals, standalone, resource API) plutôt que les habitudes legacy.
- **Itérations courtes** : livrer petit, montrer, ajuster.
- **Tests** : au minimum tests Feature côté Laravel sur les endpoints critiques (auth, progression). Tests Angular sur les services et composants à logique non triviale.
- **Documentation** : tout choix d'architecture non évident est consigné dans `docs/adr/` (Architecture Decision Records courts).

### Conventions
- Commits : Conventional Commits (`feat:`, `fix:`, `chore:`...).
- Branche principale : `main`. Travail en branches feature.
- PHP : PSR-12 + Laravel Pint.
- TypeScript : ESLint + Prettier, mode strict activé.
- Nommage en **anglais** dans le code, **français** dans l'UI et les contenus pédagogiques.

---

## 10. Questions ouvertes à trancher

- [x] ~~Monorepo (backend/ + frontend/) ou deux repos distincts ?~~ → **Monorepo**
- [x] ~~PixiJS vs Phaser 3 pour les mini-jeux ?~~ → **PixiJS**
- [x] ~~Postgres self-hosted sur VPS ou OVH Cloud Database managé ?~~ → **Self-hosted sur le VPS** (⚠️ prévoir backups automatisés hors-VPS dès le départ)
- [x] ~~Modèle économique cible ?~~ → **Gratuit / bêta fermée en V1**
- [x] ~~Version de Filament ?~~ → **Filament v5**
- [x] ~~Source officielle pour le référentiel des compétences ?~~ → **MCP data.gouv** (source unique)

---

## 11. État d'avancement (2026-04-08)

### ✅ Acquis
1. ~~Explorer le MCP data.gouv pour les programmes officiels~~ → BO uniquement disponible en PDF, pas de référentiel structuré.
2. ~~Décider de la structure repo~~ → monorepo.
3. ~~Référentiel maths Cycle 3 extrait~~ → fidèle au PDF Eduscol des « Repères annuels de progression » (`backend/database/data/referentiel/cycle3/mathematiques.yaml`).
4. ~~Pivoter le scope MVP vers le cycle complet (CM1+CM2+6e)~~.
5. ~~Monorepo initialisé~~ → `backend/` (Laravel 13 + Filament v5 + Laravel Boost) et `frontend/` (Angular 21 avec SSR). Remote GitHub : `PierreBultez/kid-school`.
6. ~~Migrations du référentiel pédagogique~~ → 6 tables relationnelles avec FK, index composites uniques, et CHECK constraints Postgres garantissant la cohérence `period_mode` / `period`.
7. ~~Modèles Eloquent~~ → `Cycle`, `Discipline`, `Domain`, `Topic`, `LearningObjective`, `TransversalSkill` avec relations `belongsTo`/`hasMany` câblées.
8. ~~Seeder YAML idempotent~~ → `ReferentielCycle3MathSeeder` via Symfony YAML. Peuple 1 cycle + 1 discipline + 3 domaines + 22 topics + 78 objectifs + 6 compétences transversales. Rejouable via `updateOrCreate()`.
9. ~~Back-office Filament v5 complet~~ → 6 ressources groupées sous « Référentiel » avec :
   - Formulaires avec `Select` relationnels, `Section`s groupées, champs conditionnels (`live()` + `visible()`) sur `period_mode`/`period`.
   - Hook `mutateFormDataBeforeSave`/`BeforeCreate` pour garantir la cohérence avant persistance (défense en profondeur avec le CHECK DB).
   - Tables avec colonnes relationnelles (`cycle.name`), badges colorés par niveau, filtres `SelectFilter`, tooltips sur descriptions longues.
   - Tri du menu via `$navigationSort` pour suivre la hiérarchie pédagogique.
10. ~~Auth & familles~~ → Sanctum SPA + Fortify headless, `families` / `children`, rôles `admin`/`parent`/`child`, consentement RGPD tracé, `active_child_id` sur `users` (pas en session pour éviter un bug de middleware empilé), policies, tests Pest. Admin Filament verrouillé via `FilamentUser::canAccessPanel` (admin only).
11. ~~Angular SPA (bootstrap & features)~~ → structure `core`/`features`, guard d'auth, `ApiService` branché sur Sanctum (cookie XSRF), écrans login/register, CRUD enfants, **profile picker Netflix** (`/profiles`), route `/play` lazy-loadée, Tailwind v4.
12. ~~Domaine métier jeux~~ → tables `games`, `game_learning_objective`, `game_sessions`, `objective_progress`. La table de progression porte déjà les colonnes placeholders **SM-2** (`sm2_ease_factor`, `sm2_interval_days`, `sm2_repetitions`, `sm2_due_at`) et **Elo** (`elo_rating`), nullables, pour pouvoir brancher ces algos plus tard sans migration lourde. Formule courante **EWMA v1** : `mastery = 0.30 × value + 0.70 × previous` encapsulée dans `ObjectiveProgress::recordAnswer()` — c'est le **seul point d'extension** quand on passera à SM-2/Elo.
13. ~~API jeux~~ → endpoints `GET /api/games` (filtre par niveau via map `GRADE_ORDER` PHP pour éviter le tri alphabétique SQL buggé `'6EME' < 'CM1'`), `GET /api/games/{slug}`, `POST /api/game-sessions`, `POST /api/game-sessions/{id}/answer`, `POST /api/game-sessions/{id}/finish`. Middleware `child.selected` garantit qu'un enfant est actif. Tests Feature Pest : liste, 409 sans enfant actif, run complet avec vérif mastery, interdiction cross-child.
14. ~~Premier mini-jeu PixiJS : **Chasse à la symétrie**~~ → cible l'objectif `CY3-MAT-EGE-SYM-CM1-01` (« Reconnaître qu'une figure possède un ou plusieurs axes de symétrie »). 12 figures thématiques dessinées en Pixi v8 (6 symétriques : papillon/cœur/fleur/sapin/maison/étoile, 6 asymétriques : éclair/virgule/F/G/poisson/tourbillon), sessions de 10 questions équilibrées, feedback immédiat, score avec emoji. Bootstrap Pixi via `afterNextRender` pour éviter la race condition sur le canvas host.

### ⏳ Prochaines étapes — dans cet ordre

Voir aussi `docs/sessions/2026-04-08-games-and-pixi.md` pour le détail de la session et `docs/NEXT-STEPS.md` pour la file d'attente complète.

#### ~~Étape 1 — Auth & familles~~ ✅ terminée

#### ~~Étape 2 — Angular SPA~~ ✅ terminée

#### ~~Étape 3 — Domaine jeux + 1er mini-jeu~~ ✅ terminée

#### Étape 4 — Gamification minimale & dashboard parent (à venir)
Voir `docs/NEXT-STEPS.md`.

---

### Archive — étapes terminées (détail historique)

#### Étape 1 — Auth & familles (socle utilisateur)
**Pourquoi en premier :** sans notion d'enfant et de famille, impossible de rattacher de la progression, donc impossible d'avancer sur le cœur métier.

Tâches :
- Étendre `User` Laravel pour distinguer rôles (`admin`, `parent`).
- Table `families` (une famille = un foyer).
- Table `children` / `child_profiles` (rattachés à une famille, portent `school_year`, `avatar`, `display_name`, `pin_code` optionnel).
- Ressources Filament pour gérer les familles côté admin.
- Mise en place **Laravel Sanctum** pour l'auth API (token-based) côté futur front Angular.
- Intégrer dès le départ les contraintes **RGPD** : soft delete / hard delete en cascade, export des données d'un enfant, consentement parental explicite tracé.
- Policies Laravel : un parent ne voit que sa famille, un enfant ne voit que son propre profil.

#### Étape 2 — Angular side (premiers pas front)
**Pourquoi ensuite :** après la grosse phase Laravel, basculer sur Angular permet de casser la monotonie et de se familiariser avec le framework sur une base concrète et stable. Ça force aussi à finaliser proprement l'API REST côté back.

Tâches :
- Audit rapide de `frontend/` (structure Angular 21, routing, configuration SSR).
- Configuration Tailwind (cohérence avec Filament).
- Service `ApiService` qui attaque Laravel via `fetch`/`HttpClient`, gestion du token Sanctum.
- Écran de login parent (Reactive Forms, signals pour l'état).
- Première page protégée : **lecture seule du référentiel pédagogique** (liste des domaines → topics → objectifs, filtrable par niveau). Aucune logique métier, juste un consommateur d'API — l'objectif est de mettre en place les fondations Angular (routing, guards, services, composants standalone, signals, pipes).
- Mise en place d'ESLint + Prettier stricts.

#### Étape 3 — Progression & jeux (cœur métier)
**Pourquoi en dernier :** c'est le plus gros morceau et il suppose qu'un enfant est identifié (étape 1) et qu'il y a un client front fonctionnel (étape 2).

Tâches :
- Table `games` (métadonnées) + `game_variants` (difficulté/niveau).
- Table pivot `game_objective_links` (Game ↔ LearningObjective N↔N).
- Table `game_sessions` (une partie : enfant, jeu, score, durée, timestamps).
- Table `objective_progress` (état d'acquisition d'un objectif par enfant : `not_started` / `in_progress` / `mastered`, nombre d'essais, dernière MAJ).
- Endpoints API Laravel pour démarrer une session, poser un état, incrémenter la progression.
- Premier mini-jeu PixiJS intégré dans Angular (calcul mental, 3 niveaux de difficulté).
- Brique de gamification minimale : XP gagné à la fin d'une session.

### Hors roadmap mais à ne pas oublier
- Faire relire le YAML par un enseignant pour valider la fidélité Eduscol.
- Mettre en place une CI GitHub Actions (tests Pest backend + tests Angular + lint).
- Sentry + PostHog quand la bêta approche.

---

## 12. Procédure d'extraction des référentiels officiels

Cette procédure s'applique à **toute matière** et **tout cycle** qu'on souhaitera ajouter (français cycle 3, sciences cycle 3, maths cycle 2, etc.).

### Les deux sources officielles, complémentaires

Le contenu pédagogique officiel français pour le primaire est partagé entre **deux documents**, qu'il faut **toujours croiser** :

| Source | Couvre | Format | Où la trouver |
|---|---|---|---|
| **BO** (Bulletin Officiel) | Programme par **cycle** : attendus de fin de cycle, compétences travaillées, repères de progressivité généraux | PDF | Dataset data.gouv `5cb9484d9ce2e7573ebc8895` (« Programmes d'enseignement du premier degré ») |
| **Eduscol — Repères annuels de progression** | **Découpage par année** (CM1/CM2/6e pour cycle 3) et souvent par **période scolaire (1-5)** | PDF | Site Eduscol — non exposé sur data.gouv, à récupérer manuellement |

⚠️ **Le BO ne distingue pas les années** à l'intérieur d'un cycle. Si on n'utilisait que lui, on serait obligé d'inventer la répartition par classe. **Eduscol comble ce trou**, et c'est lui qui sert de **source primaire** pour la structure du YAML. Le BO sert de **source légale citée** et fournit les attendus de fin de cycle et les compétences transversales.

### Procédure standard

#### 1. Identifier le BO officiel via le MCP data.gouv

Interroger le dataset `5cb9484d9ce2e7573ebc8895` ou `56c3320688ee384f7cf5c75a` :
- Filtrer `Niveau d'enseignement` (cycle 2, cycle 3...)
- Filtrer `Discipline` quand disponible
- Filtrer `Abrogé à la rentrée` = `-` (programmes en vigueur uniquement)
- Récupérer l'URL du PDF dans la colonne `Contenu`

#### 2. Récupérer le document Eduscol des Repères annuels

Le document Eduscol des « Repères annuels de progression » est publié par discipline et par cycle. Il n'est pas sur data.gouv : se rendre sur https://eduscol.education.gouv.fr et chercher *« Repères annuels de progression <cycle> <discipline> »*.

Exemple cycle 3 maths : https://eduscol.education.gouv.fr/sites/default/files/document/23-maths-c3-reperes-eduscol1114753pdf-74667.pdf

#### 3. Stocker les deux PDF dans le repo

```
docs/sources/<cycle>-bo-<année>.pdf
docs/sources/<cycle>-eduscol-reperes-<discipline>.pdf
```

Exemple :
- `docs/sources/cycle3-bo-2020.pdf`
- `docs/sources/cycle3-eduscol-reperes-maths.pdf`

Ces fichiers sont **versionnés avec le code** et constituent la trace citable de notre référentiel.

#### 4. Saisir le référentiel en YAML

Créer un fichier :
```
backend/database/data/referentiel/<cycle>/<discipline>.yaml
```

**Structure obligatoire** (voir `cycle3/mathematiques.yaml` comme modèle) :

```yaml
cycle: cycle3
discipline: mathematiques
levels: [cm1, cm2, sixieme]   # niveaux scolaires couverts par le cycle
sources:
  - kind: bo
    reference: "Arrêté du ...
    pdf: docs/sources/...
    pages: "..."
  - kind: eduscol
    reference: "Repères annuels de progression ..."
    pdf: docs/sources/...
    pages: "..."

transversal_skills: [...]  # depuis le BO

domains:
  - code: NCA
    name: Nombres et calculs
    end_of_cycle_expectations: [...]  # depuis le BO
    topics:
      - code: NCA-ENT
        name: Les nombres entiers
        cycle_note: "..."  # optionnel, citation Eduscol "tout au long du cycle"
        learning_objectives:
          - code: CY3-MAT-NCA-ENT-CM1-01
            level: cm1
            period: 2          # 1..5 ou null ou "all"
            description: "..." # citation/reformulation Eduscol
```

**Règles de codage :**
- Codes `LearningObjective` : `<CYCLE>-<DISCIPLINE>-<DOMAIN>-<TOPIC>-<LEVEL>-<NN>` (stables, jamais réutilisés).
- Description : reformulation **fidèle** d'Eduscol. En cas de doute, citer mot pour mot.
- `period` : entier 1..5 quand Eduscol précise « dès la période 2 », `"all"` quand Eduscol dit « tout au long de l'année », `null` sinon.
- `level` : utiliser les clés `cm1`, `cm2`, `sixieme` (jamais `6e` qui pose des soucis de parsing YAML).
- Si Eduscol ne décline pas un thème pour un niveau (case vide dans le tableau), **ne pas inventer** d'objectif pour ce niveau.

#### 5. Versionnement et seeding

- YAML commité dans Git → traçable, reviewable.
- Seeder Laravel lit les YAML et peuple `cycles`, `disciplines`, `domains`, `topics`, `learning_objectives`, `transversal_skills`.
- Modification = PR, jamais d'édition directe en base de prod.
- Quand un BO ou un Eduscol change : remplacer le PDF, incrémenter une version dans l'en-tête YAML, prévoir une migration de données pour les `ObjectiveProgress` enfants déjà enregistrées (mapper l'ancien code → le nouveau).

### Référentiels actuellement intégrés

| Cycle | Discipline | Fichier YAML | Sources officielles |
|---|---|---|---|
| Cycle 3 | Mathématiques | `backend/database/data/referentiel/cycle3/mathematiques.yaml` | BO arrêté 17-7-2020 (`docs/sources/cycle3-bo-2020.pdf`, p. 90-98) + Eduscol Repères annuels (`docs/sources/cycle3-eduscol-reperes-maths.pdf`) |
