import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { usePuzzleStore } from '../state/puzzleStore';
import type {
  HierarchyNode,
  MatchCandidate,
  MatchResult,
  PieceRecord,
  PuzzleImage,
} from '../types/puzzle';
import { createId } from '../utils/id';
import { deriveGrid, calculateTileSize } from '../utils/grid';
import { fileToImageBitmap, imageBitmapToDataUrl } from '../utils/image';
import {
  clearStorage,
  loadEmbedding,
  loadPieceBlob,
  saveEmbedding,
  savePieceBlob,
  saveThumbnailBlob,
  saveHierarchy,
} from '../storage/pieceStorage';
import { useSplitWorker } from './useSplitWorker';
import { useMatchWorker } from './useMatchWorker';
import type { EmbeddingPayload, HierarchyNodePayload } from '../workers/types';
import { embedImageBitmap, loadEmbeddingModel } from '../utils/embedding';
import { buildHierarchyNodes, DEFAULT_HIERARCHY_CONFIG } from '../utils/hierarchy';

interface UploadPayload {
  file: File;
  pieceCount?: number;
}

const THUMBNAIL_SIZE = 160;
const MATCH_THRESHOLD = 0.78;

export const usePuzzleController = () => {
  const {
    image,
    pieces,
    phase,
    matchedPiece,
    topMatches,
    hierarchyNodes,
    hierarchyPath,
    step,
    setImage,
    setPieces,
    updatePiece,
    setPhase,
    setMatchResult,
    setHierarchyNodes,
    setHierarchyPath,
    updateGrid,
    setStep,
    reset,
  } = usePuzzleStore(
    useShallow((state) => ({
      image: state.image,
      pieces: state.pieces,
      phase: state.phase,
      matchedPiece: state.matchedPiece,
      topMatches: state.topMatches,
      hierarchyNodes: state.hierarchyNodes,
      hierarchyPath: state.hierarchyPath,
      step: state.step,
      setImage: state.setImage,
      setPieces: state.setPieces,
      updatePiece: state.updatePiece,
      setPhase: state.setPhase,
      setMatchResult: state.setMatchResult,
      setHierarchyNodes: state.setHierarchyNodes,
      setHierarchyPath: state.setHierarchyPath,
      updateGrid: state.updateGrid,
      setStep: state.setStep,
      reset: state.reset,
    })),
  );
  const { splitImage } = useSplitWorker();
  const { runMatch } = useMatchWorker();

  const [controllerError, setControllerError] = useState<string | undefined>();
  const [errorContext, setErrorContext] = useState<'upload' | 'split' | 'match' | null>(null);
  const [splitProgress, setSplitProgress] = useState<{ processed: number; total: number } | null>(
    null,
  );
  const [matchProgress, setMatchProgress] = useState<{ processed: number; total: number } | null>(
    null,
  );
  const [modelStatus, setModelStatus] = useState<'idle' | 'loading' | 'ready'>('idle');

  const puzzleBitmapRef = useRef<ImageBitmap | null>(null);
  const pieceUrlsRef = useRef<string[]>([]);
  const embeddingCache = useRef<Map<string, Float32Array>>(new Map());
  const embeddingSizeRef = useRef<number | null>(null);
  const pieceMapRef = useRef<Map<string, PieceRecord>>(new Map());
  const hierarchyNodesRef = useRef<HierarchyNode[]>([]);
  const nodeEmbeddingCache = useRef<Map<string, Float32Array>>(new Map());

  const disposePieceUrls = useCallback(() => {
    pieceUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    pieceUrlsRef.current = [];
  }, []);

  const resetState = useCallback(async () => {
    disposePieceUrls();
    embeddingCache.current.clear();
    puzzleBitmapRef.current?.close?.();
    puzzleBitmapRef.current = null;
    setSplitProgress(null);
    setMatchProgress(null);
    setControllerError(undefined);
    setErrorContext(null);
    setModelStatus('idle');
    await clearStorage();
    hierarchyNodesRef.current = [];
    nodeEmbeddingCache.current.clear();
    embeddingSizeRef.current = null;
    pieceMapRef.current.clear();
    setHierarchyNodes([]);
    setHierarchyPath([]);
    setStep(1);
    reset();
  }, [disposePieceUrls, reset, setHierarchyNodes, setHierarchyPath, setStep]);

  const handlePuzzleSelected = useCallback(
    async ({ file, pieceCount }: UploadPayload) => {
      try {
        await resetState();
        const validCount = pieceCount && pieceCount > 0 ? pieceCount : 1;
        const grid = deriveGrid(validCount);
        const bitmap = await fileToImageBitmap(file);
        puzzleBitmapRef.current = bitmap;
        const dataUrl = await imageBitmapToDataUrl(bitmap);
        const puzzleImage: PuzzleImage = {
          id: createId('puzzle'),
          dataUrl,
          width: bitmap.width,
          height: bitmap.height,
          grid,
        };
        setImage(puzzleImage);
        setPhase('idle');
        setStep(2);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Falha ao processar imagem';
        setControllerError(message);
        setErrorContext('upload');
      }
    },
    [resetState, setImage, setPhase, setStep],
  );

  const splitPuzzle = useCallback(async () => {
    if (!image) {
      setControllerError('Envie uma imagem do quebra-cabeça antes de dividir.');
      return;
    }

    if (!puzzleBitmapRef.current) {
      try {
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        puzzleBitmapRef.current = await createImageBitmap(blob);
      } catch {
        setControllerError('Não foi possível recuperar a imagem original. Envie novamente.');
        setErrorContext('upload');
        return;
      }
    }

    try {
      setControllerError(undefined);
      setErrorContext(null);
      setPhase('splitting');
      setSplitProgress({ processed: 0, total: image.grid.totalPieces });

      const tileSize = calculateTileSize(image.width, image.height, image.grid);
      const result = await splitImage(
        {
          image: puzzleBitmapRef.current,
          grid: image.grid,
          puzzleId: image.id,
          tileSize,
          thumbnailSize: THUMBNAIL_SIZE,
        },
        {
          onProgress: (processed, total) => setSplitProgress({ processed, total }),
          onError: (message) => setControllerError(message),
        },
      );

      puzzleBitmapRef.current = null;
      disposePieceUrls();

      const records: PieceRecord[] = [];
      await Promise.all(
        result.map(async (piece) => {
          const blobKey = `${piece.id}-blob`;
          const thumbnailKey = `${piece.id}-thumb`;
          const embeddingKey = `${piece.id}-embedding`;
          await savePieceBlob(blobKey, piece.blob);
          await saveThumbnailBlob(thumbnailKey, piece.thumbnail);
          const thumbUrl = URL.createObjectURL(piece.thumbnail);
          pieceUrlsRef.current.push(thumbUrl);
          records.push({
            id: piece.id,
            row: piece.row,
            col: piece.col,
            width: piece.width,
            height: piece.height,
            blobKey,
            thumbnailKey,
            thumbnailUrl: thumbUrl,
            embeddingKey,
          });
        }),
      );

      const hierarchy = buildHierarchyNodes(records, image, DEFAULT_HIERARCHY_CONFIG);
      hierarchyNodesRef.current = hierarchy;
      setHierarchyNodes(hierarchy);
      await saveHierarchy(image.id, hierarchy);

      setPieces(records);
      setPhase('ready');
      setStep(3);
      setSplitProgress(null);
      pieceMapRef.current = new Map(records.map((record) => [record.id, record]));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao dividir a imagem';
      setControllerError(message);
      setErrorContext('split');
      setPhase('idle');
      setSplitProgress(null);
    }
  }, [
    disposePieceUrls,
    image,
    setControllerError,
    setErrorContext,
    setPhase,
    setPieces,
    setHierarchyNodes,
    setStep,
    splitImage,
  ]);

  const ensurePieceEmbedding = useCallback(
    async (piece: PieceRecord) => {
      if (embeddingCache.current.has(piece.id)) {
        return embeddingCache.current.get(piece.id) as Float32Array;
      }

      const embeddingKey = piece.embeddingKey ?? `${piece.id}-embedding`;
      const stored = await loadEmbedding(embeddingKey);
      if (stored) {
        embeddingCache.current.set(piece.id, stored);
        if (embeddingSizeRef.current === null) {
          embeddingSizeRef.current = stored.length;
        }
        return stored;
      }

      const blob = await loadPieceBlob(piece.blobKey);
      if (!blob) {
        throw new Error('Peça não encontrada no armazenamento local.');
      }
      const bitmap = await createImageBitmap(blob);
      const embedding = await embedImageBitmap(bitmap);
      bitmap.close();
      if (embeddingSizeRef.current === null) {
        embeddingSizeRef.current = embedding.length;
      }
      await saveEmbedding(embeddingKey, embedding);
      embeddingCache.current.set(piece.id, embedding);
      updatePiece(piece.id, { embeddingKey });
      pieceMapRef.current.set(piece.id, { ...piece, embeddingKey });
      return embedding;
    },
    [updatePiece],
  );

  const ensureNodeEmbedding = useCallback(
    async (node: HierarchyNode) => {
      if (nodeEmbeddingCache.current.has(node.id)) {
        return nodeEmbeddingCache.current.get(node.id) as Float32Array;
      }

      const embeddings: Float32Array[] = [];
      for (const pieceId of node.pieceIds) {
        const piece = pieceMapRef.current.get(pieceId);
        if (!piece) continue;
        const embedding = await ensurePieceEmbedding(piece);
        embeddings.push(embedding);
      }

      if (embeddings.length === 0) {
        const size = embeddingSizeRef.current ?? 1;
        const placeholder = new Float32Array(size);
        nodeEmbeddingCache.current.set(node.id, placeholder);
        return placeholder;
      }

      const dimension = embeddings[0].length;
      const buffer = new Float32Array(dimension);
      embeddings.forEach((vector) => {
        for (let index = 0; index < dimension; index += 1) {
          buffer[index] += vector[index];
        }
      });
      for (let index = 0; index < dimension; index += 1) {
        buffer[index] /= embeddings.length;
      }

      nodeEmbeddingCache.current.set(node.id, buffer);
      return buffer;
    },
    [ensurePieceEmbedding],
  );

  const handlePieceUpload = useCallback(
    async (file: File) => {
      if (!image) {
        setControllerError('Divida o quebra-cabeça antes de localizar uma peça.');
        return;
      }
      if (pieces.length === 0) {
        setControllerError('Não há peças mapeadas ainda.');
        return;
      }

      try {
        setControllerError(undefined);
        setErrorContext(null);
        setPhase('matching');
        setMatchProgress({ processed: 0, total: pieces.length });

        if (modelStatus === 'idle') {
          setModelStatus('loading');
          await loadEmbeddingModel();
          setModelStatus('ready');
        }

        const targetBitmap = await fileToImageBitmap(file, 512);
        const targetEmbedding = await embedImageBitmap(targetBitmap);
        targetBitmap.close();

        const pieceEmbeddings: EmbeddingPayload[] = [];
        for (const piece of pieces) {
          const embedding = await ensurePieceEmbedding(piece);
          pieceEmbeddings.push({
            pieceId: piece.id,
            embedding,
            row: piece.row,
            col: piece.col,
            width: piece.width,
            height: piece.height,
          });
        }

        const currentHierarchy = hierarchyNodesRef.current.length
          ? hierarchyNodesRef.current
          : hierarchyNodes;

        let hierarchyPayload: HierarchyNodePayload[] | undefined;
        let rootNodeIds: string[] | undefined;

        if (currentHierarchy.length > 0) {
          hierarchyPayload = await Promise.all(
            currentHierarchy.map(async (node) => ({
              id: node.id,
              level: node.level,
              parentId: node.parentId,
              pieceIds: node.pieceIds,
              bounds: node.bounds,
              embedding: await ensureNodeEmbedding(node),
            })),
          );
          rootNodeIds = hierarchyPayload.filter((node) => node.level === 0).map((node) => node.id);
        }

        const result = await runMatch(
          {
            puzzleId: image.id,
            targetEmbedding,
            pieces: pieceEmbeddings,
            hierarchyNodes: hierarchyPayload,
            rootNodeIds,
          },
          {
            onProgress: (processed, total) => setMatchProgress({ processed, total }),
            onError: (message) => setControllerError(message),
          },
        );
        const candidates: MatchCandidate[] = (result.candidates ?? []).map((candidate) => ({
          pieceId: candidate.pieceId,
          row: candidate.row,
          col: candidate.col,
          score: candidate.score,
          rank: candidate.rank,
        }));

        candidates.forEach((candidate) => {
          updatePiece(candidate.pieceId, { score: candidate.score });
          const pieceRecord = pieceMapRef.current.get(candidate.pieceId);
          if (pieceRecord) {
            pieceMapRef.current.set(candidate.pieceId, {
              ...pieceRecord,
              score: candidate.score,
            });
          }
        });

        const evaluatedMatch: MatchResult | undefined =
          result.match && result.match.score >= MATCH_THRESHOLD ? result.match : undefined;

        setMatchResult(evaluatedMatch, candidates);
        setHierarchyPath(result.path ?? []);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Falha ao comparar a peça';
        setControllerError(message);
        setErrorContext('match');
        setPhase('ready');
      } finally {
        setMatchProgress(null);
      }
    },
    [
      image,
      pieces,
      modelStatus,
      ensurePieceEmbedding,
      ensureNodeEmbedding,
      hierarchyNodes,
      runMatch,
      setMatchResult,
      setHierarchyPath,
      setPhase,
      updatePiece,
    ],
  );

  const handlePieceCountChange = useCallback(
    (pieceCount: number) => {
      if (!Number.isFinite(pieceCount) || pieceCount < 1) {
        setControllerError('Informe um número válido de peças (>= 1).');
        setErrorContext('upload');
        return;
      }

      if (!image) {
        setControllerError('Envie a foto do quebra-cabeça antes de definir a quantidade de peças.');
        setErrorContext('upload');
        return;
      }

      setControllerError(undefined);
      setErrorContext(null);

      const grid = deriveGrid(pieceCount);
      disposePieceUrls();
      embeddingCache.current.clear();
      hierarchyNodesRef.current = [];
      nodeEmbeddingCache.current.clear();
      pieceMapRef.current.clear();
      setMatchResult(undefined, []);
      setHierarchyNodes([]);
      setHierarchyPath([]);
      setSplitProgress(null);
      setMatchProgress(null);
      updateGrid(grid);
      setPhase('idle');
    },
    [
      disposePieceUrls,
      image,
      setControllerError,
      setErrorContext,
      setMatchResult,
      updateGrid,
      setHierarchyNodes,
      setHierarchyPath,
      setSplitProgress,
      setMatchProgress,
      setPhase,
    ],
  );

  useEffect(() => {
    if (hierarchyNodes.length === 0) {
      hierarchyNodesRef.current = [];
      return;
    }
    hierarchyNodesRef.current = hierarchyNodes;
  }, [hierarchyNodes]);

  const state = useMemo(
    () => ({
      image,
      pieces,
      phase,
      matchedPiece,
      topMatches,
      hierarchyNodes,
      hierarchyPath,
      controllerError,
      errorContext,
      splitProgress,
      matchProgress,
      modelStatus,
      step,
    }),
    [
      controllerError,
      errorContext,
      image,
      matchProgress,
      matchedPiece,
      topMatches,
      hierarchyNodes,
      hierarchyPath,
      modelStatus,
      phase,
      pieces,
      splitProgress,
      step,
    ],
  );

  return {
    ...state,
    handlePuzzleSelected,
    splitPuzzle,
    handlePieceUpload,
    handlePieceCountChange,
    reset: resetState,
  };
};
