import { useCallback, useEffect, useRef } from 'react';
import type {
  MatchWorkerMessage,
  MatchWorkerResponse,
  EmbeddingPayload,
  HierarchyNodePayload,
} from '../workers/types';

interface MatchArgs {
  puzzleId: string;
  targetEmbedding: Float32Array;
  pieces: EmbeddingPayload[];
  hierarchyNodes?: HierarchyNodePayload[];
  rootNodeIds?: string[];
}

interface MatchCallbacks {
  onProgress?: (processed: number, total: number) => void;
  onError?: (message: string) => void;
}

type WorkerResult = Extract<MatchWorkerResponse, { type: 'match-result' }>;

type Resolver = {
  resolve: (result: WorkerResult) => void;
  reject: (error: Error) => void;
  callbacks?: MatchCallbacks;
};

const createWorker = () =>
  new Worker(new URL('../workers/match.worker.ts', import.meta.url), {
    type: 'module',
  });

export const useMatchWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const resolverRef = useRef<Resolver | null>(null);

  useEffect(() => {
    workerRef.current = createWorker();
    const handleMessage = (event: MessageEvent<MatchWorkerResponse>) => {
      const payload = event.data;
      const resolver = resolverRef.current;
      if (!resolver) return;

      if (payload.type === 'match-progress') {
        resolver.callbacks?.onProgress?.(payload.processed, payload.total);
        return;
      }

      if (payload.type === 'match-error') {
        const error = new Error(payload.message);
        resolver.callbacks?.onError?.(payload.message);
        resolver.reject(error);
        resolverRef.current = null;
        return;
      }

      if (payload.type === 'match-result') {
        resolver.resolve(payload);
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

  const runMatch = useCallback((args: MatchArgs, callbacks?: MatchCallbacks) => {
    if (!workerRef.current) {
      workerRef.current = createWorker();
    }
    const worker = workerRef.current;
    if (resolverRef.current) {
      resolverRef.current.reject(new Error('Matching already in progress'));
    }

    return new Promise<WorkerResult>((resolve, reject) => {
      resolverRef.current = { resolve, reject, callbacks };
      const message: MatchWorkerMessage = {
        type: 'match',
        ...args,
      };
      worker.postMessage(message);
    });
  }, []);

  return {
    runMatch,
  };
};
