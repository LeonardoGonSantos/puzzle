import type { PuzzleGrid } from '../types/puzzle';

export interface SplitPieceData {
  id: string;
  row: number;
  col: number;
  blob: Blob;
  thumbnail: Blob;
  width: number;
  height: number;
}

export interface SplitRequest {
  type: 'split';
  image: ImageBitmap;
  grid: PuzzleGrid;
  puzzleId: string;
  tileSize: {
    width: number;
    height: number;
  };
  thumbnailSize: number;
}

export interface SplitResponse {
  type: 'split-result';
  puzzleId: string;
  pieces: SplitPieceData[];
}

export interface SplitProgress {
  type: 'split-progress';
  processed: number;
  total: number;
}

export type SplitWorkerMessage = SplitRequest;
export interface SplitError {
  type: 'split-error';
  message: string;
}

export type SplitWorkerResponse = SplitResponse | SplitProgress | SplitError;

export interface EmbeddingPayload {
  pieceId: string;
  embedding: Float32Array;
  row: number;
  col: number;
  width: number;
  height: number;
}

export interface MatchRequest {
  type: 'match';
  puzzleId: string;
  targetEmbedding: Float32Array;
  pieces: EmbeddingPayload[];
}
export interface MatchResponse {
  type: 'match-result';
  puzzleId: string;
  match?: {
    pieceId: string;
    row: number;
    col: number;
    score: number;
  };
  candidates: Array<{
    pieceId: string;
    row: number;
    col: number;
    score: number;
    rank: number;
  }>;
}

export interface MatchError {
  type: 'match-error';
  message: string;
}

export interface MatchProgress {
  type: 'match-progress';
  processed: number;
  total: number;
}

export type MatchWorkerMessage = MatchRequest;
export type MatchWorkerResponse = MatchResponse | MatchProgress | MatchError;
