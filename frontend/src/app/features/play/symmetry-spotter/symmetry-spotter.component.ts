import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Application, Container, Graphics } from 'pixi.js';
import { firstValueFrom } from 'rxjs';
import { Game, GameSession, GamesService } from '../../../core/games.service';
import { Figure, buildQueue } from './figures';

const QUESTIONS_PER_SESSION = 10;
const CANVAS_SIZE = 400;

interface AnswerFeedback {
  correct: boolean;
  expected: boolean;
}

@Component({
  selector: 'app-symmetry-spotter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="mx-auto max-w-2xl p-6">
      <header class="mb-4 flex items-center justify-between">
        <h1 class="text-2xl font-bold">Chasse à la symétrie</h1>
        <a routerLink="/play" class="text-sm text-indigo-600 underline">Quitter</a>
      </header>

      @if (finished()) {
        <div class="rounded border p-6 text-center">
          <h2 class="mb-2 text-xl font-bold">Bravo !</h2>
          <p class="mb-4">
            Tu as eu <strong>{{ correctCount() }}</strong> bonnes réponses sur
            <strong>{{ QUESTIONS_PER_SESSION }}</strong>.
          </p>
          <p class="mb-6 text-3xl">{{ scoreEmoji() }}</p>
          <div class="flex justify-center gap-2">
            <button type="button" (click)="restart()"
                    class="rounded bg-indigo-600 px-4 py-2 text-white">
              Rejouer
            </button>
            <a routerLink="/play" class="rounded border px-4 py-2">Autres jeux</a>
          </div>
        </div>
      } @else {
        <div class="text-center">
          <p class="mb-2 text-sm text-gray-600">
            @if (loading()) {
              Chargement…
            } @else {
              Question {{ currentIndex() + 1 }} / {{ QUESTIONS_PER_SESSION }}
              — Score : {{ correctCount() }}
            }
          </p>
          <h2 class="mb-4 text-xl font-semibold">
            Cette figure est-elle symétrique ?
          </h2>

          <div #canvasHost
               class="mx-auto mb-4 inline-block rounded border bg-white"
               [style.width.px]="CANVAS_SIZE"
               [style.height.px]="CANVAS_SIZE"></div>

          @if (feedback(); as fb) {
            <p class="mb-4 text-lg font-bold"
               [class.text-green-600]="fb.correct"
               [class.text-red-600]="!fb.correct">
              {{ fb.correct ? 'Bonne réponse !' : 'Raté…' }}
              ({{ fb.expected ? 'Cette figure est symétrique' : "Cette figure n'est pas symétrique" }})
            </p>
          } @else if (!loading()) {
            <div class="flex justify-center gap-3">
              <button type="button" (click)="answer(true)" [disabled]="answering()"
                      class="rounded bg-green-600 px-6 py-3 text-lg text-white disabled:opacity-50">
                Oui
              </button>
              <button type="button" (click)="answer(false)" [disabled]="answering()"
                      class="rounded bg-red-600 px-6 py-3 text-lg text-white disabled:opacity-50">
                Non
              </button>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class SymmetrySpotterComponent {
  protected readonly QUESTIONS_PER_SESSION = QUESTIONS_PER_SESSION;
  protected readonly CANVAS_SIZE = CANVAS_SIZE;

  private readonly gamesService = inject(GamesService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly canvasHost = viewChild<ElementRef<HTMLDivElement>>('canvasHost');

  protected readonly loading = signal(true);
  protected readonly answering = signal(false);
  protected readonly currentIndex = signal(0);
  protected readonly correctCount = signal(0);
  protected readonly feedback = signal<AnswerFeedback | null>(null);
  private readonly pixiReady = signal(false);

  private game: Game | null = null;
  private session: GameSession | null = null;
  private queue: Figure[] = [];
  private app: Application | null = null;
  private figureLayer: Container | null = null;

  protected readonly finished = computed(
    () => this.currentIndex() >= QUESTIONS_PER_SESSION,
  );

  protected readonly scoreEmoji = computed(() => {
    const ratio = this.correctCount() / QUESTIONS_PER_SESSION;
    if (ratio >= 0.9) return '🌟🌟🌟';
    if (ratio >= 0.7) return '🌟🌟';
    if (ratio >= 0.5) return '🌟';
    return '💪';
  });

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // The canvas host div is always present in the playing branch (independent
    // of loading()), so afterNextRender fires once the view is in the DOM.
    afterNextRender(() => {
      void this.initPixi();
    });

    // Load game data in parallel.
    void this.loadGame();

    // Render the current figure whenever index, queue, or pixi readiness change.
    effect(() => {
      const idx = this.currentIndex();
      this.pixiReady();
      if (!this.app || !this.figureLayer || idx >= this.queue.length) {
        return;
      }
      this.drawFigure(this.queue[idx]);
    });
  }

  private async loadGame(): Promise<void> {
    try {
      this.game = await firstValueFrom(this.gamesService.get('symmetry-spotter'));
      this.session = await firstValueFrom(this.gamesService.startSession(this.game.id));
      this.queue = buildQueue(QUESTIONS_PER_SESSION);
      this.loading.set(false);
      // Force re-evaluation of the draw effect now that the queue exists.
      this.pixiReady.update((v) => v);
      if (this.app && this.queue[0]) {
        this.drawFigure(this.queue[0]);
      }
    } catch {
      this.loading.set(false);
      this.router.navigateByUrl('/play');
    }
  }

  private async initPixi(): Promise<void> {
    const target = this.canvasHost()?.nativeElement;
    if (!target) {
      return;
    }

    const app = new Application();
    await app.init({
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      backgroundColor: 0xffffff,
      antialias: true,
    });
    target.appendChild(app.canvas);

    const layer = new Container();
    layer.position.set(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    app.stage.addChild(layer);

    this.app = app;
    this.figureLayer = layer;
    this.pixiReady.set(true);

    if (this.queue[0]) {
      this.drawFigure(this.queue[0]);
    }
  }

  private drawFigure(figure: Figure): void {
    if (!this.figureLayer) {
      return;
    }
    this.figureLayer.removeChildren();
    const g = new Graphics();
    figure.draw(g);
    this.figureLayer.addChild(g);
  }

  protected async answer(saidYes: boolean): Promise<void> {
    if (this.answering() || !this.session || !this.game) {
      return;
    }
    this.answering.set(true);
    const figure = this.queue[this.currentIndex()];
    const correct = saidYes === figure.symmetric;

    const objectiveId = this.game.learning_objectives[0]?.id;
    if (!objectiveId) {
      this.answering.set(false);
      return;
    }

    try {
      await firstValueFrom(
        this.gamesService.answer(this.session.id, objectiveId, correct),
      );
      if (correct) {
        this.correctCount.update((c) => c + 1);
      }
      this.feedback.set({ correct, expected: figure.symmetric });

      setTimeout(() => {
        this.feedback.set(null);
        this.currentIndex.update((i) => i + 1);
        this.answering.set(false);

        if (this.currentIndex() >= QUESTIONS_PER_SESSION && this.session) {
          this.gamesService.finish(this.session.id).subscribe();
        }
      }, 1200);
    } catch {
      this.answering.set(false);
    }
  }

  protected async restart(): Promise<void> {
    if (!this.game) {
      return;
    }
    this.session = await firstValueFrom(this.gamesService.startSession(this.game.id));
    this.queue = buildQueue(QUESTIONS_PER_SESSION);
    this.currentIndex.set(0);
    this.correctCount.set(0);
    this.feedback.set(null);
    if (this.app && this.queue[0]) {
      this.drawFigure(this.queue[0]);
    }
  }
}
