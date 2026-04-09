/**
 * Main orchestrator for the Mirror game.
 *
 * Owns the Pixi Application, swaps one GridBoard per puzzle, renders the HUD
 * (title + progress bar + score), and emits high-level events to the Angular
 * wrapper via the callbacks passed in.
 *
 * The class is framework-agnostic so it can be unit-tested or reused.
 */

import { Application, Container, Graphics, Text, type TextStyle } from 'pixi.js';
import { MagicBackground } from './background';
import { easings, sparkBurst, tween } from './effects';
import { GridBoard, type CellHitEvent } from './grid-board';
import { buildPuzzleQueue, type Puzzle, type PuzzleLevel } from './puzzles';
import { THEME } from './theme';

export interface MirrorGameCallbacks {
  /** Called after each puzzle click — correct is the overall puzzle-level correctness. */
  onAnswer: (correct: boolean) => void;
  /** Called once all puzzles are done. */
  onFinished: (result: { completed: number; perfect: number; total: number }) => void;
}

export interface MirrorGameOptions {
  host: HTMLElement;
  puzzleCount: number;
  /** Puzzle level filter. When omitted, uses the full catalogue. */
  level?: PuzzleLevel;
  callbacks: MirrorGameCallbacks;
}

interface HudElements {
  container: Container;
  title: Text;
  progressSegments: Graphics[];
  scoreText: Text;
  puzzleIndexText: Text;
}

export class MirrorGame {
  private app: Application | null = null;
  private background: MagicBackground | null = null;
  private hud: HudElements | null = null;
  private boardHost: Container | null = null;
  private currentBoard: GridBoard | null = null;

  private queue: Puzzle[] = [];
  private index = 0;
  private readonly puzzleCount: number;
  /** Number of puzzles fully completed (regardless of mistakes). */
  private completedCount = 0;
  /** Number of puzzles completed without a single mistake. */
  private perfectCount = 0;
  /** Mistakes in the current puzzle. */
  private currentMistakes = 0;
  /** Did the child already hit at least once correctly on this puzzle. */
  private currentHits = 0;

  private destroyed = false;

  constructor(private readonly opts: MirrorGameOptions) {
    this.puzzleCount = opts.puzzleCount;
  }

