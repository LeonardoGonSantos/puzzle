import './App.css';
import confetti from 'canvas-confetti';
import { useCallback, useEffect, useRef } from 'react';
import { PieceGallery } from './components/PieceGallery';
import { PieceMatcher } from './components/PieceMatcher';
import { PuzzleCanvas } from './components/PuzzleCanvas';
import { PuzzleConfigurator } from './components/PuzzleConfigurator';
import { PuzzleUploader } from './components/PuzzleUploader';
import { StatusBanner } from './components/StatusBanner';
import { StepIndicator } from './components/StepIndicator';
import { LoadingOverlay } from './components/LoadingOverlay';
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
    step,
    handlePuzzleSelected,
    splitPuzzle,
    handlePieceUpload,
    handlePieceCountChange,
    reset,
  } = usePuzzleController();

  const isSplitting = phase === 'splitting';
  const isMatching = phase === 'matching';

  const prevPhaseRef = useRef(phase);

  const fireConfetti = useCallback((mode: 'cheer' | 'celebrate') => {
    if (typeof window === 'undefined') return;
    const base = {
      particleCount: mode === 'celebrate' ? 160 : 80,
      spread: mode === 'celebrate' ? 90 : 60,
      startVelocity: mode === 'celebrate' ? 55 : 35,
      gravity: 0.9,
    };
    confetti({ ...base, origin: { x: 0.2, y: 0.3 } });
    confetti({ ...base, origin: { x: 0.8, y: 0.3 } });
  }, []);

  useEffect(() => {
    const previous = prevPhaseRef.current;
    if (phase === 'ready' && previous !== 'ready') {
      fireConfetti('cheer');
    }
    if (phase === 'match-found' && previous !== 'match-found') {
      fireConfetti('celebrate');
    }
    prevPhaseRef.current = phase;
  }, [fireConfetti, phase]);

  return (
    <div className="app-shell">
      <LoadingOverlay mode="splitting" visible={phase === 'splitting'} />
      <LoadingOverlay mode="matching" visible={phase === 'matching'} />

      <header className="app-header">
        <h1 className="app-title">Puzzle Piece Locator</h1>
        <p className="app-subtitle">
          Faça upload do quebra-cabeça, informe a quantidade de peças e deixe que a gente encontre o
          lugar certo para aquela peça perdida.
        </p>
      </header>

      <StepIndicator current={step} />

      {controllerError && <StatusBanner variant="error">{controllerError}</StatusBanner>}

      {step === 1 && (
        <PuzzleUploader
          phase={phase}
          onPuzzleSelected={handlePuzzleSelected}
          image={image}
          isSplitting={isSplitting}
          lastError={errorContext === 'upload' ? controllerError : undefined}
        />
      )}

      {step === 2 && (
        <PuzzleConfigurator
          image={image}
          phase={phase}
          splitProgress={splitProgress}
          onPieceCountChange={handlePieceCountChange}
          onGenerate={splitPuzzle}
        />
      )}

      {step === 3 && (
        <div className="actions-grid">
          <div className="card">
            <h2>Visualização</h2>
            <PuzzleCanvas image={image} match={matchedPiece} candidates={topMatches} />
          </div>

          <div className="actions-stack" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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

            <div className="card">
              <h2>Peças mapeadas ({pieces.length})</h2>
              <PieceGallery pieces={pieces} isLoading={isSplitting} />
            </div>

            <button type="button" onClick={() => reset()} style={{ alignSelf: 'flex-start' }}>
              Reiniciar fluxo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
