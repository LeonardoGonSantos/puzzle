import { useCallback, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { usePuzzleStore } from '../state/puzzleStore';
import type { MatchResult, PieceRecord, PuzzleImage } from '../types/puzzle';
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
} from '../storage/pieceStorage';
import { useSplitWorker } from './useSplitWorker';
import { useMatchWorker } from './useMatchWorker';
import type { EmbeddingPayload } from '../workers/types';
import { embedImageBitmap, loadEmbeddingModel } from '../utils/embedding';

interface UploadPayload {
  file: File;
  pieceCount: number;
}

const THUMBNAIL_SIZE = 160;
const MATCH_THRESHOLD = 0.78;

export const usePuzzleController = () => {
  const {
    image,
    pieces,
    phase,
    matchedPiece,
    setImage,
    setPieces,
    updatePiece,
    setPhase,
    setMatchResult,
    reset,
  } = usePuzzleStore(
    useShallow((state) => ({
      image: state.image,
      pieces: state.pieces,
      phase: state.phase,
      matchedPiece: state.matchedPiece,
      setImage: state.setImage,
      setPieces: state.setPieces,
      updatePiece: state.updatePiece,
      setPhase: state.setPhase,
      setMatchResult: state.setMatchResult,
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

  const disposePieceUrls = () => {
    pieceUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    pieceUrlsRef.current = [];
  };

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
    reset();
  }, [reset]);

  const handlePuzzleSelected = useCallback(
    async ({ file, pieceCount }: UploadPayload) => {
      try {
        if (!pieceCount || pieceCount < 1) {
          throw new Error('Informe a quantidade de peças do quebra-cabeça.');
        }
        await resetState();
        const grid = deriveGrid(pieceCount);
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
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Falha ao processar imagem';
        setControllerError(message);
        setErrorContext('upload');
      }
    },
    [resetState, setImage, setPhase],
  );

  const splitPuzzle = useCallback(async () => {
    if (!image || !puzzleBitmapRef.current) {
      setControllerError('Envie uma imagem do quebra-cabeça antes de dividir.');
      return;
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

      setPieces(records);
      setPhase('ready');
      setSplitProgress(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao dividir a imagem';
      setControllerError(message);
      setErrorContext('split');
      setPhase('idle');
      setSplitProgress(null);
    }
  }, [image, setPhase, setPieces, splitImage]);

  const ensurePieceEmbedding = useCallback(
    async (piece: PieceRecord) => {
      if (embeddingCache.current.has(piece.id)) {
        return embeddingCache.current.get(piece.id) as Float32Array;
      }

      const embeddingKey = piece.embeddingKey ?? `${piece.id}-embedding`;
      const stored = await loadEmbedding(embeddingKey);
      if (stored) {
        embeddingCache.current.set(piece.id, stored);
        return stored;
      }

      const blob = await loadPieceBlob(piece.blobKey);
      if (!blob) {
        throw new Error('Peça não encontrada no armazenamento local.');
      }
      const bitmap = await createImageBitmap(blob);
      const embedding = await embedImageBitmap(bitmap);
      bitmap.close();
      await saveEmbedding(embeddingKey, embedding);
      embeddingCache.current.set(piece.id, embedding);
      updatePiece(piece.id, { embeddingKey });
      return embedding;
    },
    [updatePiece],
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

        const match = await runMatch(
          {
            puzzleId: image.id,
            targetEmbedding,
            pieces: pieceEmbeddings,
          },
          {
            onProgress: (processed, total) => setMatchProgress({ processed, total }),
            onError: (message) => setControllerError(message),
          },
        );

        const evaluatedMatch: MatchResult | undefined =
          match && match.score >= MATCH_THRESHOLD ? match : undefined;

        if (evaluatedMatch) {
          const score = evaluatedMatch.score;
          setMatchResult(evaluatedMatch);
          updatePiece(evaluatedMatch.pieceId, { score });
        } else {
          setMatchResult(undefined);
        }
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
      runMatch,
      setMatchResult,
      setPhase,
      updatePiece,
    ],
  );

  const state = useMemo(
    () => ({
      image,
      pieces,
      phase,
      matchedPiece,
      controllerError,
      errorContext,
      splitProgress,
      matchProgress,
      modelStatus,
    }),
    [
      controllerError,
      errorContext,
      image,
      matchProgress,
      matchedPiece,
      modelStatus,
      phase,
      pieces,
      splitProgress,
    ],
  );

  return {
    ...state,
    handlePuzzleSelected,
    splitPuzzle,
    handlePieceUpload,
    reset: resetState,
  };
};
