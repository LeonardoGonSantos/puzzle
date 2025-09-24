import type { HierarchyNode, PuzzleGrid, PuzzleImage } from '../types/puzzle';
import type { PieceRecord } from '../types/puzzle';

export interface HierarchyConfig {
  rootRows: number;
  rootCols: number;
  leafSize: number;
  maxDepth: number;
}

export const DEFAULT_HIERARCHY_CONFIG: HierarchyConfig = {
  rootRows: 3,
  rootCols: 4,
  leafSize: 4,
  maxDepth: 6,
};

interface BuildContext {
  grid: PuzzleGrid;
  imageWidth: number;
  imageHeight: number;
  pieceCenters: Map<string, { x: number; y: number }>;
  config: HierarchyConfig;
}

const createNode = (
  id: string,
  level: number,
  parentId: string | undefined,
  bounds: { x: number; y: number; width: number; height: number },
  pieceIds: string[],
): HierarchyNode => ({
  id,
  level,
  parentId,
  childIds: [],
  bounds,
  pieceIds,
});

const assignPiecesToBounds = (
  pieceIds: string[],
  bounds: { x: number; y: number; width: number; height: number },
  centers: Map<string, { x: number; y: number }>,
) => {
  const allocated: string[] = [];
  const xMax = bounds.x + bounds.width;
  const yMax = bounds.y + bounds.height;
  pieceIds.forEach((pieceId) => {
    const center = centers.get(pieceId);
    if (!center) return;
    if (center.x >= bounds.x && center.x <= xMax && center.y >= bounds.y && center.y <= yMax) {
      allocated.push(pieceId);
    }
  });
  return allocated;
};

const buildChildren = (
  parent: HierarchyNode,
  context: BuildContext,
  collect: HierarchyNode[],
  depth: number,
) => {
  const {
    pieceCenters,
    config: { leafSize, maxDepth },
  } = context;

  if (parent.pieceIds.length <= leafSize || depth >= maxDepth) {
    return;
  }

  const { x, y, width, height } = parent.bounds;
  const midX = x + width / 2;
  const midY = y + height / 2;

  const quadrants = [
    {
      key: 'tl',
      bounds: { x, y, width: midX - x, height: midY - y },
    },
    {
      key: 'tr',
      bounds: { x: midX, y, width: x + width - midX, height: midY - y },
    },
    {
      key: 'bl',
      bounds: { x, y: midY, width: midX - x, height: y + height - midY },
    },
    {
      key: 'br',
      bounds: { x: midX, y: midY, width: x + width - midX, height: y + height - midY },
    },
  ];

  const childIds: string[] = [];

  quadrants.forEach((quadrant, index) => {
    const assignedPieces = assignPiecesToBounds(parent.pieceIds, quadrant.bounds, pieceCenters);
    if (assignedPieces.length === 0) {
      return;
    }

    const childId = `${parent.id}-${index}`;
    const child = createNode(childId, parent.level + 1, parent.id, quadrant.bounds, assignedPieces);
    collect.push(child);
    childIds.push(childId);
    buildChildren(child, context, collect, depth + 1);
  });

  parent.childIds = childIds;
};

const computePieceCenters = (pieces: PieceRecord[], image: PuzzleImage) => {
  const centers = new Map<string, { x: number; y: number }>();
  const tileWidth = image.width / image.grid.cols;
  const tileHeight = image.height / image.grid.rows;

  pieces.forEach((piece) => {
    const centerX = (piece.col + 0.5) * tileWidth;
    const centerY = (piece.row + 0.5) * tileHeight;
    centers.set(piece.id, { x: centerX, y: centerY });
  });

  return centers;
};

export const buildHierarchyNodes = (
  pieces: PieceRecord[],
  image: PuzzleImage,
  config: HierarchyConfig = DEFAULT_HIERARCHY_CONFIG,
): HierarchyNode[] => {
  if (pieces.length === 0) return [];

  const centers = computePieceCenters(pieces, image);
  const nodes: HierarchyNode[] = [];
  const context: BuildContext = {
    grid: image.grid,
    imageWidth: image.width,
    imageHeight: image.height,
    pieceCenters: centers,
    config,
  };

  const rootWidth = image.width / config.rootCols;
  const rootHeight = image.height / config.rootRows;

  for (let row = 0; row < config.rootRows; row += 1) {
    for (let col = 0; col < config.rootCols; col += 1) {
      const id = `root-${row}-${col}`;
      const bounds = {
        x: col * rootWidth,
        y: row * rootHeight,
        width: col === config.rootCols - 1 ? image.width - col * rootWidth : rootWidth,
        height: row === config.rootRows - 1 ? image.height - row * rootHeight : rootHeight,
      };

      const assignedPieces = assignPiecesToBounds(
        pieces.map((piece) => piece.id),
        bounds,
        centers,
      );

      if (assignedPieces.length === 0) {
        continue;
      }

      const node = createNode(id, 0, undefined, bounds, assignedPieces);
      nodes.push(node);
      buildChildren(node, context, nodes, 1);
    }
  }

  return nodes;
};
