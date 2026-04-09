# 🎓 kid-school

> Application web de soutien scolaire pour enfants du primaire, ludique et respectueuse, adossée aux programmes officiels de l'Éducation nationale.

<p align="center">
  <img alt="Laravel" src="https://img.shields.io/badge/Laravel-13-FF2D20?logo=laravel&logoColor=white">
  <img alt="Filament" src="https://img.shields.io/badge/Filament-v5-F59E0B?logo=php&logoColor=white">
  <img alt="Angular" src="https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white">
  <img alt="PixiJS" src="https://img.shields.io/badge/PixiJS-mini--jeux-E91E63?logo=javascript&logoColor=white">
  <img alt="Statut" src="https://img.shields.io/badge/statut-en%20développement-blue">
</p>

---

## ✨ L'idée

Une app pour **réviser en s'amusant**, pensée pour les enfants de **CM1, CM2 et 6ᵉ** (cycle 3), avec :

- des **mini-jeux** gamifiés construits sur PixiJS, progressifs sur les trois niveaux du cycle ;
- un **référentiel pédagogique fidèle aux programmes officiels** (BO + Eduscol), pas une soupe générique ;
- un **tableau de bord parent** clair, transparent, sans dark patterns ;
- un **cadre RGPD strict** parce qu'on parle de données de mineurs.

Le projet démarre avec les **maths cycle 3**. L'architecture est prévue dès le départ pour accueillir d'autres matières et d'autres cycles sans refonte.

---

## 🏗️ Architecture

Monorepo avec deux projets indépendants qui communiquent via API REST :

```
kid-school/
├── backend/          # Laravel 13 + Filament v5 + PostgreSQL 17
│   ├── app/
│   ├── database/
│   │   ├── migrations/
│   │   ├── seeders/
│   │   └── data/referentiel/    # YAML sources pédagogiques
│   └── ...
├── frontend/         # Angular 21 (standalone + signals + SSR)
├── docs/
│   └── sources/      # PDF officiels (BO + Eduscol) versionnés
└── PROJECT.md        # Cadrage produit & directives détaillées
```

### Stack

| Couche                  | Techno                                                      |
|-------------------------|-------------------------------------------------------------|
| Backend API             | Laravel 13 (PHP 8.4)                                        |
| Admin / back-office     | Filament v5                                                 |
| Frontend                | Angular 21 (standalone components, signals, SSR)            |
| Base de données         | PostgreSQL 17 (JSONB, CHECK constraints, index composites)  |
| Auth API                | Laravel Sanctum (à venir)                                   |
| Mini-jeux               | PixiJS                                                      |
| Cache / queues          | Redis                                                       |
| Hébergement cible       | VPS OVH France (self-hosted)                                |

---

## 📚 Référentiel pédagogique

Le cœur du projet : un **modèle relationnel fidèle aux programmes officiels**.

```
Cycle → Discipline → Domain → Topic → LearningObjective
                                      └─ level (cm1/cm2/sixieme)
                                      └─ period (1..5 | all | none)
                                      └─ description (Eduscol)
```

**Sources officielles versionnées dans `docs/sources/`** :
- Bulletin Officiel — Arrêté du 17-7-2020 (programme cycle 3)
- Eduscol — Repères annuels de progression cycle 3 maths

**Contenus actuellement chargés en base** (seeder YAML idempotent) :

| Table                | Lignes |
|----------------------|--------|
| `cycles`             | 1      |
| `disciplines`        | 1      |
| `domains`            | 3      |
| `topics`             | 22     |
| `learning_objectives`| 78     |
| `transversal_skills` | 6      |

Les contraintes **CHECK Postgres** garantissent la cohérence des données pédagogiques (`level` dans l'enum, cohérence `period_mode`/`period`) — impossible d'insérer un état invalide, même en bypassant l'app.

---

## 🚀 Démarrer en local

### Prérequis

- PHP 8.4+
- Composer
- Node 20+ et npm
- PostgreSQL 17 (une base `ecole` accessible en local)
- Redis (optionnel à ce stade)

### Backend

```bash
cd backend
cp .env.example .env
# éditer .env pour configurer la connexion Postgres
composer install
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

Back-office Filament : http://localhost:8000/admin

Pour créer un utilisateur admin :
```bash
php artisan make:filament-user
```

### Frontend

```bash
cd frontend
npm install
npm start
```

App Angular : http://localhost:4200

---

## 🗺️ Feuille de route

### ✅ Phase 0-1 — Cadrage & fondations

- Cadrage produit complet (voir [`PROJECT.md`](./PROJECT.md))
- Monorepo Laravel + Angular
- Référentiel pédagogique cycle 3 maths extrait, modélisé et seedé (78 objectifs)
- Back-office Filament v5 complet pour naviguer et éditer le référentiel
- Auth famille + profils enfants (Sanctum SPA + Fortify headless, RGPD, profile picker Netflix)
- Angular SPA : login/register, CRUD enfants, guards, services API

### ✅ Phase 2 — Domaine jeux & 1er mini-jeu

- Tables `games`, `game_sessions`, `objective_progress` (+ placeholders SM-2 / Elo)
- API jeux complète (sessions, answers, progression EWMA)
- **Le Miroir Magique** : mini-jeu interactif PixiJS v8 ciblant la symétrie axiale (CM1). 12 puzzles pixel-art, moteur modulaire (6 fichiers framework-agnostiques), animations riches, gameplay actif sans indice.

### ⏳ Phase 3 — Gamification & 2e jeu
XP, étoiles, dashboard parent, 2e mini-jeu (fractions ou calcul mental).

### ⏳ Phase 4 — Polish & bêta fermée
PWA, accessibilité WCAG 2.1 AA, audit OWASP, onboarding, 5-10 familles testeuses.

Détail complet : [`PROJECT.md`](./PROJECT.md)

---

## 🛡️ RGPD & éthique

Ce projet prend la protection des enfants au sérieux :

- **Hébergement 100 % Europe** (OVH France).
- **Pas de tracking publicitaire**, pas de cookies tiers.
- **Consentement parental explicite** avant toute création de profil enfant.
- **Droit à l'effacement** et **export des données** implémentés dès le départ.
- **Pas de dark patterns** : aucun timer anxiogène imposé, aucun streak punitif, aucune loot box.
- Cible d'accessibilité : **WCAG 2.1 AA**, police OpenDyslexic disponible, text-to-speech sur les consignes.

---

## 🤝 Contribuer

Le projet est personnel et en phase de démarrage, mais les retours pédagogiques (enseignants du primaire) sont particulièrement bienvenus — notamment pour valider la fidélité des référentiels YAML au programme Eduscol.

- Commits en [Conventional Commits](https://www.conventionalcommits.org/fr/)
- PHP formatté par Laravel Pint (`vendor/bin/pint`)
- TypeScript strict + ESLint + Prettier

---

## 📄 Licence

À définir. En attendant, tous droits réservés.

---

<p align="center">
  Made with ❤️ for kids, by a parent who happens to code.
</p>
