import { create } from 'zustand';
import type {
  HierarchyNode,
  HierarchyPathItem,
  MatchCandidate,
  MatchResult,
  PieceRecord,
  PuzzleError,
  PuzzleImage,
  ProcessingPhase,
  PuzzleGrid,
} from '../types/puzzle';

interface PuzzleState {
  image?: PuzzleImage;
  pieces: PieceRecord[];
  phase: ProcessingPhase;
  error?: PuzzleError;
  matchedPiece?: MatchResult;
  topMatches: MatchCandidate[];
  hierarchyNodes: HierarchyNode[];
  hierarchyPath: HierarchyPathItem[];
  setImage: (image: PuzzleImage) => void;
  setPieces: (pieces: PieceRecord[]) => void;
  updatePiece: (pieceId: string, data: Partial<PieceRecord>) => void;
  setPhase: (phase: ProcessingPhase) => void;
  setError: (error?: PuzzleError) => void;
  setMatchResult: (result?: MatchResult, candidates?: MatchCandidate[]) => void;
  updateGrid: (grid: PuzzleGrid) => void;
  setHierarchyNodes: (nodes: HierarchyNode[]) => void;
  setHierarchyPath: (path: HierarchyPathItem[]) => void;
  reset: () => void;
}

const initialState: Pick<
  PuzzleState,
  'pieces' | 'phase' | 'topMatches' | 'hierarchyNodes' | 'hierarchyPath'
> = {
  pieces: [],
  phase: 'idle',
  topMatches: [],
  hierarchyNodes: [],
  hierarchyPath: [],
};

export const usePuzzleStore = create<PuzzleState>((set) => ({
  ...initialState,
  setImage: (image) =>
    set((state) => ({
      image,
      pieces: [],
      matchedPiece: undefined,
      topMatches: [],
      hierarchyNodes: [],
      hierarchyPath: [],
      error: undefined,
      phase: state.phase === 'matching' ? 'idle' : state.phase,
    })),
  setPieces: (pieces) =>
    set({
      pieces,
      topMatches: [],
      matchedPiece: undefined,
      hierarchyPath: [],
      phase: pieces.length > 0 ? 'ready' : 'idle',
    }),
  updatePiece: (pieceId, data) =>
    set((state) => ({
      pieces: state.pieces.map((piece) => (piece.id === pieceId ? { ...piece, ...data } : piece)),
    })),
  setPhase: (phase) => set({ phase }),
  setError: (error) => set({ error }),
  setMatchResult: (result, candidates = []) =>
    set({
      matchedPiece: result,
      topMatches: candidates,
      phase:
        candidates.length > 0 ? (result ? 'match-found' : 'match-not-found') : 'match-not-found',
    }),
  updateGrid: (grid) =>
    set((state) => {
      if (!state.image) return state;
      return {
        image: { ...state.image, grid },
        pieces: [],
        matchedPiece: undefined,
        topMatches: [],
        hierarchyNodes: [],
        hierarchyPath: [],
        phase: 'idle',
      };
    }),
  setHierarchyNodes: (nodes) => set({ hierarchyNodes: nodes }),
  setHierarchyPath: (path) => set({ hierarchyPath: path }),
  reset: () => set(initialState),
}));
