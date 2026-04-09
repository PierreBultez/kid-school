import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth.service';
import { Game, GameSession, GamesService } from '../../../core/games.service';
import { MirrorGame } from './game/mirror-game';
import type { PuzzleLevel } from './game/puzzles';

const PUZZLES_PER_SESSION = 10;

interface LevelOption {
  level: PuzzleLevel;
  label: string;
  grade: string;
  description: string;
}

const LEVELS: readonly LevelOption[] = [
  {
    level: 'cm1',
    label: 'CM1',
    grade: 'CM1',
    description: 'Figures simples, axe sur une colonne',
  },
  {
    level: 'cm2',
    label: 'CM2',
    grade: 'CM2',
    description: 'Grilles plus grandes, axe entre deux colonnes',
  },
  {
    level: 'sixieme',
    label: '6ème',
    grade: '6EME',
    description: 'Grilles larges, motifs complexes',
  },
];

interface FinalResult {
  perfect: number;
  completed: number;
  total: number;
}

type Phase = 'choosing' | 'loading' | 'playing' | 'finished';

@Component({
  selector: 'app-symmetry-spotter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section
      class="relative min-h-screen bg-slate-950 text-white
             bg-[radial-gradient(ellipse_at_top,_#312e81_0%,_#0f172a_55%)]
             px-4 py-6 sm:px-8"
    >
      <header class="mx-auto mb-6 flex max-w-3xl items-center justify-between">
        <a
          routerLink="/play"
          class="inline-flex items-center gap-2 rounded-full border border-white/20
                 bg-white/5 px-4 py-2 text-sm font-medium text-white/80
                 transition hover:bg-white/10 hover:text-white
                 focus:outline-none focus:ring-2 focus:ring-amber-300
                 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          <span aria-hidden="true">&larr;</span>
          Quitter
        </a>
        <h1
          class="bg-gradient-to-r from-amber-200 via-pink-200 to-indigo-200
                 bg-clip-text text-center text-xl font-black tracking-tight
                 text-transparent sm:text-3xl"
        >
          Le Miroir Magique
        </h1>
        <div class="w-[88px]"></div>
      </header>

      <div class="mx-auto max-w-3xl">
        <!-- PHASE: Level picker -->
        @if (phase() === 'choosing') {
          <div
            class="rounded-3xl border border-white/10 bg-white/5 p-8
                   text-center shadow-2xl backdrop-blur sm:p-10"
          >
            <h2 class="mb-2 text-2xl font-bold text-white sm:text-3xl">
              Choisis ton niveau
            </h2>
            <p class="mb-8 text-white/60">
              Complète les figures en cliquant sur les cases miroir.
            </p>

            <div class="mx-auto grid max-w-lg gap-4">
              @for (opt of levelOptions; track opt.level) {
                <button
                  type="button"
                  (click)="pickLevel(opt.level)"
                  class="group relative rounded-2xl border-2 p-5 text-left
                         transition-all duration-200
                         focus:outline-none focus:ring-2 focus:ring-amber-300
                         focus:ring-offset-2 focus:ring-offset-slate-950"
                  [class]="opt.level === recommendedLevel()
                    ? 'border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-400/10'
                    : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'"
                >
                  <div class="flex items-center gap-4">
                    <span
                      class="flex h-12 w-12 shrink-0 items-center justify-center
                             rounded-xl text-lg font-black"
                      [class]="opt.level === recommendedLevel()
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-white/10 text-white/80'"
                    >
                      {{ opt.label }}
                    </span>
                    <div>
                      <p class="font-semibold text-white">
                        {{ opt.description }}
                      </p>
                      @if (opt.level === recommendedLevel()) {
                        <p class="mt-0.5 text-sm font-medium text-amber-300">
                          Ton niveau
                        </p>
                      }
                    </div>
                  </div>
                </button>
              }
            </div>
          </div>
        }

        <!-- PHASE: Loading -->
        @if (phase() === 'loading') {
          <div
            class="flex h-[720px] items-center justify-center rounded-3xl
                   border border-white/10 bg-white/5 backdrop-blur"
          >
            <div class="text-center">
              <div
                class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full
                       border-4 border-amber-300/30 border-t-amber-300"
                aria-hidden="true"
              ></div>
              <p class="text-white/70">Préparation du miroir…</p>
            </div>
          </div>
        }

        <!-- PHASE: Finished -->
        @if (phase() === 'finished') {
          @if (finalResult(); as result) {
            <div
              class="rounded-3xl border border-white/10 bg-white/5 p-10
                     text-center shadow-2xl backdrop-blur"
            >
              <div class="mb-4 text-6xl" aria-hidden="true">{{ endEmoji() }}</div>
              <h2 class="mb-2 text-3xl font-black text-white">{{ endTitle() }}</h2>
              <p class="mb-6 text-lg text-white/80">
                Tu as réussi
                <strong class="text-amber-300">{{ result.perfect }}</strong>
                puzzles parfaits sur
                <strong class="text-amber-300">{{ result.total }}</strong>.
              </p>
              <div
                class="mx-auto mb-8 flex max-w-xs items-center justify-center gap-2
                       text-4xl"
                aria-label="Score sur 3 étoiles"
              >
                @for (i of [0, 1, 2]; track i) {
                  <span
                    [class.opacity-20]="i >= starCount()"
                    class="transition-transform duration-300 hover:scale-110"
                  >
                    ★
                  </span>
                }
              </div>
              <div class="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  (click)="replay()"
                  class="rounded-full bg-gradient-to-r from-amber-400 to-pink-500
                         px-6 py-3 font-bold text-slate-950 shadow-lg
                         transition hover:scale-105
                         focus:outline-none focus:ring-2 focus:ring-amber-300
                         focus:ring-offset-2 focus:ring-offset-slate-950"
                >
                  Rejouer
                </button>
                @if (nextLevel(); as next) {
                  <button
                    type="button"
                    (click)="pickLevel(next.level)"
                    class="rounded-full bg-gradient-to-r from-indigo-500 to-violet-500
                           px-6 py-3 font-bold text-white shadow-lg
                           transition hover:scale-105
                           focus:outline-none focus:ring-2 focus:ring-indigo-300
                           focus:ring-offset-2 focus:ring-offset-slate-950"
                  >
                    Niveau {{ next.label }}
                  </button>
                }
                <button
                  type="button"
                  (click)="backToLevels()"
                  class="rounded-full border border-white/20 bg-white/5 px-6 py-3
                         font-semibold text-white/80 transition hover:bg-white/10
                         hover:text-white
                         focus:outline-none focus:ring-2 focus:ring-amber-300
                         focus:ring-offset-2 focus:ring-offset-slate-950"
                >
                  Changer de niveau
                </button>
                <a
                  routerLink="/play"
                  class="rounded-full border border-white/20 bg-white/5 px-6 py-3
                         font-semibold text-white/80 transition hover:bg-white/10
                         hover:text-white
                         focus:outline-none focus:ring-2 focus:ring-amber-300
                         focus:ring-offset-2 focus:ring-offset-slate-950"
                >
                  Autres jeux
                </a>
              </div>
            </div>
          }
        }

        <!-- Canvas host: visible only during playing phase -->
        <div
          #canvasHost
          class="mx-auto flex justify-center"
          [class.hidden]="phase() !== 'playing'"
        ></div>

        @if (phase() === 'playing') {
          <p class="mt-6 text-center text-sm text-white/60">
            Clique sur les cases qui complètent la figure par symétrie autour du rayon doré.
          </p>
        }

        @if (error()) {
          <p
            class="mt-6 rounded-2xl border border-red-400/40 bg-red-500/10 p-4
                   text-center text-sm text-red-200"
            role="alert"
          >
            {{ error() }}
          </p>
        }
      </div>
    </section>
  `,
})
export class SymmetrySpotterComponent {
  protected readonly levelOptions = LEVELS;

  private readonly authService = inject(AuthService);
  private readonly gamesService = inject(GamesService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly canvasHost = viewChild<ElementRef<HTMLDivElement>>('canvasHost');

  protected readonly phase = signal<Phase>('choosing');
  protected readonly error = signal<string | null>(null);
  protected readonly finalResult = signal<FinalResult | null>(null);
  private readonly selectedLevel = signal<PuzzleLevel>('cm1');

  private game: Game | null = null;
  private session: GameSession | null = null;
  private mirrorGame: MirrorGame | null = null;

  private static readonly GRADE_TO_LEVEL: Record<string, PuzzleLevel> = {
    CM1: 'cm1',
    CM2: 'cm2',
    '6EME': 'sixieme',
  };

  /** The child's grade mapped to a puzzle level — used to highlight "ton niveau". */
  protected readonly recommendedLevel = computed<PuzzleLevel>(() => {
    const grade = this.authService.currentUser()?.active_child?.grade_level;
    return SymmetrySpotterComponent.GRADE_TO_LEVEL[grade ?? ''] ?? 'cm1';
  });

  /** Next level after the one just played, if any. */
  protected readonly nextLevel = computed<LevelOption | null>(() => {
    const current = this.selectedLevel();
    const idx = LEVELS.findIndex((l) => l.level === current);
    return idx >= 0 && idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
  });

  protected readonly starCount = computed(() => {
    const r = this.finalResult();
    if (!r) return 0;
    const ratio = r.perfect / r.total;
    if (ratio >= 0.9) return 3;
    if (ratio >= 0.6) return 2;
    if (ratio >= 0.3) return 1;
    return 0;
  });

  protected readonly endTitle = computed(() => {
    const s = this.starCount();
    if (s === 3) return 'Maître du miroir !';
    if (s === 2) return 'Bravo !';
    if (s === 1) return 'Bon début !';
    return 'Courage !';
  });

  protected readonly endEmoji = computed(() => {
    const s = this.starCount();
    if (s === 3) return '🏆';
    if (s === 2) return '🎉';
    if (s === 1) return '💪';
    return '🙂';
  });

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    afterNextRender(() => {
      void this.fetchGame();
    });
    this.destroyRef.onDestroy(() => {
      this.mirrorGame?.destroy();
      this.mirrorGame = null;
    });
  }

  /** Pre-fetch the game record so the level picker doesn't need to wait. */
  private async fetchGame(): Promise<void> {
    try {
      this.game = await firstValueFrom(this.gamesService.get('symmetry-spotter'));
    } catch {
      this.error.set('Impossible de charger le jeu. As-tu sélectionné un profil ?');
      setTimeout(() => this.router.navigateByUrl('/play'), 1200);
    }
  }

  protected async pickLevel(level: PuzzleLevel): Promise<void> {
    this.selectedLevel.set(level);
    this.finalResult.set(null);
    this.phase.set('loading');
    this.error.set(null);
    try {
      if (!this.game) {
        this.game = await firstValueFrom(this.gamesService.get('symmetry-spotter'));
      }
      this.session = await firstValueFrom(this.gamesService.startSession(this.game.id));
      // Let Angular render the canvasHost into the DOM before launching Pixi.
      setTimeout(() => void this.launchGame(), 0);
    } catch {
      this.phase.set('choosing');
      this.error.set('Impossible de lancer le jeu.');
    }
  }

  private async launchGame(): Promise<void> {
    const host = this.canvasHost()?.nativeElement;
    if (!host) return;

    this.mirrorGame?.destroy();

    this.mirrorGame = new MirrorGame({
      host,
      puzzleCount: PUZZLES_PER_SESSION,
      level: this.selectedLevel(),
      callbacks: {
        onAnswer: (correct) => this.handleAnswer(correct),
        onFinished: (result) => this.handleFinished(result),
      },
    });
    await this.mirrorGame.start();
    this.phase.set('playing');
  }

  private static readonly LEVEL_CODE_FRAGMENT: Record<PuzzleLevel, string> = {
    cm1: 'CM1',
    cm2: 'CM2',
    sixieme: '6E',
  };

  private handleAnswer(correct: boolean): void {
    if (!this.session || !this.game) return;
    const fragment =
      SymmetrySpotterComponent.LEVEL_CODE_FRAGMENT[this.selectedLevel()];
    const objective =
      this.game.learning_objectives.find((o) =>
        o.code.includes(`-${fragment}-`),
      ) ?? this.game.learning_objectives[0];
    if (!objective) return;
    this.gamesService
      .answer(this.session.id, objective.id, correct)
      .subscribe({ error: () => {} });
  }

  private handleFinished(result: FinalResult): void {
    this.finalResult.set(result);
    this.phase.set('finished');
    if (this.session) {
      this.gamesService
        .finish(this.session.id)
        .subscribe({ error: () => {} });
    }
  }

  /** Replay the same level. */
  protected async replay(): Promise<void> {
    await this.pickLevel(this.selectedLevel());
  }

  /** Go back to the level picker. */
  protected backToLevels(): void {
    this.mirrorGame?.destroy();
    this.mirrorGame = null;
    this.finalResult.set(null);
    this.phase.set('choosing');
  }
}
