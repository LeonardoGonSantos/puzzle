import { useCallback, useEffect, useRef } from 'react';
import type { PuzzleGrid } from '../types/puzzle';
import type { SplitWorkerMessage, SplitWorkerResponse, SplitPieceData } from '../workers/types';

interface SplitArgs {
  image: ImageBitmap;
  grid: PuzzleGrid;
  puzzleId: string;
  tileSize: { width: number; height: number };
  thumbnailSize: number;
}

interface SplitCallbacks {
  onProgress?: (processed: number, total: number) => void;
  onError?: (message: string) => void;
}

type Resolver = {
  resolve: (pieces: SplitPieceData[]) => void;
  reject: (error: Error) => void;
  callbacks?: SplitCallbacks;
};

const createSplitWorker = () =>
  new Worker(new URL('../workers/split.worker.ts', import.meta.url), {
    type: 'module',
  });

export const useSplitWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const resolverRef = useRef<Resolver | null>(null);

  useEffect(() => {
    workerRef.current = createSplitWorker();
    const handleMessage = (event: MessageEvent<SplitWorkerResponse>) => {
      const payload = event.data;
      const resolver = resolverRef.current;
      if (!resolver) return;

      if (payload.type === 'split-progress') {
        resolver.callbacks?.onProgress?.(payload.processed, payload.total);
      }

      if (payload.type === 'split-error') {
        const error = new Error(payload.message);
        resolver.callbacks?.onError?.(payload.message);
        resolver.reject(error);
        resolverRef.current = null;
      }

      if (payload.type === 'split-result') {
        resolver.resolve(payload.pieces);
        resolverRef.current = null;
      }
    };

    workerRef.current.addEventListener('message', handleMessage);

    return () => {
      workerRef.current?.removeEventListener('message', handleMessage);
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const splitImage = useCallback((args: SplitArgs, callbacks?: SplitCallbacks) => {
    if (!workerRef.current) {
      workerRef.current = createSplitWorker();
    }
    const worker = workerRef.current;
    if (resolverRef.current) {
      resolverRef.current.reject(new Error('Split already in progress'));
    }

    return new Promise<SplitPieceData[]>((resolve, reject) => {
      resolverRef.current = { resolve, reject, callbacks };
      const message: SplitWorkerMessage = {
        type: 'split',
        ...args,
      };
      worker.postMessage(message, [args.image]);
    });
  }, []);

  return {
    splitImage,
  };
};
