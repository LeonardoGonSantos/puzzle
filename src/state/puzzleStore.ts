import { create } from 'zustand';
import type {
  MatchResult,
  PieceRecord,
  PuzzleError,
  PuzzleImage,
  ProcessingPhase,
} from '../types/puzzle';

interface PuzzleState {
  image?: PuzzleImage;
  pieces: PieceRecord[];
  phase: ProcessingPhase;
  error?: PuzzleError;
  matchedPiece?: MatchResult;
  setImage: (image: PuzzleImage) => void;
  setPieces: (pieces: PieceRecord[]) => void;
  updatePiece: (pieceId: string, data: Partial<PieceRecord>) => void;
  setPhase: (phase: ProcessingPhase) => void;
  setError: (error?: PuzzleError) => void;
  setMatchResult: (result?: MatchResult) => void;
  reset: () => void;
}

const initialState = {
  pieces: [],
  phase: 'idle' as ProcessingPhase,
};

export const usePuzzleStore = create<PuzzleState>((set) => ({
  ...initialState,
  setImage: (image) =>
    set((state) => ({
      image,
      pieces: [],
      matchedPiece: undefined,
      error: undefined,
      phase: state.phase === 'matching' ? 'idle' : state.phase,
    })),
  setPieces: (pieces) =>
    set({
      pieces,
      phase: pieces.length > 0 ? 'ready' : 'idle',
    }),
  updatePiece: (pieceId, data) =>
    set((state) => ({
      pieces: state.pieces.map((piece) => (piece.id === pieceId ? { ...piece, ...data } : piece)),
    })),
  setPhase: (phase) => set({ phase }),
  setError: (error) => set({ error }),
  setMatchResult: (result) =>
    set({
      matchedPiece: result,
      phase: result ? 'match-found' : 'match-not-found',
    }),
  reset: () => set(initialState),
}));
