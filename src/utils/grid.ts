import type { PuzzleGrid } from '../types/puzzle';

export const deriveGrid = (totalPieces: number): PuzzleGrid => {
  if (!Number.isFinite(totalPieces) || totalPieces <= 0) {
    throw new Error('Número de peças inválido');
  }

  const rounded = Math.max(1, Math.round(totalPieces));
  const sqrt = Math.floor(Math.sqrt(rounded));
  for (let row = sqrt; row >= 1; row -= 1) {
    if (rounded % row === 0) {
      const cols = rounded / row;
      return {
        rows: row,
        cols,
        totalPieces: rounded,
      };
    }
  }

  return {
    rows: sqrt,
    cols: Math.ceil(rounded / sqrt),
    totalPieces: rounded,
  };
};

export const calculateTileSize = (
  width: number,
  height: number,
  grid: PuzzleGrid,
): { width: number; height: number } => ({
  width: Math.floor(width / grid.cols),
  height: Math.floor(height / grid.rows),
});
