/**
 * Puzzle bank for the Mirror game.
 *
 * Each puzzle is a small pixel-art grid that is already symmetric by its
 * declared axis. The game then "hides" one half and asks the child to
 * reconstruct it by clicking the mirrored cells.
 *
 * Patterns are authored as ASCII strings for readability:
 *   '.'     empty
 *   R O Y   red, orange, yellow
 *   G B V   green, blue, violet
 *   P W M   pink, cream (white), brown (maroon)
 * Spaces and '|' are ignored by the parser so rows can be padded visually.
 */

export type PuzzleAxis = 'vertical' | 'horizontal';
export type PuzzleLevel = 'cm1' | 'cm2' | 'sixieme' | 'insane';
export type PuzzleGrid = number[][]; // [row][col], 0 = empty, 1..9 = palette index

export interface Puzzle {
  readonly name: string;
  readonly axis: PuzzleAxis;
  readonly grid: PuzzleGrid;
  readonly difficulty: 1 | 2 | 3;
  readonly level: PuzzleLevel;
}

const PATTERN_MAP: Record<string, number> = {
  '.': 0,
  R: 1,
  O: 2,
  Y: 3,
  G: 4,
  B: 5,
  V: 6,
  P: 7,
  W: 8,
  M: 9,
};

function parsePattern(rows: readonly string[]): PuzzleGrid {
  return rows.map((row, r) => {
    const out: number[] = [];
    for (const rawCh of row) {
      if (rawCh === ' ' || rawCh === '|' || rawCh === '\t') continue;
      const ch = rawCh.toUpperCase();
      const v = PATTERN_MAP[ch];
      if (v === undefined) {
        throw new Error(`Unknown pattern char "${rawCh}" at row ${r}`);
      }
      out.push(v);
    }
    return out;
  });
}

/** Cheap integrity check so a mis-typed puzzle is caught at boot time. */
function assertSymmetric(p: Puzzle): void {
  const { grid, axis, name } = p;
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  for (const row of grid) {
    if (row.length !== cols) {
      throw new Error(`Puzzle "${name}" has ragged rows`);
    }
  }
  if (axis === 'vertical') {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < Math.floor(cols / 2); c++) {
        if (grid[r][c] !== grid[r][cols - 1 - c]) {
          throw new Error(
            `Puzzle "${name}" is not vertically symmetric at (${r},${c})`,
          );
        }
      }
    }
  } else {
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < Math.floor(rows / 2); r++) {
        if (grid[r][c] !== grid[rows - 1 - r][c]) {
          throw new Error(
            `Puzzle "${name}" is not horizontally symmetric at (${r},${c})`,
          );
        }
      }
    }
  }
}

// --- Puzzle catalogue -------------------------------------------------------
// Note: all puzzles use odd column count (vertical) or odd row count (horizontal)
// so the axis lies on a column/row, which is the simplest case pedagogically.

const P_HEART: Puzzle = {
  name: 'Petit cœur',
  axis: 'vertical',
  difficulty: 1,
  level: 'cm1',
  grid: parsePattern([
    '. R . R .',
    'R R R R R',
    'R R R R R',
    '. R R R .',
    '. . R . .',
  ]),
};

const P_BUTTERFLY: Puzzle = {
  name: 'Papillon',
  axis: 'vertical',
  difficulty: 1,
  level: 'cm1',
  grid: parsePattern([
    'V . . M . . V',
    'V V . Y . V V',
    'V P V Y V P V',
    '. V V Y V V .',
    '. . . Y . . .',
  ]),
};

const P_FLOWER: Puzzle = {
  name: 'Fleur',
  axis: 'vertical',
  difficulty: 1,
  level: 'cm1',
  grid: parsePattern([
    'Y . Y . Y',
    'Y O Y O Y',
    'Y Y Y Y Y',
    '. . G . .',
    '. . G . .',
  ]),
};

