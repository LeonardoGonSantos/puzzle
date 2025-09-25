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
import { NavBar } from './components/shell/NavBar';
import { FixedFooter } from './components/shell/FixedFooter';

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
    matchingMode,
    handlePuzzleSelected,
    splitPuzzle,
    handlePieceUpload,
    handlePieceCountChange,
    setMatchingMode,
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

  const currentStep = Number(step) as 1 | 2 | 3;

  const getFooterContent = () => {
    if (currentStep === 1) {
      return (
        <button
          type="button"
          className="primary"
          onClick={() => {
            if (image) handlePieceCountChange(4); // Mínimo de peças
          }}
          disabled={!image}
        >
          Continuar
        </button>
      );
    }

    if (currentStep === 2) {
      return (
        <>
          <button type="button" className="primary" onClick={splitPuzzle} disabled={!image}>
            Gerar peças
          </button>
          <button type="button" className="reset-button" onClick={reset}>
            Voltar
          </button>
        </>
      );
    }

    return null;
  };

  return (
    <div className="app-shell">
      <LoadingOverlay mode="splitting" visible={phase === 'splitting'} />
      <LoadingOverlay mode="matching" visible={phase === 'matching'} />

      <NavBar />

      <StepIndicator current={currentStep} />

      <main className="app-content">
        {controllerError && <StatusBanner variant="error">{controllerError}</StatusBanner>}

        {currentStep === 1 && (
          <PuzzleUploader
            phase={phase}
            onPuzzleSelected={handlePuzzleSelected}
            image={image}
            isSplitting={isSplitting}
            lastError={errorContext === 'upload' ? controllerError : undefined}
          />
        )}

        {currentStep === 2 && (
          <PuzzleConfigurator
            image={image}
            phase={phase}
            splitProgress={splitProgress}
            onPieceCountChange={handlePieceCountChange}
            onGenerate={splitPuzzle}
          />
        )}

        {currentStep === 3 && (
          <>
            <PuzzleCanvas image={image} match={matchedPiece} candidates={topMatches} />

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
              matchingMode={matchingMode}
              onMatchingModeChange={(mode) => setMatchingMode(mode)}
            />

            <section className="gallery-section">
              <h2>Peças mapeadas ({pieces.length})</h2>
              <PieceGallery pieces={pieces} isLoading={isSplitting} />
            </section>

            <button type="button" className="reset-button" onClick={() => reset()}>
              Reiniciar fluxo
            </button>
          </>
        )}
      </main>

      {getFooterContent() && <FixedFooter>{getFooterContent()}</FixedFooter>}
    </div>
  );
}

export default App;
