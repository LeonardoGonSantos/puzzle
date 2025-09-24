import { describe, expect, it } from 'vitest';
import { deriveGrid, calculateTileSize } from './grid';

describe('grid utilities', () => {
  it('derives a balanced grid from total pieces', () => {
    const grid = deriveGrid(120);
    expect(grid.rows * grid.cols).toBe(120);
  });

  it('falls back to near-square grid when necessary', () => {
    const grid = deriveGrid(17);
    expect(grid.totalPieces).toBe(17);
    expect(grid.rows).toBeGreaterThan(0);
    expect(grid.cols).toBeGreaterThanOrEqual(grid.rows);
  });

  it('calculates tile dimensions', () => {
    const grid = { rows: 5, cols: 10, totalPieces: 50 };
    const result = calculateTileSize(500, 250, grid);
    expect(result.width).toBe(50);
    expect(result.height).toBe(50);
  });
});