const P_STAR: Puzzle = {
  name: 'Étoile',
  axis: 'vertical',
  difficulty: 2,
  level: 'cm1',
  grid: parsePattern([
    '. . Y . .',
    '. Y Y Y .',
    'Y Y O Y Y',
    '. Y Y Y .',
    '. Y . Y .',
  ]),
};

const P_TREE: Puzzle = {
  name: 'Sapin',
  axis: 'vertical',
  difficulty: 2,
  level: 'cm1',
  grid: parsePattern([
    '. . . G . . .',
    '. . G G G . .',
    '. G G G G G .',
    'G G G G G G G',
    '. G G G G G .',
    '. . . M . . .',
    '. . . M . . .',
  ]),
};

const P_HOUSE: Puzzle = {
  name: 'Maison',
  axis: 'vertical',
  difficulty: 2,
  level: 'cm1',
  grid: parsePattern([
    '. . . R . . .',
    '. . R R R . .',
    '. R R R R R .',
    'W W W W W W W',
    'W . W Y W . W',
    'W . W Y W . W',
    'W W W Y W W W',
  ]),
};

const P_CROWN: Puzzle = {
  name: 'Couronne',
  axis: 'vertical',
  difficulty: 3,
  level: 'cm1',
  grid: parsePattern([
    'Y . Y . Y . Y',
    'Y Y Y R Y Y Y',
    'Y . Y Y Y . Y',
    'Y Y Y Y Y Y Y',
    '. . . . . . .',
  ]),
};

const P_MUSHROOM: Puzzle = {
  name: 'Champignon',
  axis: 'vertical',
  difficulty: 3,
  level: 'cm1',
  grid: parsePattern([
    '. . R R R . .',
    '. R R W R R .',
    'R R W R W R R',
    'W R R R R R W',
    '. . W W W . .',
    '. . W W W . .',
    '. . W W W . .',
  ]),
};

const P_RAINBOW_BUTTERFLY: Puzzle = {
  name: 'Papillon arc-en-ciel',
  axis: 'vertical',
  difficulty: 3,
  level: 'cm1',
  grid: parsePattern([
    'R . . . Y . . . R',
    'R O . . Y . . O R',
    'O Y Y . Y . Y Y O',
    'Y G G G Y G G G Y',
    'G B B . Y . B B G',
    'B V V . Y . V V B',
    '. . . . Y . . . .',
  ]),
};

const P_KEY: Puzzle = {
  name: 'Clé magique',
  axis: 'vertical',
  difficulty: 2,
  level: 'cm1',
  grid: parsePattern([
    '. . Y Y Y . .',
    '. Y . . . Y .',
    '. Y . O . Y .',
    '. Y . . . Y .',
    '. . Y Y Y . .',
    '. . . Y . . .',
    '. . Y Y Y . .',
  ]),
};

// --- CM2 puzzles — even-width grids (axis between columns, no shared center) ---
// At CM2 the child must count distances from the axis: there's no "free" center
// column, every target cell requires reasoning about equidistance.

const P_CASTLE: Puzzle = {
  name: 'Château',
  axis: 'vertical',
  difficulty: 1,
  level: 'cm2',
  grid: parsePattern([
    '. R R . . R R .',
    'R R R R R R R R',
    'R R . R R . R R',
    'W W W W W W W W',
    'W . . W W . . W',
    'W W W W W W W W',
  ]),
};

const P_DIAMOND_CM2: Puzzle = {
  name: 'Diamant',
  axis: 'vertical',
  difficulty: 3,
  level: 'cm2',
  grid: parsePattern([
    '. . B B B B . .',
    '. B W W W W B .',
    'B B B B B B B B',
    'B W W W W W W B',
    '. B W W W W B .',
    '. . B W W B . .',
    '. . . B B . . .',
    '. . . . . . . .',
  ]),
};

