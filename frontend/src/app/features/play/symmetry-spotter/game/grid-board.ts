/**
 * Interactive grid board for one puzzle.
 *
 * The board shows the source half of the puzzle already painted, draws the
 * axis of symmetry as a glowing beam, and lets the player click on the empty
 * target half to complete it by symmetry.
 *
 * Design notes:
 * - Each cell is its own Container so we can tween scale/alpha per cell.
 * - Cells on the source side still get a subtle reveal animation on enter.
 * - Cell hit testing uses a per-cell rectangle hit area.
 * - The board centers itself inside the available (width, height) rectangle.
 */

import {
  Container,
  Graphics,
  Rectangle,
  Ticker,
  type FederatedPointerEvent,
} from 'pixi.js';
import { easings, shake, sparkBurst, tween } from './effects';
import { mirrorOf, splitCells, type Puzzle } from './puzzles';
import { THEME, lighten, paletteColor } from './theme';

export interface CellHitEvent {
  row: number;
  col: number;
  correct: boolean;
  /** Cell global position, useful for HUD side-effects. */
  globalX: number;
  globalY: number;
}

export interface BoardConfig {
  puzzle: Puzzle;
  maxWidth: number;
  maxHeight: number;
}

interface CellNode {
  container: Container;
  fill: Graphics;
  ghost: Graphics;
  row: number;
  col: number;
  isSource: boolean;
  /** 0 if empty in the puzzle grid. */
  paletteIdx: number;
  revealed: boolean;
}

export class GridBoard {
  readonly view = new Container();

  private readonly puzzle: Puzzle;
  private readonly rows: number;
  private readonly cols: number;
  private readonly cellSize: number;
  private readonly boardWidth: number;
  private readonly boardHeight: number;
  private readonly source: boolean[][];
  private readonly targetCount: number;

  private readonly cells: CellNode[][] = [];
  private readonly cellLayer = new Container();
  private readonly axisLayer = new Container();
  private readonly surfaceLayer = new Container();
  private readonly boardContainer = new Container();

  private hitsFound = 0;
  private totalHits = 0;
  private completed = false;
  private readonly ticker: Ticker;
  private readonly onCellHit: (ev: CellHitEvent) => void;
  private readonly onPuzzleComplete: () => void;

  constructor(
    cfg: BoardConfig,
    ticker: Ticker,
    callbacks: {
      onCellHit: (ev: CellHitEvent) => void;
      onPuzzleComplete: () => void;
    },
  ) {
    this.puzzle = cfg.puzzle;
    this.ticker = ticker;
    this.onCellHit = callbacks.onCellHit;
    this.onPuzzleComplete = callbacks.onPuzzleComplete;

    this.rows = this.puzzle.grid.length;
    this.cols = this.puzzle.grid[0].length;

    const { source, targetCount } = splitCells(this.puzzle.grid, this.puzzle.axis);
    this.source = source;
    this.targetCount = targetCount;
    this.totalHits = targetCount;

    // Compute cell size so the whole grid fits inside the allotted rectangle.
    const maxCellByW = (cfg.maxWidth - THEME.board.outerMargin * 2) / this.cols;
    const maxCellByH = (cfg.maxHeight - THEME.board.outerMargin * 2) / this.rows;
    const rawSize = Math.min(maxCellByW, maxCellByH, THEME.board.maxCellSize);
    this.cellSize = Math.max(THEME.board.minCellSize, Math.floor(rawSize));

    this.boardWidth = this.cellSize * this.cols;
    this.boardHeight = this.cellSize * this.rows;

    this.view.addChild(this.boardContainer);
    this.boardContainer.addChild(this.surfaceLayer);
    this.boardContainer.addChild(this.cellLayer);
    this.boardContainer.addChild(this.axisLayer);

    // Center the inner board inside the allotted rectangle.
    this.boardContainer.position.set(
      (cfg.maxWidth - this.boardWidth) / 2,
      (cfg.maxHeight - this.boardHeight) / 2,
    );

    this.drawBoardSurface();
    this.drawCells();
    this.drawAxis();
    this.playIntro();
  }

  destroy(): void {
    this.view.destroy({ children: true });
  }

  // --- Drawing primitives ---------------------------------------------------

