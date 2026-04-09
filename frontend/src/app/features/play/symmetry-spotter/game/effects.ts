/**
 * Lightweight tween and particle helpers that don't require any extra lib.
 * All animations are driven by the shared Pixi Ticker of the Application.
 */

import { Container, Graphics, Ticker } from 'pixi.js';
import { lighten } from './theme';

export type EaseFn = (t: number) => number;

export const easings = {
  linear: (t: number) => t,
  outQuad: (t: number) => 1 - (1 - t) * (1 - t),
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  outBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  outElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
} as const;

export interface TweenOptions {
  from: number;
  to: number;
  durationMs: number;
  delayMs?: number;
  ease?: EaseFn;
  onUpdate: (value: number) => void;
  onComplete?: () => void;
}

/**
 * Register a tween against a Ticker. Returns a disposer that cancels the tween.
 */
export function tween(ticker: Ticker, opts: TweenOptions): () => void {
  const ease = opts.ease ?? easings.outCubic;
  const delay = opts.delayMs ?? 0;
  let elapsed = 0;
  let done = false;

  const handler = (t: Ticker) => {
    if (done) return;
    elapsed += t.deltaMS;
    if (elapsed < delay) return;
    const progress = Math.min(1, (elapsed - delay) / opts.durationMs);
    const v = opts.from + (opts.to - opts.from) * ease(progress);
    opts.onUpdate(v);
    if (progress >= 1) {
      done = true;
      ticker.remove(handler);
      opts.onComplete?.();
    }
  };

  ticker.add(handler);
  return () => {
    if (!done) {
      done = true;
      ticker.remove(handler);
    }
  };
}

/** Animate two values in lockstep with a single tween. */
export function tween2(
  ticker: Ticker,
  opts: Omit<TweenOptions, 'from' | 'to' | 'onUpdate'> & {
    from: readonly [number, number];
    to: readonly [number, number];
    onUpdate: (a: number, b: number) => void;
  },
): () => void {
  const ease = opts.ease ?? easings.outCubic;
  const delay = opts.delayMs ?? 0;
  let elapsed = 0;
  let done = false;
  const handler = (t: Ticker) => {
    if (done) return;
    elapsed += t.deltaMS;
    if (elapsed < delay) return;
    const progress = Math.min(1, (elapsed - delay) / opts.durationMs);
    const e = ease(progress);
    opts.onUpdate(
      opts.from[0] + (opts.to[0] - opts.from[0]) * e,
      opts.from[1] + (opts.to[1] - opts.from[1]) * e,
    );
    if (progress >= 1) {
      done = true;
      ticker.remove(handler);
      opts.onComplete?.();
    }
  };
  ticker.add(handler);
  return () => {
    if (!done) {
      done = true;
      ticker.remove(handler);
    }
  };
}

/**
 * Apply a quick "shake" to the position of a container.
 * Stores the original x/y at start and restores them on completion.
 */
export function shake(
  ticker: Ticker,
  target: Container,
  intensity = 12,
  durationMs = 360,
): void {
  const startX = target.x;
  const startY = target.y;
  let elapsed = 0;
  const handler = (t: Ticker) => {
    elapsed += t.deltaMS;
    const p = Math.min(1, elapsed / durationMs);
    const decay = 1 - p;
    const dx = (Math.random() * 2 - 1) * intensity * decay;
    const dy = (Math.random() * 2 - 1) * intensity * decay;
    target.x = startX + dx;
    target.y = startY + dy;
    if (p >= 1) {
      target.x = startX;
      target.y = startY;
      ticker.remove(handler);
    }
  };
  ticker.add(handler);
}

/** A single particle, owned by a ParticleBurst. */
interface SparkParticle {
  g: Graphics;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  rotationSpeed: number;
}

/**
 * Fire-and-forget burst of colorful sparks from a local point.
 * The burst adds its own Container to `parent` and removes itself when done.
 */
export function sparkBurst(
  ticker: Ticker,
  parent: Container,
  x: number,
  y: number,
  opts: {
    color: number;
    count?: number;
    speed?: number;
    life?: number;
    spread?: number;
    size?: number;
  },
): void {
  const count = opts.count ?? 16;
  const speed = opts.speed ?? 3.5;
  const life = opts.life ?? 650;
  const spread = opts.spread ?? Math.PI * 2;
  const size = opts.size ?? 5;

  const container = new Container();
  container.position.set(x, y);
  parent.addChild(container);

  const particles: SparkParticle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.random() - 0.5) * spread + (Math.random() - 0.5) * 0.3;
    const s = speed * (0.5 + Math.random() * 0.8);
    const tint = Math.random() < 0.5 ? opts.color : lighten(opts.color, 0.4);
    const g = new Graphics();
    const sz = size * (0.6 + Math.random() * 0.8);
    // Star-ish shape: a small diamond
    g.poly([0, -sz, sz * 0.45, 0, 0, sz, -sz * 0.45, 0]).fill({ color: tint });
    container.addChild(g);
    particles.push({
      g,
      vx: Math.cos(angle) * s,
      vy: Math.sin(angle) * s - 1.4,
      life: 0,
      maxLife: life * (0.7 + Math.random() * 0.6),
      rotationSpeed: (Math.random() - 0.5) * 0.3,
    });
  }

  const handler = (t: Ticker) => {
    const delta = t.deltaTime;
    let alive = 0;
    for (const p of particles) {
      p.life += t.deltaMS;
      if (p.life >= p.maxLife) {
        p.g.visible = false;
        continue;
      }
      alive++;
      const lifeT = p.life / p.maxLife;
      p.g.x += p.vx * delta;
      p.g.y += p.vy * delta;
      p.vy += 0.15 * delta; // gravity
      p.vx *= 0.98;
      p.g.rotation += p.rotationSpeed * delta;
      p.g.alpha = 1 - lifeT;
      const s = 1 - lifeT * 0.5;
      p.g.scale.set(s);
    }
    if (alive === 0) {
      ticker.remove(handler);
      container.destroy({ children: true });
    }
  };
  ticker.add(handler);
}

/**
 * Pulsing loop for the axis-of-symmetry beam. Adds an onRender callback that
 * animates alpha between min and max at the given frequency.
 */
export function pulseAlpha(
  target: Container,
  min: number,
  max: number,
  periodMs: number,
): void {
  const start = performance.now();
  target.onRender = () => {
    const t = ((performance.now() - start) % periodMs) / periodMs;
    const s = Math.sin(t * Math.PI * 2) * 0.5 + 0.5;
    target.alpha = min + (max - min) * s;
  };
}