const P_TEMPLE: Puzzle = {
  name: 'Temple',
  axis: 'vertical',
  difficulty: 2,
  level: 'cm2',
  grid: parsePattern([
    '. . Y Y Y Y . .',
    '. Y Y O O Y Y .',
    'Y Y O . . O Y Y',
    'Y O . . . . O Y',
    'Y O . . . . O Y',
    'Y Y O . . O Y Y',
    '. Y Y O O Y Y .',
    '. . Y Y Y Y . .',
  ]),
};

const P_ALIEN: Puzzle = {
  name: 'Alien',
  axis: 'vertical',
  difficulty: 3,
  level: 'cm2',
  grid: parsePattern([
    '. . . V V . . .',
    '. . V V V V . .',
    '. V V V V V V .',
    'V V . V V . V V',
    'V V V V V V V V',
    '. . V . . V . .',
    '. V . V V . V .',
    'V . . . . . . V',
  ]),
};

const P_SHIELD: Puzzle = {
  name: 'Bouclier',
  axis: 'vertical',
  difficulty: 3,
  level: 'cm2',
  grid: parsePattern([
    '. . . G G . . .',
    '. . G B B G . .',
    '. G B Y Y B G .',
    '. G B Y Y B G .',
    'G B Y R R Y B G',
    'G B Y R R Y B G',
    '. G B Y Y B G .',
    '. G B Y Y B G .',
    '. . G B B G . .',
    '. . . G G . . .',
  ]),
};

const P_ROSACE: Puzzle = {
  name: 'Rosace',
  axis: 'vertical',
  difficulty: 3,
  level: 'cm2',
  grid: parsePattern([
    '. . R R R R . .',
    '. R R . . R R .',
    'R . . P P . . R',
    'R . P P P P . R',
    'R . P P P P . R',
    'R . . P P . . R',
    '. R R . . R R .',
    '. . R R R R . .',
  ]),
};

const P_DRAGONFLY: Puzzle = {
  name: 'Libellule',
  axis: 'horizontal',
  difficulty: 2,
  level: 'cm2',
  grid: parsePattern([
    '. . G G G G . .',
    '. G G B B G G .',
    'G G B . . B G G',
    '. . . B B . . .',
    '. . . B B . . .',
    'G G B . . B G G',
    '. G G B B G G .',
    '. . G G G G . .',
  ]),
};

const P_ANCHOR: Puzzle = {
  name: 'Ancre',
  axis: 'vertical',
  difficulty: 3,
  level: 'cm2',
  grid: parsePattern([
    '. . . B B . . .',
    '. . B B B B . .',
    '. . . B B . . .',
    '. . . B B . . .',
    'B . . B B . . B',
    'B B . B B . B B',
    '. B B B B B B .',
    '. . B B B B . .',
  ]),
};

const P_ROBOT: Puzzle = {
  name: 'Robot',
  axis: 'vertical',
  difficulty: 3,
  level: 'cm2',
  grid: parsePattern([
    '. G G G G G G .',
    'G . . . . . . G',
    'G . R . . R . G',
    'G . . . . . . G',
    'G . G G G G . G',
    'G . G . . G . G',
    'G . . . . . . G',
    '. G G G G G G .',
  ]),
};

const P_FUSEE: Puzzle = {
  name: 'Fusée',
  axis: 'vertical',
  difficulty: 3,
  level: 'cm2',
  grid: parsePattern([
    '. . . Y Y . . .',
    '. . Y R R Y . .',
    '. Y R R R R Y .',
    '. Y R R R R Y .',
    'Y Y R R R R Y Y',
    'Y . Y Y Y Y . Y',
    'Y . . R R . . Y',
    '. . Y . . Y . .',
  ]),
};

// --- 6ème puzzles — large grids, complex patterns, consolidation ---------------
// Larger boards force the child to think about distances more carefully and
// solidify the mental model of the médiatrice (perpendicular bisector).

