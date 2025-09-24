/// <reference lib="webworker" />
import type { MatchWorkerMessage, MatchWorkerResponse } from './types';

const cosineSimilarity = (a: Float32Array, b: Float32Array) => {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    const av = a[i];
    const bv = b[i];
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const TOP_K = 5;

const handleMatch = (message: MatchWorkerMessage) => {
  const { pieces, targetEmbedding, puzzleId } = message;
  const topCandidates: Array<{
    pieceId: string;
    row: number;
    col: number;
    score: number;
  }> = [];

  pieces.forEach((piece, index) => {
    const score = cosineSimilarity(targetEmbedding, piece.embedding);
    topCandidates.push({
      pieceId: piece.pieceId,
      row: piece.row,
      col: piece.col,
      score,
    });
    topCandidates.sort((a, b) => b.score - a.score);
    if (topCandidates.length > TOP_K) {
      topCandidates.length = TOP_K;
    }

    const progress: MatchWorkerResponse = {
      type: 'match-progress',
      processed: index + 1,
      total: pieces.length,
    };
    (self as DedicatedWorkerGlobalScope).postMessage(progress);
  });

  const ranked = topCandidates.map((candidate, index) => ({
    ...candidate,
    rank: index + 1,
  }));

  const bestCandidate = ranked[0];
  const response: MatchWorkerResponse = {
    type: 'match-result',
    puzzleId,
    match:
      bestCandidate && bestCandidate.score > 0
        ? {
            pieceId: bestCandidate.pieceId,
            row: bestCandidate.row,
            col: bestCandidate.col,
            score: bestCandidate.score,
          }
        : undefined,
    candidates: ranked,
  };
  (self as DedicatedWorkerGlobalScope).postMessage(response);
};

self.onmessage = (event: MessageEvent<MatchWorkerMessage>) => {
  const { data } = event;
  if (data.type === 'match') {
    try {
      handleMatch(data);
    } catch (error) {
      console.error('Match worker failed', error);
      const response: MatchWorkerResponse = {
        type: 'match-error',
        message: error instanceof Error ? error.message : 'Unknown worker error',
      };
      (self as DedicatedWorkerGlobalScope).postMessage(response);
    }
  }
};

export {};