  async start(): Promise<void> {
    const { host } = this.opts;
    const app = new Application();
    await app.init({
      width: THEME.canvas.width,
      height: THEME.canvas.height,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    if (this.destroyed) {
      app.destroy(true, { children: true });
      return;
    }
    this.app = app;
    host.appendChild(app.canvas);
    app.canvas.style.display = 'block';
    app.canvas.style.width = '100%';
    app.canvas.style.height = 'auto';
    app.canvas.style.maxWidth = `${THEME.canvas.width}px`;
    app.canvas.style.borderRadius = '24px';
    app.canvas.style.boxShadow = '0 25px 60px -20px rgba(79, 70, 229, 0.5)';

    this.background = new MagicBackground(THEME.canvas.width, THEME.canvas.height);
    this.background.attach(app.ticker);
    app.stage.addChild(this.background.view);

    this.hud = this.buildHud();
    app.stage.addChild(this.hud.container);

    this.boardHost = new Container();
    this.boardHost.position.set(0, THEME.canvas.hudHeight);
    app.stage.addChild(this.boardHost);

    this.queue = buildPuzzleQueue(this.puzzleCount, this.opts.level);
    this.loadCurrent();
  }

  destroy(): void {
    this.destroyed = true;
    this.currentBoard?.destroy();
    this.currentBoard = null;
    this.background?.destroy();
    this.background = null;
    if (this.app) {
      const canvas = this.app.canvas;
      this.app.destroy(true, { children: true, texture: true });
      canvas?.parentElement?.removeChild(canvas);
      this.app = null;
    }
  }

  // --- HUD ------------------------------------------------------------------

  private buildHud(): HudElements {
    const container = new Container();
    const w = THEME.canvas.width;
    const hudH = THEME.canvas.hudHeight;

    // HUD background panel
    const panel = new Graphics();
    panel.roundRect(14, 14, w - 28, hudH - 18, 22).fill({
      color: 0x0f0a2e,
      alpha: 0.5,
    });
    panel.roundRect(14, 14, w - 28, hudH - 18, 22).stroke({
      color: THEME.colors.accent,
      width: 2,
      alpha: 0.3,
    });
    container.addChild(panel);

    const labelStyle: Partial<TextStyle> = {
      fontFamily:
        'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
      fontSize: 16,
      fontWeight: '500',
      fill: 0xc7d2fe,
    };
    const titleStyle: Partial<TextStyle> = {
      fontFamily:
        'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
      fontSize: 24,
      fontWeight: '700',
      fill: 0xffffff,
    };
    const scoreStyle: Partial<TextStyle> = {
      fontFamily:
        'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
      fontSize: 20,
      fontWeight: '700',
      fill: 0xfcd34d,
    };

    const title = new Text({ text: '', style: titleStyle });
    title.position.set(34, 20);
    container.addChild(title);

    const puzzleIndexText = new Text({
      text: `Puzzle 1 / ${this.puzzleCount}`,
      style: labelStyle,
    });
    puzzleIndexText.position.set(34, 52);
    container.addChild(puzzleIndexText);

    // Score label on the right
    const scoreText = new Text({ text: '★ 0', style: scoreStyle });
    scoreText.anchor.set(1, 0);
    scoreText.position.set(w - 34, 22);
    container.addChild(scoreText);

    const scoreLabel = new Text({ text: 'Étoiles', style: labelStyle });
    scoreLabel.anchor.set(1, 0);
    scoreLabel.position.set(w - 34, 52);
    container.addChild(scoreLabel);

    // Progress bar (segmented) spanning between the two label groups
    const progressSegments: Graphics[] = [];
    const barLeft = 200;
    const barRight = w - 140;
    const barTop = hudH - 28;
    const segGap = 4;
    const segW = (barRight - barLeft - segGap * (this.puzzleCount - 1)) / this.puzzleCount;
    const segH = 10;

    // Bar background
    const barBg = new Graphics();
    barBg.roundRect(barLeft - 6, barTop - 4, barRight - barLeft + 12, segH + 8, 8)
      .fill({ color: 0x000000, alpha: 0.25 });
    container.addChild(barBg);

    for (let i = 0; i < this.puzzleCount; i++) {
      const g = new Graphics();
      const x = barLeft + i * (segW + segGap);
      g.roundRect(x, barTop, segW, segH, 4).fill({
        color: 0xffffff,
        alpha: 0.12,
      });
      progressSegments.push(g);
      container.addChild(g);
    }

    return { container, title, progressSegments, scoreText, puzzleIndexText };
  }

  private updateHud(puzzle: Puzzle): void {
    if (!this.hud) return;
    const { title, puzzleIndexText } = this.hud;
    title.text = puzzle.name;
    puzzleIndexText.text = `Puzzle ${this.index + 1} / ${this.puzzleCount}`;
  }

  private fillProgressSegment(i: number, color: number): void {
    if (!this.hud) return;
    const seg = this.hud.progressSegments[i];
    if (!seg) return;
    // Re-draw with new color
    seg.clear();
    const barLeft = 200;
    const barRight = THEME.canvas.width - 140;
    const segGap = 4;
    const segW = (barRight - barLeft - segGap * (this.puzzleCount - 1)) / this.puzzleCount;
    const segH = 10;
    const barTop = THEME.canvas.hudHeight - 28;
    const x = barLeft + i * (segW + segGap);
    seg.roundRect(x, barTop, segW, segH, 4).fill({ color, alpha: 1 });

    // Tiny pop animation
    const app = this.app;
    if (!app) return;
    tween(app.ticker, {
      from: 0,
      to: 1,
      durationMs: 320,
      ease: easings.outBack,
      onUpdate: (v) => {
        const cy = barTop + segH / 2;
        const cx = x + segW / 2;
        seg.pivot.set(cx, cy);
        seg.position.set(cx, cy);
        seg.scale.set(0.6 + 0.4 * v, 0.6 + 0.4 * v);
      },
    });
  }

  private bumpScore(): void {
    if (!this.hud || !this.app) return;
    this.hud.scoreText.text = `★ ${this.perfectCount}`;
    const txt = this.hud.scoreText;
    tween(this.app.ticker, {
      from: 1.4,
      to: 1,
      durationMs: 420,
      ease: easings.outBack,
      onUpdate: (v) => txt.scale.set(v),
    });
  }

  // --- Puzzle flow ----------------------------------------------------------

  private loadCurrent(): void {
    if (!this.app || !this.boardHost) return;
    this.currentMistakes = 0;
    this.currentHits = 0;

    const puzzle = this.queue[this.index];
    this.updateHud(puzzle);

    const board = new GridBoard(
      {
        puzzle,
        maxWidth: THEME.canvas.width,
        maxHeight: THEME.canvas.boardHeight,
      },
      this.app.ticker,
      {
        onCellHit: (ev) => this.onCellHit(ev),
        onPuzzleComplete: () => this.onPuzzleComplete(),
      },
    );
    this.currentBoard = board;
    this.boardHost.addChild(board.view);

    // Fade-in the board layer
    board.view.alpha = 0;
    tween(this.app.ticker, {
      from: 0,
      to: 1,
      durationMs: 300,
      ease: easings.outCubic,
      onUpdate: (v) => {
        board.view.alpha = v;
      },
    });
  }

  private onCellHit(ev: CellHitEvent): void {
    if (ev.correct) {
      this.currentHits++;
    } else {
      this.currentMistakes++;
    }
  }

  private onPuzzleComplete(): void {
    // Puzzle finished
    const perfect = this.currentMistakes === 0;
    this.completedCount++;
    if (perfect) this.perfectCount++;

    // Notify Angular wrapper: each puzzle counts as one "answer" in the API.
    this.opts.callbacks.onAnswer(perfect);

    // Update progress bar segment
    this.fillProgressSegment(
      this.index,
      perfect ? THEME.colors.ok : THEME.colors.axis,
    );
    this.bumpScore();

    const isLast = this.index >= this.queue.length - 1;
    const oldBoard = this.currentBoard;
    const app = this.app;
    if (!app) return;

    // Fade out the current board, then swap.
    tween(app.ticker, {
      from: 1,
      to: 0,
      durationMs: 350,
      delayMs: 420,
      ease: easings.outQuad,
      onUpdate: (v) => {
        if (oldBoard) oldBoard.view.alpha = v;
      },
      onComplete: () => {
        if (oldBoard) {
          oldBoard.view.parent?.removeChild(oldBoard.view);
          oldBoard.destroy();
        }
        this.currentBoard = null;
        if (isLast) {
          this.finish();
        } else {
          this.index++;
          this.loadCurrent();
        }
      },
    });
  }

  private finish(): void {
    this.opts.callbacks.onFinished({
      completed: this.completedCount,
      perfect: this.perfectCount,
      total: this.puzzleCount,
    });
    // Celebratory burst across the stage
    const app = this.app;
    if (!app) return;
    const center = {
      x: THEME.canvas.width / 2,
      y: THEME.canvas.height / 2,
    };
    const palette = [
      0xfcd34d, 0xf472b6, 0xa78bfa, 0x60a5fa, 0x34d399, 0xfb923c,
    ];
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        sparkBurst(
          app.ticker,
          app.stage,
          center.x + (Math.random() - 0.5) * 260,
          center.y + (Math.random() - 0.5) * 220,
          {
            color: palette[i % palette.length],
            count: 30,
            speed: 6,
            life: 1100,
            spread: Math.PI * 2,
            size: 8,
          },
        );
      }, i * 140);
    }
  }
}