  private drawBoardSurface(): void {
    const pad = 14;
    const bg = new Graphics();
    const w = this.boardWidth + pad * 2;
    const h = this.boardHeight + pad * 2;
    bg.roundRect(-pad, -pad, w, h, 22)
      .fill({ color: THEME.colors.boardFill, alpha: 0.55 })
      .stroke({
        color: THEME.colors.boardOutline,
        width: 2,
        alpha: 0.35,
        alignment: 0,
      });
    this.surfaceLayer.addChild(bg);

    // Inner grid lines
    const lines = new Graphics();
    for (let r = 0; r <= this.rows; r++) {
      const y = r * this.cellSize;
      lines.moveTo(0, y).lineTo(this.boardWidth, y);
    }
    for (let c = 0; c <= this.cols; c++) {
      const x = c * this.cellSize;
      lines.moveTo(x, 0).lineTo(x, this.boardHeight);
    }
    lines.stroke({
      color: THEME.colors.gridOutline,
      width: 1,
      alpha: THEME.colors.gridOutlineAlpha,
    });
    this.surfaceLayer.addChild(lines);
  }

  private drawCells(): void {
    const gap = THEME.board.cellGap;
    const radius = THEME.board.cornerRadius;

    for (let r = 0; r < this.rows; r++) {
      const row: CellNode[] = [];
      for (let c = 0; c < this.cols; c++) {
        const container = new Container();
        container.position.set(
          c * this.cellSize + this.cellSize / 2,
          r * this.cellSize + this.cellSize / 2,
        );
        container.scale.set(0);
        container.alpha = 0;

        const inner = this.cellSize - gap;
        const half = inner / 2;

        // Ghost / placeholder layer (shown under the fill, always visible)
        const ghost = new Graphics();
        const isSource = this.source[r][c];
        const paletteIdx = this.puzzle.grid[r][c];

        this.paintCellBackground(ghost, isSource, inner, radius);
        container.addChild(ghost);

        // Fill layer (the colorful cell itself)
        const fill = new Graphics();
        if (isSource && paletteIdx !== 0) {
          this.paintFill(fill, paletteIdx, inner, radius);
        }
        container.addChild(fill);

        container.hitArea = new Rectangle(-half, -half, inner, inner);
        container.eventMode = 'static';

        const node: CellNode = {
          container,
          fill,
          ghost,
          row: r,
          col: c,
          isSource,
          paletteIdx,
          revealed: isSource && paletteIdx !== 0,
        };
        row.push(node);

        // Every cell on the target side is clickable — the child has to
        // identify which ones are the mirror of a colored source cell.
        if (!isSource) {
          container.cursor = 'pointer';
          container.on('pointertap', (e) => this.handleTap(node, e));
          container.on('pointerover', () => this.handleHover(node, true));
          container.on('pointerout', () => this.handleHover(node, false));
        }

        this.cellLayer.addChild(container);
      }
      this.cells.push(row);
    }
  }

  /**
   * Paint the neutral background layer for a cell. Source cells and target
   * cells share the same subtle look: the child must figure out by symmetry
   * which target cells need to be filled.
   */
  private paintCellBackground(
    g: Graphics,
    isSource: boolean,
    size: number,
    radius: number,
  ): void {
    const half = size / 2;
    g.clear();
    if (isSource) {
      // Source cells get a very faint plate so empty source cells are still
      // visible and the child understands the grid shape.
      g.roundRect(-half, -half, size, size, radius).fill({
        color: THEME.colors.cellEmpty,
        alpha: THEME.colors.cellEmptyAlpha,
      });
    } else {
      // Target cells get a slightly warmer tint: that's the "mirror zone"
      // the child has to complete.
      g.roundRect(-half, -half, size, size, radius).fill({
        color: THEME.colors.cellGhost,
        alpha: THEME.colors.cellGhostAlpha,
      });
      g.roundRect(-half, -half, size, size, radius).stroke({
        color: THEME.colors.cellGhost,
        width: 1,
        alpha: 0.25,
      });
    }
  }

  private paintFill(
    g: Graphics,
    paletteIdx: number,
    size: number,
    radius: number,
  ): void {
    const half = size / 2;
    const color = paletteColor(paletteIdx);
    g.clear();
    // Layered fill: darker base, lighter top sliver for a subtle 3D look.
    g.roundRect(-half, -half, size, size, radius).fill({ color });
    // Top highlight band
    g.roundRect(-half + 2, -half + 2, size - 4, size * 0.38, radius * 0.8).fill({
      color: lighten(color, 0.25),
      alpha: 0.6,
    });
    // Subtle outline
    g.roundRect(-half, -half, size, size, radius).stroke({
      color: lighten(color, 0.45),
      width: 1.5,
      alpha: 0.8,
    });
  }

