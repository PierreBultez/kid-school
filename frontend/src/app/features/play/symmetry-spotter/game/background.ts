/**
 * Decorative animated background for the Mirror game.
 *
 * Uses a pre-baked gradient Graphics (drawn once as horizontal bands) plus a
 * layer of twinkling stars. Everything here is purely cosmetic: no hit-testing,
 * no layout impact.
 */

import { Container, Graphics, Ticker } from 'pixi.js';
import { THEME, mixColor } from './theme';

interface Star {
  g: Graphics;
  x: number;
  y: number;
  baseAlpha: number;
  phase: number;
  speed: number;
  drift: number;
}

export class MagicBackground {
  readonly view = new Container();
  private readonly stars: Star[] = [];
  private readonly starLayer = new Container();
  private tickerHandler: ((t: Ticker) => void) | null = null;
  private ticker: Ticker | null = null;

  constructor(
    private readonly width: number,
    private readonly height: number,
  ) {
    this.view.addChild(this.buildGradient());
    this.view.addChild(this.buildVignette());
    this.view.addChild(this.starLayer);
    this.spawnStars(90);
  }

  attach(ticker: Ticker): void {
    this.ticker = ticker;
    const handler = (t: Ticker) => {
      const delta = t.deltaTime;
      for (const s of this.stars) {
        s.phase += s.speed * delta;
        const tw = Math.sin(s.phase) * 0.5 + 0.5;
        s.g.alpha = s.baseAlpha * (0.4 + tw * 0.9);
        s.y += s.drift * delta;
        if (s.y > this.height + 6) {
          s.y = -6;
          s.x = Math.random() * this.width;
        }
        s.g.position.set(s.x, s.y);
      }
    };
    this.tickerHandler = handler;
    ticker.add(handler);
  }

  destroy(): void {
    if (this.ticker && this.tickerHandler) {
      this.ticker.remove(this.tickerHandler);
    }
    this.tickerHandler = null;
    this.ticker = null;
    this.view.destroy({ children: true });
  }

  private buildGradient(): Graphics {
    // PixiJS v8 Graphics supports fill gradients but the simpler reliable path
    // is to stack a few rectangular bands interpolating between our colors.
    const bands = 48;
    const g = new Graphics();
    const c = THEME.colors;
    for (let i = 0; i < bands; i++) {
      const t = i / (bands - 1);
      let color: number;
      if (t < 0.5) {
        color = mixColor(c.bgTop, c.bgMid, t * 2);
      } else {
        color = mixColor(c.bgMid, c.bgBot, (t - 0.5) * 2);
      }
      const y = (i * this.height) / bands;
      const h = Math.ceil(this.height / bands) + 1;
      g.rect(0, y, this.width, h).fill({ color, alpha: 1 });
    }
    return g;
  }

  private buildVignette(): Graphics {
    // Soft dark frame to focus the eye on the board.
    const g = new Graphics();
    const steps = 12;
    for (let i = 0; i < steps; i++) {
      const inset = i * 4;
      const alpha = 0.04;
      g.rect(inset, inset, this.width - inset * 2, this.height - inset * 2)
        .stroke({ color: 0x000000, width: 4, alpha });
    }
    return g;
  }

  private spawnStars(count: number): void {
    for (let i = 0; i < count; i++) {
      const g = new Graphics();
      const size = 0.8 + Math.random() * 2.2;
      const warm = Math.random() < 0.35;
      const color = warm ? THEME.colors.starWarm : THEME.colors.starCold;
      // Draw a tiny 4-point sparkle
      g.moveTo(0, -size * 2)
        .lineTo(size * 0.6, -size * 0.4)
        .lineTo(size * 2, 0)
        .lineTo(size * 0.6, size * 0.4)
        .lineTo(0, size * 2)
        .lineTo(-size * 0.6, size * 0.4)
        .lineTo(-size * 2, 0)
        .lineTo(-size * 0.6, -size * 0.4)
        .closePath()
        .fill({ color });
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      g.position.set(x, y);
      this.starLayer.addChild(g);
      this.stars.push({
        g,
        x,
        y,
        baseAlpha: 0.4 + Math.random() * 0.55,
        phase: Math.random() * Math.PI * 2,
        speed: 0.01 + Math.random() * 0.035,
        drift: 0.05 + Math.random() * 0.12,
      });
    }
  }
}
