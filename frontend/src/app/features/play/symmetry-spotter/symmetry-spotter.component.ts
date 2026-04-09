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

interface FinalResult {
  perfect: number;
  completed: number;
  total: number;
}

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
          <span aria-hidden="true">←</span>
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
        @if (loading()) {
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
        } @else if (finalResult(); as result) {
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
                (click)="restart()"
                class="rounded-full bg-gradient-to-r from-amber-400 to-pink-500
                       px-6 py-3 font-bold text-slate-950 shadow-lg
                       transition hover:scale-105
                       focus:outline-none focus:ring-2 focus:ring-amber-300
                       focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                Rejouer
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

        <div
          #canvasHost
          class="mx-auto flex justify-center"
          [class.hidden]="loading() || finalResult() !== null"
        ></div>

        @if (!loading() && finalResult() === null) {
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
  protected readonly PUZZLES_PER_SESSION = PUZZLES_PER_SESSION;

  private readonly authService = inject(AuthService);
  private readonly gamesService = inject(GamesService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly canvasHost = viewChild<ElementRef<HTMLDivElement>>('canvasHost');

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly finalResult = signal<FinalResult | null>(null);

  private game: Game | null = null;
  private session: GameSession | null = null;
  private mirrorGame: MirrorGame | null = null;
  private puzzleLevel: PuzzleLevel = 'cm1';

  private static readonly GRADE_TO_LEVEL: Record<string, PuzzleLevel> = {
    CM1: 'cm1',
    CM2: 'cm2',
    '6EME': 'sixieme',
  };

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
      void this.bootstrap();
    });
    this.destroyRef.onDestroy(() => {
      this.mirrorGame?.destroy();
      this.mirrorGame = null;
    });
  }

  private async bootstrap(): Promise<void> {
    try {
      // Determine the child's grade to select the right puzzle set.
      const grade = this.authService.currentUser()?.active_child?.grade_level;
      this.puzzleLevel = SymmetrySpotterComponent.GRADE_TO_LEVEL[grade ?? ''] ?? 'cm1';

      this.game = await firstValueFrom(this.gamesService.get('symmetry-spotter'));
      this.session = await firstValueFrom(this.gamesService.startSession(this.game.id));
      await this.launchGame();
      this.loading.set(false);
    } catch {
      this.loading.set(false);
      this.error.set('Impossible de lancer le jeu. As-tu sélectionné un profil ?');
      setTimeout(() => this.router.navigateByUrl('/play'), 1200);
    }
  }

  private async launchGame(): Promise<void> {
    const host = this.canvasHost()?.nativeElement;
    if (!host) return;

    // Clean previous instance if any.
    this.mirrorGame?.destroy();

    this.mirrorGame = new MirrorGame({
      host,
      puzzleCount: PUZZLES_PER_SESSION,
      level: this.puzzleLevel,
      callbacks: {
        onAnswer: (correct) => this.handleAnswer(correct),
        onFinished: (result) => this.handleFinished(result),
      },
    });
    await this.mirrorGame.start();
  }

  private static readonly LEVEL_CODE_FRAGMENT: Record<PuzzleLevel, string> = {
    cm1: 'CM1',
    cm2: 'CM2',
    sixieme: '6E',
  };

  private handleAnswer(correct: boolean): void {
    if (!this.session || !this.game) return;
    // Match the objective whose code contains the child's level fragment
    // (e.g. 'CY3-MAT-EGE-SYM-CM2-01' for CM2).
    const fragment = SymmetrySpotterComponent.LEVEL_CODE_FRAGMENT[this.puzzleLevel];
    const objective = this.game.learning_objectives.find((o) =>
      o.code.includes(`-${fragment}-`),
    ) ?? this.game.learning_objectives[0];
    if (!objective) return;
    this.gamesService
      .answer(this.session.id, objective.id, correct)
      .subscribe({
        error: () => {
          // Silent failure: the game continues even if the API hiccups.
        },
      });
  }

  private handleFinished(result: FinalResult): void {
    this.finalResult.set(result);
    if (this.session) {
      this.gamesService.finish(this.session.id).subscribe({
        error: () => {
          /* ignore */
        },
      });
    }
  }

  protected async restart(): Promise<void> {
    if (!this.game) return;
    this.finalResult.set(null);
    this.loading.set(true);
    try {
      this.session = await firstValueFrom(
        this.gamesService.startSession(this.game.id),
      );
      // Force Angular to render the canvasHost back into the DOM before we
      // re-create the Pixi game against it.
      setTimeout(async () => {
        await this.launchGame();
        this.loading.set(false);
      });
    } catch {
      this.loading.set(false);
      this.error.set('Impossible de redémarrer la session.');
    }
  }
}
