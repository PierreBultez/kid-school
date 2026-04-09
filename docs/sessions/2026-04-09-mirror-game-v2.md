# Session 2026-04-09 — Remplacement complet du mini-jeu « Chasse la symétrie » par « Le Miroir Magique » v2

Session focalisée sur un seul objectif : **remplacer intégralement le premier
mini-jeu PixiJS** (v1 = quiz oui/non sur des figures) par un jeu interactif
sur grille, visuellement riche, pédagogiquement plus exigeant, et exploitant
PixiJS v8 à plein.

## Contexte et motivation

Le jeu v1 « Chasse à la symétrie » présentait 12 figures (papillon, cœur,
éclair, etc.) et demandait « cette figure est-elle symétrique ? Oui / Non ».
Le gameplay était passif (deux boutons), le rendu visuel basique (figures
dessinées en coordonnées locales sur un canvas 400×400), et l'exercice ne
travaillait qu'un seul aspect de la symétrie (la reconnaissance).

L'objectif pédagogique `CY3-MAT-EGE-SYM-CM1-01` demande de « reconnaître
qu'une figure possède un ou plusieurs axes de symétrie » **et** de construire
mentalement le reflet. Un jeu de type « compléter la figure miroir » est
beaucoup plus riche sur le plan cognitif qu'un quiz binaire.

## Architecture du nouveau moteur

Tout le code jeu vit dans :
```
frontend/src/app/features/play/symmetry-spotter/game/
├── theme.ts          # constantes visuelles, palette, helpers couleur
├── puzzles.ts        # 12 puzzles pixel-art, parsing ASCII, validation
├── effects.ts        # tweens custom, shake, sparkBurst, easings
├── background.ts     # fond animé gradient + étoiles scintillantes
├── grid-board.ts     # plateau interactif (le coeur du jeu)
└── mirror-game.ts    # orchestrateur Pixi + HUD + flow de puzzles
```

Principes :
- **Framework-agnostique** : aucune dépendance Angular dans `game/`. Testable
  et réutilisable hors Angular.
- **Pas de GSAP** : système de tween maison léger (5 easings) branché sur le
  Ticker Pixi.
- **Pas de spritesheets** : tout est dessiné via `Graphics` + le système de
  couleurs du thème. Zéro asset externe → pas de latence de chargement.

### `theme.ts` — constantes centralisées

Canvas 640×720, HUD 96px en haut, zone de jeu 620px. Palette de 9 couleurs
indexées (1-9 : rouge, orange, jaune, vert, bleu, violet, rose, blanc,
magenta). Helpers `paletteColor(idx)`, `lighten(color, t)`, `darken(color, t)`,
`mixColor(a, b, t)`.

### `puzzles.ts` — les 12 puzzles

Chaque puzzle est une grille ASCII parsée au boot :
```
P_BUTTERFLY = { name: 'Papillon', axis: 'vertical', difficulty: 1,
  pattern: ['.V..Y..V.', ...] }
```

- `.` = case vide, `R/O/Y/G/B/V/P/W/M` = couleur palette.
- `assertSymmetric()` valide la symétrie de chaque grille au chargement du
  module (crash immédiat si un puzzle est mal dessiné).
- `splitCells(grid, axis)` détermine quelles cellules appartiennent au côté
  source (montrées) vs. cible (à compléter). Les cellules **sur** l'axe
  appartiennent à la source.
- `mirrorOf(r, c, rows, cols, axis)` renvoie les coordonnées du reflet.
- `buildPuzzleQueue(count)` trie par difficulté et sélectionne.

12 puzzles : Papillon, Coeur, Fleur, Etoile, Arbre, Maison, Cristal, Clé,
Couronne, Champignon, Lotus, Papillon arc-en-ciel. Mix d'axes verticaux et
horizontaux.

### `effects.ts` — animations

- 6 easings : `linear`, `outQuad`, `outCubic`, `outBack`, `outElastic`,
  `inOutSine`.
- `tween(ticker, opts)` : animation mono-valeur avec delay optionnel. Retourne
  un disposer.
- `tween2()` : deux valeurs simultanées.
- `shake(ticker, target, intensity, duration)` : tremblement sur Container.
- `sparkBurst(ticker, parent, x, y, opts)` : explosion de particules diamant
  avec gravité, couleur et direction paramétrables.
- `pulseAlpha(target, min, max, period)` : respiration.

### `background.ts` — fond animé

`MagicBackground` : 48 bandes horizontales interpolant un gradient
indigo→violet→rose. 90 étoiles 4 branches scintillantes avec phase et dérive.
Vignette sombre douce. Branché sur le Ticker.

### `grid-board.ts` — le plateau interactif

Classe `GridBoard`, le cœur du gameplay :
- **Layers** : `surfaceLayer` (fond arrondi + grille fine), `cellLayer`
  (cellules), `axisLayer` (faisceau + particules).
