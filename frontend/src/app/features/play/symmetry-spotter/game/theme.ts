/**
 * Visual theme constants for the Mirror game.
 * Keeping every hardcoded value here makes it easy to re-tune the look & feel.
 */

export const THEME = {
  canvas: {
    width: 640,
    height: 720,
    hudHeight: 96,
    boardHeight: 620,
  },
  board: {
    outerMargin: 28,
    maxCellSize: 78,
    minCellSize: 42,
    cellGap: 4,
    cornerRadius: 10,
  },
  colors: {
    // Background gradient stops
    bgTop: 0x1e1b4b, // indigo-950
    bgMid: 0x4c1d95, // violet-900
    bgBot: 0x831843, // pink-900
    // Accent gold
    accent: 0xfcd34d, // amber-300
    accentBright: 0xfef3c7, // amber-100
    // Board surface
    boardFill: 0x0f0a2e,
    boardOutline: 0xfcd34d,
    // Grid cells
    cellEmpty: 0xffffff,
    cellEmptyAlpha: 0.045,
    cellHover: 0xfef3c7,
    cellHoverAlpha: 0.18,
    cellGhost: 0xfcd34d,
    cellGhostAlpha: 0.09,
    // Source side (already painted) gets a subtle highlight
    cellSourceHalo: 0xffffff,
    // Grid outline
    gridOutline: 0xffffff,
    gridOutlineAlpha: 0.12,
    // Axis of symmetry
    axis: 0xfcd34d,
    axisGlow: 0xfef3c7,
    // Feedback colors
    ok: 0x34d399, // emerald-400
    ko: 0xf87171, // red-400
    // UI text
    textPrimary: 0xffffff,
    textMuted: 0xc7d2fe, // indigo-200
    textDim: 0x94a3b8, // slate-400
    // Stars / sparkle tinting in background
    starCold: 0xa5b4fc,
    starWarm: 0xfde68a,
    // Pixel-art palette, 1-based (index 0 = empty)
    palette: [
      0xef4444, // 1 R red
      0xfb923c, // 2 O orange
      0xfbbf24, // 3 Y yellow
      0x34d399, // 4 G green
      0x60a5fa, // 5 B blue
      0xa78bfa, // 6 V violet
      0xf472b6, // 7 P pink
      0xfef3c7, // 8 W cream
      0x7c2d12, // 9 M brown
    ] as const,
  },
} as const;

export function paletteColor(index: number): number {
  if (index <= 0) return 0xffffff;
  return THEME.colors.palette[index - 1] ?? 0xffffff;
}

/** Mix two RGB ints by ratio t in [0,1]. */
export function mixColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

/** Lighten an RGB color by ratio t in [0,1]. */
export function lighten(color: number, t: number): number {
  return mixColor(color, 0xffffff, t);
}

/** Darken an RGB color by ratio t in [0,1]. */
export function darken(color: number, t: number): number {
  return mixColor(color, 0x000000, t);
}