const P_CATHEDRAL: Puzzle = {
  name: 'Cathédrale',
  axis: 'vertical',
  difficulty: 1,
  level: 'sixieme',
  grid: parsePattern([
    '. . . . R . . . .',
    '. . . R R R . . .',
    '. . R R R R R . .',
    '. R R R W R R R .',
    'R R R R W R R R R',
    'W W W W W W W W W',
    'W . . W . W . . W',
    'W . . W . W . . W',
    'W . . W W W . . W',
    'W W W W W W W W W',
    'W W W W W W W W W',
  ]),
};

const P_GALAXY: Puzzle = {
  name: 'Galaxie',
  axis: 'vertical',
  difficulty: 2,
  level: 'sixieme',
  grid: parsePattern([
    '. . . . . V . . . . .',
    '. B . . V B V . . B .',
    '. . . V B . B V . . .',
    '. . V B . . . B V . .',
    '. V B . . . . . B V .',
    'V B . . . . . . . B V',
    '. V B . . . . . B V .',
    '. . V B . . . B V . .',
    '. . . V B . B V . . .',
    '. B . . V B V . . B .',
    '. . . . . V . . . . .',
  ]),
};

const P_BURGER: Puzzle = {
  name: 'Le Burger',
  axis: 'vertical',
  difficulty: 2,
  level: 'sixieme',
  grid: parsePattern([
    '. . . . . . . . . . .',
    '. . . O O O O O . . .',
    '. . O O O W O O O . .',
    '. O O W O O O W O O .',
    '. G G G G G G G G G .',
    '. . R R Y Y Y R R . .',
    '. M M M M M M M M M .',
    '. M M M M M M M M M .',
    '. . O O O O O O O . .',
    '. . . O O O O O . . .',
    '. . . . . . . . . . .',
  ]),
};

const P_PROCESSOR: Puzzle = {
  name: 'Le Processeur',
  axis: 'vertical',
  difficulty: 3,
  level: 'sixieme',
  grid: parsePattern([
    '. G . G . G . G . G .',
    'G G G G G G G G G G G',
    '. G M M M M M M M G .',
    'G G M Y Y Y Y Y M G G',
    '. G M Y M M M Y M G .',
    'G G M Y M Y M Y M G G',
    '. G M Y M M M Y M G .',
    'G G M Y Y Y Y Y M G G',
    '. G M M M M M M M G .',
    'G G G G G G G G G G G',
    '. G . G . G . G . G .',
  ]),
};

const P_CRAB: Puzzle = {
  name: 'Le Crabe',
  axis: 'vertical',
  difficulty: 3,
  level: 'sixieme',
  grid: parsePattern([
    'R . . . . . . . . . R',
    '. R R . . . . . R R .',
    '. . R R . . . R R . .',
    '. . . R R R R R . . .',
    '. R R R W R W R R R .',
    'R R R R R R R R R R R',
    'R R . R R R R R . R R',
    'R . . . R R R . . . R',
    '. . . R . . . R . . .',
    '. . R . . . . . R . .',
    '. . . . . . . . . . .',
  ]),
};

const P_PYRAMID: Puzzle = {
  name: 'Pyramide',
  axis: 'vertical',
  difficulty: 3,
  level: 'sixieme',
  grid: parsePattern([
    '. . . . . . . . . . .',
    '. . . . . O . . . . .',
    '. . . . O Y O . . . .',
    '. . . O O Y O O . . .',
    '. . . O Y Y Y O . . .',
    '. . O O Y Y Y O O . .',
    '. . O Y Y Y Y Y O . .',
    '. O O Y Y Y Y Y O O .',
    '. O Y Y Y . Y Y Y O .',
    'O O O Y Y . Y Y O O O',
    'O O O O O . O O O O O',
  ]),
};

