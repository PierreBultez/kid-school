import { Graphics } from 'pixi.js';

/**
 * A figure to display in the symmetry game.
 * Each figure knows whether it admits at least one axis of symmetry.
 * The draw function receives a Graphics object centered around (200, 200)
 * on a 400x400 canvas. Coordinates are local to that center.
 */
export interface Figure {
  name: string;
  symmetric: boolean;
  draw: (g: Graphics) => void;
}

const COLOR_FILL = 0x6366f1; // indigo-500
const COLOR_STROKE = 0x312e81; // indigo-900
const STROKE_WIDTH = 4;

function styled(g: Graphics): Graphics {
  return g.fill(COLOR_FILL).stroke({ color: COLOR_STROKE, width: STROKE_WIDTH });
}

// ----- Symmetric figures (axe vertical sauf mention) -----

const butterfly: Figure = {
  name: 'Papillon',
  symmetric: true,
  draw: (g) => {
    // Corps
    g.ellipse(0, 0, 8, 60);
    styled(g);
    // Aile gauche haute
    g.ellipse(-50, -30, 45, 35);
    styled(g);
    // Aile droite haute
    g.ellipse(50, -30, 45, 35);
    styled(g);
    // Aile gauche basse
    g.ellipse(-40, 30, 35, 28);
    styled(g);
    // Aile droite basse
    g.ellipse(40, 30, 35, 28);
    styled(g);
  },
};

const heart: Figure = {
  name: 'Cœur',
  symmetric: true,
  draw: (g) => {
    g.moveTo(0, 60);
    g.bezierCurveTo(-90, 0, -60, -80, 0, -20);
    g.bezierCurveTo(60, -80, 90, 0, 0, 60);
    g.closePath();
    styled(g);
  },
};

const flower: Figure = {
  name: 'Fleur',
  symmetric: true,
  draw: (g) => {
    // 4 pétales (haut, bas, gauche, droite)
    g.ellipse(0, -55, 25, 40);
    styled(g);
    g.ellipse(0, 55, 25, 40);
    styled(g);
    g.ellipse(-55, 0, 40, 25);
    styled(g);
    g.ellipse(55, 0, 40, 25);
    styled(g);
    // Cœur de la fleur
    g.circle(0, 0, 20).fill(0xfbbf24).stroke({ color: COLOR_STROKE, width: STROKE_WIDTH });
  },
};

const tree: Figure = {
  name: 'Sapin',
  symmetric: true,
  draw: (g) => {
    // Tronc
    g.rect(-12, 50, 24, 30);
    styled(g);
    // 3 triangles
    g.poly([0, -80, -50, -20, 50, -20]);
    styled(g);
    g.poly([0, -50, -60, 10, 60, 10]);
    styled(g);
    g.poly([0, -20, -70, 50, 70, 50]);
    styled(g);
  },
};

const house: Figure = {
  name: 'Maison',
  symmetric: true,
  draw: (g) => {
    // Carré
    g.rect(-60, -10, 120, 80);
    styled(g);
    // Toit
    g.poly([-70, -10, 0, -70, 70, -10]);
    styled(g);
    // Porte
    g.rect(-15, 30, 30, 40).fill(0xfbbf24).stroke({ color: COLOR_STROKE, width: STROKE_WIDTH });
  },
};

const star: Figure = {
  name: 'Étoile',
  symmetric: true,
  draw: (g) => {
    const points: number[] = [];
    const outerR = 70;
    const innerR = 28;
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      points.push(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    g.poly(points);
    styled(g);
  },
};

// ----- Asymmetric figures -----

const lightning: Figure = {
  name: 'Éclair',
  symmetric: false,
  draw: (g) => {
    g.poly([-20, -70, 25, -70, 0, -10, 30, -10, -20, 70, 0, 10, -30, 10]);
    g.fill(0xfbbf24).stroke({ color: COLOR_STROKE, width: STROKE_WIDTH });
  },
};

const comma: Figure = {
  name: 'Virgule',
  symmetric: false,
  draw: (g) => {
    g.moveTo(20, -50);
    g.bezierCurveTo(60, -30, 50, 30, 0, 50);
    g.bezierCurveTo(-30, 60, -10, 0, 20, -50);
    g.closePath();
    styled(g);
  },
};

const letterF: Figure = {
  name: 'Lettre F',
  symmetric: false,
  draw: (g) => {
    g.rect(-30, -70, 20, 140);
    styled(g);
    g.rect(-30, -70, 70, 20);
    styled(g);
    g.rect(-30, -10, 50, 20);
    styled(g);
  },
};

const letterG: Figure = {
  name: 'Lettre G',
  symmetric: false,
  draw: (g) => {
    g.arc(0, 0, 60, Math.PI * 0.2, Math.PI * 1.8);
    g.lineTo(60, 0);
    g.lineTo(20, 0);
    styled(g);
  },
};

const fish: Figure = {
  name: 'Poisson',
  symmetric: false,
  draw: (g) => {
    // Corps
    g.ellipse(-10, 0, 60, 35);
    styled(g);
    // Queue à droite
    g.poly([45, 0, 80, -30, 80, 30]);
    styled(g);
    // Œil
    g.circle(-40, -10, 6).fill(0xffffff).stroke({ color: COLOR_STROKE, width: STROKE_WIDTH });
  },
};

const swirl: Figure = {
  name: 'Tourbillon',
  symmetric: false,
  draw: (g) => {
    g.moveTo(0, 0);
    for (let i = 0; i < 60; i++) {
      const angle = i * 0.3;
      const r = i * 1.5;
      g.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    g.stroke({ color: COLOR_FILL, width: 6 });
  },
};

export const FIGURES: readonly Figure[] = [
  butterfly,
  heart,
  flower,
  tree,
  house,
  star,
  lightning,
  comma,
  letterF,
  letterG,
  fish,
  swirl,
];

/**
 * Returns a shuffled queue of `count` figures with a roughly balanced
 * mix of symmetric and asymmetric ones.
 */
export function buildQueue(count: number): Figure[] {
  const symmetric = FIGURES.filter((f) => f.symmetric);
  const asymmetric = FIGURES.filter((f) => !f.symmetric);
  const half = Math.ceil(count / 2);
  const pickRandom = (pool: readonly Figure[], n: number): Figure[] => {
    const copy = [...pool];
    const out: Figure[] = [];
    while (out.length < n && copy.length > 0) {
      const i = Math.floor(Math.random() * copy.length);
      out.push(copy.splice(i, 1)[0]);
      if (copy.length === 0 && out.length < n) {
        copy.push(...pool);
      }
    }
    return out;
  };
  const queue = [...pickRandom(symmetric, half), ...pickRandom(asymmetric, count - half)];
  // shuffle
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }
  return queue;
}