  private drawAxis(): void {
    // The axis is rendered as a thin bright line sitting ON the gap between
    // the two mirrored halves, extending slightly beyond the board edges so
    // it reads clearly over filled cells. A soft wider glow surrounds it.
    const beam = new Graphics();
    const extend = 28;
    const coreThickness = 3;
    const glowThickness = 14;

    if (this.puzzle.axis === 'vertical') {
      const midC = (this.cols - 1) / 2;
      const x = (midC + 0.5) * this.cellSize;
      // Outer soft glow
      beam.roundRect(
        x - glowThickness,
        -extend,
        glowThickness * 2,
        this.boardHeight + extend * 2,
        glowThickness,
      ).fill({ color: THEME.colors.axisGlow, alpha: 0.12 });
      beam.roundRect(
        x - glowThickness / 2,
        -extend,
        glowThickness,
        this.boardHeight + extend * 2,
        glowThickness / 2,
      ).fill({ color: THEME.colors.axis, alpha: 0.35 });
      // Bright core
      beam.roundRect(
        x - coreThickness / 2,
        -extend,
        coreThickness,
        this.boardHeight + extend * 2,
        coreThickness / 2,
      ).fill({ color: 0xffffff, alpha: 1 });
      // End caps
      beam.circle(x, -extend + 2, glowThickness / 1.4).fill({
        color: THEME.colors.axis,
        alpha: 0.55,
      });
      beam.circle(x, this.boardHeight + extend - 2, glowThickness / 1.4).fill({
        color: THEME.colors.axis,
        alpha: 0.55,
      });
    } else {
      const midR = (this.rows - 1) / 2;
      const y = (midR + 0.5) * this.cellSize;
      beam.roundRect(
        -extend,
        y - glowThickness,
        this.boardWidth + extend * 2,
        glowThickness * 2,
        glowThickness,
      ).fill({ color: THEME.colors.axisGlow, alpha: 0.12 });
      beam.roundRect(
        -extend,
        y - glowThickness / 2,
        this.boardWidth + extend * 2,
        glowThickness,
        glowThickness / 2,
      ).fill({ color: THEME.colors.axis, alpha: 0.35 });
      beam.roundRect(
        -extend,
        y - coreThickness / 2,
        this.boardWidth + extend * 2,
        coreThickness,
        coreThickness / 2,
      ).fill({ color: 0xffffff, alpha: 1 });
      beam.circle(-extend + 2, y, glowThickness / 1.4).fill({
        color: THEME.colors.axis,
        alpha: 0.55,
      });
      beam.circle(this.boardWidth + extend - 2, y, glowThickness / 1.4).fill({
        color: THEME.colors.axis,
        alpha: 0.55,
      });
    }

    beam.alpha = 0;
    this.axisLayer.addChild(beam);

    // Fade-in, then hand over to a per-frame pulsing.
    tween(this.ticker, {
      from: 0,
      to: 0.95,
      durationMs: 520,
      delayMs: 180,
      ease: easings.outCubic,
      onUpdate: (v) => {
        beam.alpha = v;
      },
      onComplete: () => {
        const start = performance.now();
        beam.onRender = () => {
          const dt = (performance.now() - start) / 1000;
          beam.alpha = Math.sin(dt * 2.2) * 0.15 + 0.85;
        };
      },
    });
  }

