export type ProcessingPhase =
  | 'idle'
  | 'splitting'
  | 'ready'
  | 'matching'
  | 'match-found'
  | 'match-not-found'
  | 'error';

export interface PuzzleGrid {
  rows: number;
  cols: number;
  totalPieces: number;
}

export interface PuzzleImage {
  id: string;
  dataUrl: string;
  width: number;
  height: number;
  grid: PuzzleGrid;
}

export interface PieceMetadata {
  id: string;
  row: number;
  col: number;
  width: number;
  height: number;
  blobKey: string;
  thumbnailKey: string;
  embeddingKey?: string;
  objectUrl?: string;
  thumbnailUrl?: string;
}

export interface PieceRecord extends PieceMetadata {
  score?: number;
  distance?: number;
}

export interface MatchResult {
  pieceId: string;
  row: number;
  col: number;
  score: number;
}

export interface MatchCandidate extends MatchResult {
  rank: number;
}

export type FlowStep = 1 | 2 | 3;

export type MatchingMode = 'hierarchy' | 'global';

export interface QuadBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HierarchyNode {
  id: string;
  level: number;
  parentId?: string;
  childIds?: string[];
  bounds: QuadBounds;
  pieceIds: string[];
}

export interface HierarchyPathItem {
  nodeId: string;
  level: number;
  score: number;
  bounds: QuadBounds;
}

export interface PuzzleError {
  code: string;
  message: string;
}
