import './App.css';
import { PieceGallery } from './components/PieceGallery';
import { PieceMatcher } from './components/PieceMatcher';
import { PuzzleCanvas } from './components/PuzzleCanvas';
import { PuzzleUploader } from './components/PuzzleUploader';
import { StatusBanner } from './components/StatusBanner';
import { usePuzzleController } from './hooks/usePuzzleController';

function App() {
  const {
    image,
    pieces,
    phase,
    matchedPiece,
    topMatches,
    controllerError,
    errorContext,
    splitProgress,
    matchProgress,
    modelStatus,
    handlePuzzleSelected,
    splitPuzzle,
    handlePieceUpload,
    handlePieceCountChange,
    reset,
  } = usePuzzleController();

  const isSplitting = phase === 'splitting';
  const isMatching = phase === 'matching';

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">Puzzle Piece Locator</h1>
        <p className="app-subtitle">
          Faça upload do quebra-cabeça completo, deixe que o app fatie as peças e envie uma foto da
          peça solta para descobrir onde ela se encaixa.
        </p>
      </header>

      {controllerError && <StatusBanner variant="error">{controllerError}</StatusBanner>}

      <div className="actions-grid">
        <div
          className="actions-stack"
          style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
        >
          <PuzzleUploader
            phase={phase}
            onPuzzleSelected={handlePuzzleSelected}
            onDivide={splitPuzzle}
            onPieceCountChange={handlePieceCountChange}
            image={image}
            isSplitting={isSplitting}
            splitProgress={splitProgress}
            lastError={
              errorContext === 'upload' || errorContext === 'split' ? controllerError : undefined
            }
          />

          <PieceMatcher
            phase={phase}
            onPieceUpload={handlePieceUpload}
            match={matchedPiece}
            candidates={topMatches}
            isMatching={isMatching}
            matchProgress={matchProgress}
            piecesCount={pieces.length}
            modelStatus={modelStatus}
            lastError={errorContext === 'match' ? controllerError : undefined}
          />

          <button type="button" onClick={() => reset()} style={{ alignSelf: 'flex-start' }}>
            Limpar tudo
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card">
            <h2>Visualização</h2>
            <PuzzleCanvas image={image} match={matchedPiece} candidates={topMatches} />
          </div>

          <div className="card">
            <h2>Peças mapeadas ({pieces.length})</h2>
            <PieceGallery pieces={pieces} isLoading={isSplitting} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