const P_SNOWFLAKE: Puzzle = {
  name: 'Flocon',
  axis: 'vertical',
  difficulty: 3,
  level: 'sixieme',
  grid: parsePattern([
    '. . . . . B . . . . .',
    '. . . . B B B . . . .',
    '. . . B . B . B . . .',
    '. . B . . B . . B . .',
    '. B . . B B B . . B .',
    'B B B B B W B B B B B',
    '. B . . B B B . . B .',
    '. . B . . B . . B . .',
    '. . . B . B . B . . .',
    '. . . . B B B . . . .',
    '. . . . . B . . . . .',
  ]),
};

const P_MOSAIC: Puzzle = {
  name: 'Mosaïque',
  axis: 'vertical',
  difficulty: 3,
  level: 'sixieme',
  grid: parsePattern([
    '. . . . R R . . . .',
    '. . . R O O R . . .',
    '. . R O Y Y O R . .',
    '. R O Y G G Y O R .',
    'R O Y G B B G Y O R',
    'R O Y G B B G Y O R',
    '. R O Y G G Y O R .',
    '. . R O Y Y O R . .',
    '. . . R O O R . . .',
    '. . . . R R . . . .',
  ]),
};

const P_FORTRESS: Puzzle = {
  name: 'Forteresse',
  axis: 'vertical',
  difficulty: 2,
  level: 'sixieme',
  grid: parsePattern([
    'R . . . R R R . . . R',
    'R R . . R R R . . R R',
    'R R R R R R R R R R R',
    '. . R W W W W W R . .',
    '. . R W . . . W R . .',
    '. . R W . Y . W R . .',
    '. . R W . . . W R . .',
    '. . R W W W W W R . .',
    '. . R R R R R R R . .',
  ]),
};

const P_TOTEM: Puzzle = {
  name: 'Totem',
  axis: 'horizontal',
  difficulty: 3,
  level: 'sixieme',
  grid: parsePattern([
    '. . R R R R R . .',
    '. R O . . . O R .',
    'R O Y . . . Y O R',
    '. R R R R R R R .',
    '. . . R R R . . .',
    '. R R R R R R R .',
    'R O Y . . . Y O R',
    '. R O . . . O R .',
    '. . R R R R R . .',
  ]),
};

// --- Insane puzzles — maximum grid, extreme complexity -----------------------
// These puzzles use 13–15 columns and dense multi-color patterns. They are
// unlocked only after mastering all three school levels.

const P_MANDALA: Puzzle = {
  name: 'Mandala',
  axis: 'vertical',
  difficulty: 3,
  level: 'insane',
  grid: parsePattern([
    '. . . . . . R . . . . . .',
    '. . . . . R O R . . . . .',
    '. . . . R O Y O R . . . .',
    '. . . R O Y G Y O R . . .',
    '. . R O Y G B G Y O R . .',
    '. R O Y G B V B G Y O R .',
    'R O Y G B V P V B G Y O R',
    '. R O Y G B V B G Y O R .',
    '. . R O Y G B G Y O R . .',
    '. . . R O Y G Y O R . . .',
    '. . . . R O Y O R . . . .',
    '. . . . . R O R . . . . .',
    '. . . . . . R . . . . . .',
  ]),
};

const P_PHOENIX: Puzzle = {
  name: 'Phénix',
  axis: 'vertical',
  difficulty: 3,
  level: 'insane',
  grid: parsePattern([
    '. . . . . . R . . . . . .',
    '. . . . . R R R . . . . .',
    '. . . . R O R O R . . . .',
    '. . . R O O R O O R . . .',
    '. . R O . O R O . O R . .',
    '. R . . . . R . . . . R .',
    'R . . . . Y R Y . . . . R',
    'R . . . Y Y R Y Y . . . R',
    '. R . Y Y . R . Y Y . R .',
    '. . R Y . . R . . Y R . .',
    '. . . R . . R . . R . . .',
    '. . . . R . R . R . . . .',
    '. . . . . R R R . . . . .',
  ]),
};