  private playIntro(): void {
    // Cascade the cells in from scale 0 to 1, from the axis outwards.
    const axisIsVertical = this.puzzle.axis === 'vertical';
    const midC = (this.cols - 1) / 2;
    const midR = (this.rows - 1) / 2;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const node = this.cells[r][c];
        const dist = axisIsVertical ? Math.abs(c - midC) : Math.abs(r - midR);
        const delay = 80 + dist * 55 + (axisIsVertical ? r : c) * 12;
        tween(this.ticker, {
          from: 0,
          to: 1,
          durationMs: 450,
          delayMs: delay,
          ease: easings.outBack,
          onUpdate: (v) => {
            node.container.scale.set(v);
            node.container.alpha = Math.min(1, v * 1.6);
          },
        });
      }
    }
  }

  // --- Interaction ----------------------------------------------------------

  private handleHover(node: CellNode, entering: boolean): void {
    if (this.completed) return;
    if (node.revealed) return;
    const size = this.cellSize - THEME.board.cellGap;
    const half = size / 2;
    const radius = THEME.board.cornerRadius;
    node.ghost.clear();
    if (entering) {
      node.ghost.roundRect(-half, -half, size, size, radius).fill({
        color: THEME.colors.cellHover,
        alpha: THEME.colors.cellHoverAlpha,
      });
      node.ghost.roundRect(-half, -half, size, size, radius).stroke({
        color: THEME.colors.accentBright,
        width: 2,
        alpha: 0.9,
      });
      tween(this.ticker, {
        from: node.container.scale.x,
        to: 1.08,
        durationMs: 160,
        ease: easings.outQuad,
        onUpdate: (v) => node.container.scale.set(v),
      });
    } else {
      this.paintCellBackground(node.ghost, node.isSource, size, radius);
      tween(this.ticker, {
        from: node.container.scale.x,
        to: 1,
        durationMs: 160,
        ease: easings.outQuad,
        onUpdate: (v) => node.container.scale.set(v),
      });
    }
  }

  private handleTap(node: CellNode, _event: FederatedPointerEvent): void {
    if (this.completed || node.revealed) return;

    // Find mirror cell. A click is correct iff the mirror cell has a color
    // (i.e. this target cell is supposed to be part of the figure).
    const m = mirrorOf(node.row, node.col, this.rows, this.cols, this.puzzle.axis);
    const mirrorIdx = this.puzzle.grid[m.r][m.c];
    const correct = mirrorIdx !== 0;

    const globalPos = node.container.toGlobal({ x: 0, y: 0 });
    this.onCellHit({
      row: node.row,
      col: node.col,
      correct,
      globalX: globalPos.x,
      globalY: globalPos.y,
    });

    if (correct) {
      this.revealCell(node, mirrorIdx);
      this.hitsFound++;
      if (this.hitsFound >= this.totalHits) {
        this.completed = true;
        this.celebrate();
      }
    } else {
      this.flashWrong(node);
    }
  }

  private revealCell(node: CellNode, paletteIdx: number): void {
    node.revealed = true;
    node.container.cursor = 'default';
    const inner = this.cellSize - THEME.board.cellGap;
    const radius = THEME.board.cornerRadius;
    // Clear the hover/ghost state
    const half = inner / 2;
    node.ghost.clear();
    node.ghost.roundRect(-half, -half, inner, inner, radius).fill({
      color: THEME.colors.cellEmpty,
      alpha: THEME.colors.cellEmptyAlpha * 0.6,
    });

    this.paintFill(node.fill, paletteIdx, inner, radius);

    // Pop animation: overshoot + settle
    node.fill.alpha = 0;
    node.fill.scale.set(0.4);
    tween(this.ticker, {
      from: 0,
      to: 1,
      durationMs: 480,
      ease: easings.outElastic,
      onUpdate: (v) => {
        node.fill.scale.set(v);
        node.fill.alpha = Math.min(1, v * 1.2);
      },
    });

    // Spark burst on the board layer so sparks fly across grid lines.
    sparkBurst(this.ticker, this.axisLayer, node.container.x, node.container.y, {
      color: paletteColor(paletteIdx),
      count: 18,
      speed: 4.5,
      life: 700,
      size: 6,
    });
  }

  private flashWrong(node: CellNode): void {
    const inner = this.cellSize - THEME.board.cellGap;
    const half = inner / 2;
    const radius = THEME.board.cornerRadius;
    node.ghost.clear();
    node.ghost.roundRect(-half, -half, inner, inner, radius).fill({
      color: THEME.colors.ko,
      alpha: 0.7,
    });
    node.ghost.roundRect(-half, -half, inner, inner, radius).stroke({
      color: THEME.colors.ko,
      width: 2,
      alpha: 1,
    });
    shake(this.ticker, this.boardContainer, 8, 320);
    tween(this.ticker, {
      from: 1,
      to: 0,
      durationMs: 520,
      ease: easings.outQuad,
      onUpdate: (v) => {
        node.ghost.alpha = 0.4 + 0.6 * v;
      },
      onComplete: () => {
        node.ghost.alpha = 1;
        this.paintCellBackground(node.ghost, node.isSource, inner, radius);
      },
    });
  }

  private celebrate(): void {
    // Wave burst from the axis.
    const center = {
      x: this.boardWidth / 2,
      y: this.boardHeight / 2,
    };
    for (let i = 0; i < 3; i++) {
      const color = [
        0xfcd34d, 0xf472b6, 0xa78bfa, 0x60a5fa,
      ][i % 4];
      setTimeout(() => {
        sparkBurst(this.ticker, this.axisLayer, center.x, center.y, {
          color,
          count: 28,
          speed: 6 + i,
          spread: Math.PI * 2,
          life: 900,
          size: 8,
        });
      }, i * 140);
    }

    // Gentle bob on the board to signal completion.
    const startY = this.boardContainer.y;
    tween(this.ticker, {
      from: 0,
      to: 1,
      durationMs: 720,
      ease: easings.inOutSine,
      onUpdate: (v) => {
        const off = Math.sin(v * Math.PI) * -14;
        this.boardContainer.y = startY + off;
      },
      onComplete: () => {
        this.boardContainer.y = startY;
        // Hand off to parent after a short pause.
        setTimeout(() => this.onPuzzleComplete(), 320);
      },
    });
  }
}
