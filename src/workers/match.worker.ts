/// <reference lib="webworker" />
import type {
  EmbeddingPayload,
  HierarchyNodePayload,
  MatchWorkerMessage,
  MatchWorkerResponse,
} from './types';

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
const HIERARCHY_THRESHOLD = 0.55;

interface TraversalResult {
  leaf?: HierarchyNodePayload;
  path: Array<{
    node: HierarchyNodePayload;
    score: number;
  }>;
}

const groupChildren = (nodes: HierarchyNodePayload[]) => {
  const map = new Map<string, HierarchyNodePayload[]>();
  nodes.forEach((node) => {
    if (!node.parentId) return;
    if (!map.has(node.parentId)) {
      map.set(node.parentId, []);
    }
    map.get(node.parentId)!.push(node);
  });
  return map;
};

const selectBestNode = (candidateNodes: HierarchyNodePayload[], target: Float32Array) => {
  let bestNode: HierarchyNodePayload | undefined;
  let bestScore = -Infinity;
  candidateNodes.forEach((node) => {
    const score = cosineSimilarity(target, node.embedding);
    if (score > bestScore) {
      bestScore = score;
      bestNode = node;
    }
  });
  return { bestNode, bestScore };
};

const traverseHierarchy = (
  hierarchyNodes: HierarchyNodePayload[],
  rootNodeIds: string[] | undefined,
  targetEmbedding: Float32Array,
): TraversalResult => {
  if (hierarchyNodes.length === 0) {
    return { path: [] };
  }

  const nodesById = new Map<string, HierarchyNodePayload>();
  hierarchyNodes.forEach((node) => nodesById.set(node.id, node));

  const childrenMap = groupChildren(hierarchyNodes);
  const roots: HierarchyNodePayload[] = rootNodeIds
    ? rootNodeIds
        .map((id) => nodesById.get(id))
        .filter((node): node is HierarchyNodePayload => Boolean(node))
    : hierarchyNodes.filter((node) => node.level === 0);

  let candidateNodes = roots;
  const path: TraversalResult['path'] = [];
  let leaf: HierarchyNodePayload | undefined;

  while (candidateNodes.length > 0) {
    const { bestNode, bestScore } = selectBestNode(candidateNodes, targetEmbedding);
    if (!bestNode) {
      break;
    }
    path.push({ node: bestNode, score: bestScore });
    const children = childrenMap.get(bestNode.id) ?? [];
    if (children.length === 0) {
      leaf = bestNode;
      break;
    }
    candidateNodes = children;
  }

  if (!leaf && path.length > 0) {
    leaf = path[path.length - 1].node;
  }

  return { leaf, path };
};

const evaluatePieces = (
  targetEmbedding: Float32Array,
  pieces: EmbeddingPayload[],
  postProgress: (processed: number, total: number) => void,
) => {
  const candidates: Array<{ pieceId: string; row: number; col: number; score: number }> = [];
  let bestScore = -Infinity;
  let bestCandidate: { pieceId: string; row: number; col: number; score: number } | undefined;

  pieces.forEach((piece, index) => {
    const score = cosineSimilarity(targetEmbedding, piece.embedding);
    const candidate = {
      pieceId: piece.pieceId,
      row: piece.row,
      col: piece.col,
      score,
    };
    candidates.push(candidate);
    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
    postProgress(index + 1, pieces.length);
  });

  candidates.sort((a, b) => b.score - a.score);
  const ranked = candidates.slice(0, TOP_K).map((candidate, index) => ({
    ...candidate,
    rank: index + 1,
  }));

  return {
    bestCandidate,
    ranked,
  };
};

const handleMatch = (message: MatchWorkerMessage) => {
  const { pieces, targetEmbedding, puzzleId, hierarchyNodes, rootNodeIds } = message;

  const postProgress = (processed: number, total: number) => {
    const progress: MatchWorkerResponse = {
      type: 'match-progress',
      processed,
      total,
    };
    (self as DedicatedWorkerGlobalScope).postMessage(progress);
  };

  let traversal: TraversalResult = { path: [] };
  if (hierarchyNodes && hierarchyNodes.length > 0) {
    traversal = traverseHierarchy(hierarchyNodes, rootNodeIds, targetEmbedding);
  }

  let candidatePieces = pieces;
  if (traversal.leaf && traversal.leaf.pieceIds.length > 0) {
    const pieceSet = new Set(traversal.leaf.pieceIds);
    const subset = pieces.filter((piece) => pieceSet.has(piece.pieceId));
    if (subset.length > 0) {
      candidatePieces = subset;
    }
  }

  const evaluation = evaluatePieces(targetEmbedding, candidatePieces, postProgress);
  let ranked = evaluation.ranked;
  let bestCandidate =
    evaluation.bestCandidate && evaluation.bestCandidate.score > 0
      ? evaluation.bestCandidate
      : undefined;

  // Fallback: if hierarchy path exists but best candidate ficou abaixo do threshold, considera todas as peças.
  if (
    hierarchyNodes &&
    hierarchyNodes.length > 0 &&
    traversal.path.length > 0 &&
    (!bestCandidate || bestCandidate.score < HIERARCHY_THRESHOLD)
  ) {
    const fallbackResult = evaluatePieces(targetEmbedding, pieces, () => {});
    if (
      fallbackResult.bestCandidate &&
      fallbackResult.bestCandidate.score > (bestCandidate?.score ?? 0)
    ) {
      ranked = fallbackResult.ranked;
      bestCandidate = fallbackResult.bestCandidate;
    }
  }

  const response: MatchWorkerResponse = {
    type: 'match-result',
    puzzleId,
    match: ranked[0]
      ? {
          pieceId: ranked[0].pieceId,
          row: ranked[0].row,
          col: ranked[0].col,
          score: ranked[0].score,
        }
      : undefined,
    candidates: ranked,
    path: traversal.path.map(({ node, score }) => ({
      nodeId: node.id,
      level: node.level,
      score,
      bounds: node.bounds,
    })),
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