const P_AZTEC: Puzzle = {
  name: 'Aztèque',
  axis: 'vertical',
  difficulty: 3,
  level: 'insane',
  grid: parsePattern([
    'G . . . . . G . . . . . G',
    'G G . . . G Y G . . . G G',
    'G . G . G Y O Y G . G . G',
    '. . . G Y O R O Y G . . .',
    '. . G Y O R R R O Y G . .',
    '. G Y O R R M R R O Y G .',
    'G Y O R R M W M R R O Y G',
    '. G Y O R R M R R O Y G .',
    '. . G Y O R R R O Y G . .',
    '. . . G Y O R O Y G . . .',
    'G . G . G Y O Y G . G . G',
    'G G . . . G Y G . . . G G',
    'G . . . . . G . . . . . G',
  ]),
};

const P_LABYRINTH: Puzzle = {
  name: 'Labyrinthe',
  axis: 'horizontal',
  difficulty: 3,
  level: 'insane',
  grid: parsePattern([
    'B B B B B B B B B B B B B B B',
    'B . . . . . . . . . . . . . B',
    'B . B B B . B B B . B B B . B',
    'B . B . . . B . . . . . B . B',
    'B . B . B B B . B B B . B . B',
    'B . . . . . . . . . . . . . B',
    'B B B . B . B W B . B . B B B',
    'B . . . . . . . . . . . . . B',
    'B . B . B B B . B B B . B . B',
    'B . B . . . B . . . . . B . B',
    'B . B B B . B B B . B B B . B',
    'B . . . . . . . . . . . . . B',
    'B B B B B B B B B B B B B B B',
  ]),
};

const P_STAINED_GLASS: Puzzle = {
  name: 'Vitrail',
  axis: 'vertical',
  difficulty: 3,
  level: 'insane',
  grid: parsePattern([
    '. . . . . . V . . . . . .',
    '. . . . . V B V . . . . .',
    '. . . . V B R B V . . . .',
    '. . . V . B R B . V . . .',
    '. . V . O . R . O . V . .',
    '. V . O Y O R O Y O . V .',
    'V B R . O Y G Y O . R B V',
    '. V . O Y O R O Y O . V .',
    '. . V . O . R . O . V . .',
    '. . . V . B R B . V . . .',
    '. . . . V B R B V . . . .',
    '. . . . . V B V . . . . .',
    '. . . . . . V . . . . . .',
  ]),
};

const P_QUILT: Puzzle = {
  name: 'Patchwork',
  axis: 'vertical',
  difficulty: 3,
  level: 'insane',
  grid: parsePattern([
    'R R R . B B B . B B B . R R R',
    'R . R . B . B . B . B . R . R',
    'R R R . B B B . B B B . R R R',
    '. . . . . . . . . . . . . . .',
    'G G G . Y Y Y . Y Y Y . G G G',
    'G . G . Y . Y . Y . Y . G . G',
    'G G G . Y Y Y . Y Y Y . G G G',
    '. . . . . . . . . . . . . . .',
    'R R R . B B B . B B B . R R R',
    'R . R . B . B . B . B . R . R',
    'R R R . B B B . B B B . R R R',
    '. . . . . . . . . . . . . . .',
    'G G G . Y Y Y . Y Y Y . G G G',
  ]),
};

const P_FRACTAL: Puzzle = {
  name: 'Fractale',
  axis: 'vertical',
  difficulty: 3,
  level: 'insane',
  grid: parsePattern([
    '. . . . . . P . . . . . .',
    '. . . . . P . P . . . . .',
    '. . . . P . P . P . . . .',
    '. . . P . P V P . P . . .',
    '. . P . P V . V P . P . .',
    '. P . P V . B . V P . P .',
    'P . P V . B W B . V P . P',
    '. P . P V . B . V P . P .',
    '. . P . P V . V P . P . .',
    '. . . P . P V P . P . . .',
    '. . . . P . P . P . . . .',
    '. . . . . P . P . . . . .',
    '. . . . . . P . . . . . .',
  ]),
};