- **Cellules** : chaque cellule est un `Container` avec `ghost` (fond neutre)
  et `fill` (couleur peinte). Hit area `Rectangle` par cellule.
- **Source vs. target** : les cellules source sont préremplies avec la couleur.
  **Toutes les cellules target sont cliquables** de façon homogène — pas de
  marquage visuel. L'enfant doit identifier **par lui-même** quelles cellules
  sont le miroir d'une cellule colorée.
- **Axe de symétrie** : faisceau lumineux avec cœur blanc 3px + halo doré 14px
  + extensions 28px au-delà du plateau + end caps circulaires. Fade-in puis
  pulsation sinusoïdale douce.
- **Intro** : cascade `outBack` depuis l'axe vers les bords.
- **Hover** : scale 1.08 + bordure accent.
- **Clic correct** : pop élastique (`outElastic`) + sparks.
- **Clic incorrect** : flash rouge + shake du plateau entier.
- **Complétion** : célébration multi-burst + bob du plateau, puis callback.

### `mirror-game.ts` — orchestrateur

Classe `MirrorGame` :
- Initialise Pixi Application (640×720, transparent, antialias, autoDensity).
- Canvas responsive (`width: 100%`, `max-width: 640px`, `border-radius: 24px`,
  box-shadow violette).
- Construit le HUD : panneau semi-transparent avec titre du puzzle, compteur
  « Puzzle N / 10 », barre de progression segmentée (10 segments), score
  étoiles « ★ N ».
- Swap de puzzles : fade-out ancien board → destroy → incrémente index →
  fade-in nouveau board.
- Tracking : `completedCount` et `perfectCount` (puzzle sans aucune erreur).
- Fin de partie : 8 bursts de particules multicolores espacés de 140ms.
- Callbacks vers Angular : `onAnswer(perfect: boolean)`,
  `onFinished({completed, perfect, total})`.

## Intégration Angular

### `symmetry-spotter.component.ts` (réécrit)

- Standalone, `OnPush`, SSR-safe (`isPlatformBrowser` + `afterNextRender`).
- UI Tailwind : gradient radial `bg-[radial-gradient(ellipse_at_top,...)]`,
  titre "Le Miroir Magique" en gradient ambre-rose-indigo.
- 3 états : loading (spinner), playing (canvas), finished (carte résultat).
- Carte résultat : emoji + titre contextuel + nombre de puzzles parfaits +
  rating étoiles (3/2/1/0 selon ratio 90%/60%/30%) + boutons Rejouer / Autres
  jeux.
- `bootstrap()` : fetch game → start session → launch MirrorGame.
- `handleAnswer()` : POST silencieux vers l'API (continue même si erreur).
- `handleFinished()` : affiche les résultats + finish session.
- `restart()` : nouvelle session, re-crée le MirrorGame via `setTimeout` pour
  laisser Angular re-rendre le canvas host.
- Cleanup via `DestroyRef.onDestroy`.

### Routing

Route inchangée : `play/symmetry-spotter` sous `authGuard`.

## Fichiers supprimés

- `figures.ts` — les 12 figures v1 dessinées en Graphics (papillon, cœur,
  éclair, etc.). Remplacé par `puzzles.ts`.
- `symmetry-demo.component.ts` — composant temporaire de test visuel sans
  backend (route `/demo/mirror`). Créé puis supprimé dans la même session.

## Décisions de design notables

### Pédagogie : toutes les cellules target sont cliquables

La première itération affichait des marqueurs « fantôme » sur les cellules à
compléter. L'enfant n'avait qu'à cliquer les cases brillantes sans réfléchir.
On a supprimé tout indice visuel : **seul l'axe de symétrie guide le
raisonnement**. Le jeu passe de « click the glowing dots » à « construis
mentalement le reflet ».

### Axe de symétrie très visible

Après plusieurs itérations (bandes épaisses semi-transparentes → trop subtil
sur les cellules colorées), l'axe final est un faisceau fin mais lumineux :
cœur blanc opaque + halo doré + extensions au-delà du plateau. Il est toujours
lisible, même au-dessus des cellules les plus vives.

### Pas de timer

Conformément aux valeurs projet (pas de mécaniques anxiogènes), le jeu n'a
pas de chronomètre. L'enfant prend le temps qu'il veut. Le score est basé sur
la précision (puzzles parfaits = sans erreur), pas la vitesse.

### Pas de GSAP, pas d'assets externes

Le système de tween maison (~120 lignes) évite une dépendance lourde. Toutes
les formes sont dessinées en `Graphics` → zéro latence de chargement, pas de
gestion d'assets.

## Métriques build

- Chunk `symmetry-spotter-component` : **45.42 kB** raw / **14.32 kB** gzip.
- 2 warnings PixiJS (CommonJS : `@xmldom/xmldom`, `parse-svg-path`) — non
  corrigibles à notre niveau, impact nul.
- Build en 2.06 secondes.