const ALL_PUZZLES: readonly Puzzle[] = [
  // CM1
  P_HEART,
  P_BUTTERFLY,
  P_FLOWER,
  P_STAR,
  P_TREE,
  P_HOUSE,
  P_KEY,
  P_CROWN,
  P_MUSHROOM,
  P_RAINBOW_BUTTERFLY,
  // CM2 (even-width grids)
  P_CASTLE,
  P_DIAMOND_CM2,
  P_TEMPLE,
  P_SHIELD,
  P_ALIEN,
  P_ROBOT,
  P_FUSEE,
  P_ROSACE,
  P_DRAGONFLY,
  P_ANCHOR,
  // 6ème (large complex grids)
  P_CATHEDRAL,
  P_GALAXY,
  P_BURGER,
  P_PROCESSOR,
  P_CRAB,
  P_PYRAMID,
  P_SNOWFLAKE,
  P_MOSAIC,
  P_FORTRESS,
  P_TOTEM,
  // Insane (13–15 col, extreme patterns)
  P_MANDALA,
  P_PHOENIX,
  P_AZTEC,
  P_LABYRINTH,
  P_STAINED_GLASS,
  P_QUILT,
  P_FRACTAL,
];

// Run validation once at module load. If any puzzle is broken the game fails
// loudly instead of silently producing an unsolvable board.
for (const p of ALL_PUZZLES) {
  assertSymmetric(p);
}

/**
 * Build a playable queue filtered by level: puzzles sorted roughly by
 * difficulty, with the pool shuffled inside each bucket so sessions feel
 * different.
 *
 * When level is omitted the full catalogue is used (backwards compat with
 * the demo component).
 */
export function buildPuzzleQueue(count: number, level?: PuzzleLevel): Puzzle[] {
  const pool = level
    ? ALL_PUZZLES.filter((p) => p.level === level)
    : ALL_PUZZLES;

  const byDiff: Record<number, Puzzle[]> = { 1: [], 2: [], 3: [] };
  for (const p of pool) {
    byDiff[p.difficulty].push(p);
  }
  for (const diff of [1, 2, 3] as const) {
    shuffle(byDiff[diff]);
  }
  const ordered = [...byDiff[1], ...byDiff[2], ...byDiff[3]];
  if (ordered.length === 0) return [];
  // If count > available, wrap around the list.
  const out: Puzzle[] = [];
  let i = 0;
  while (out.length < count) {
    out.push(ordered[i % ordered.length]);
    i++;
  }
  return out.slice(0, count);
}

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/**
 * Decide which cells are "source" (pre-painted) and which are "target"
 * (cells the child must click). On the axis itself the cell belongs to the
 * source side — it's its own mirror.
 */
export function splitCells(
  grid: PuzzleGrid,
  axis: PuzzleAxis,
): { source: boolean[][]; targetCount: number } {
  const rows = grid.length;
  const cols = grid[0].length;
  const source: boolean[][] = Array.from({ length: rows }, () =>
    Array<boolean>(cols).fill(false),
  );
  let targetCount = 0;
  if (axis === 'vertical') {
    const mid = (cols - 1) / 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (c <= mid) {
          source[r][c] = true;
        } else if (grid[r][c] !== 0) {
          targetCount++;
        }
      }
    }
  } else {
    const mid = (rows - 1) / 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r <= mid) {
          source[r][c] = true;
        } else if (grid[r][c] !== 0) {
          targetCount++;
        }
      }
    }
  }
  return { source, targetCount };
}

/** Return the mirror cell of (r,c) across the given axis. */
export function mirrorOf(
  r: number,
  c: number,
  rows: number,
  cols: number,
  axis: PuzzleAxis,
): { r: number; c: number } {
  if (axis === 'vertical') {
    return { r, c: cols - 1 - c };
  }
  return { r: rows - 1 - r, c };
}
