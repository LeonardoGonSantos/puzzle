import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import type { PuzzleImage, ProcessingPhase } from '../types/puzzle';
import { StatusBanner } from './StatusBanner';

interface PuzzleConfiguratorProps {
  image?: PuzzleImage;
  phase: ProcessingPhase;
  splitProgress?: { processed: number; total: number } | null;
  onPieceCountChange: (count: number) => void;
  onGenerate: () => Promise<void> | void;
  onContinueAvailabilityChange?: (canContinue: boolean) => void;
}

export interface PuzzleConfiguratorHandle {
  submit: () => Promise<void> | void;
}

const suggestions = [500, 1000, 1500, 2000];

export const PuzzleConfigurator = forwardRef<PuzzleConfiguratorHandle, PuzzleConfiguratorProps>(
  (
    { image, phase, splitProgress, onPieceCountChange, onGenerate, onContinueAvailabilityChange },
    ref,
  ) => {
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState<string | undefined>();

    const previewSrc = image?.dataUrl;
    const currentTotal = image?.grid.totalPieces ?? 0;
    const isGenerating = phase === 'splitting';

    useEffect(() => {
      if (!currentTotal || currentTotal <= 1) {
        return;
      }
      const nextValue = String(currentTotal);
      if (inputValue !== nextValue) {
        setInputValue(nextValue);
      }
    }, [currentTotal, inputValue]);

    useEffect(() => {
      const parsed = Number(inputValue);
      const canContinue = Boolean(image) && !isGenerating && Number.isFinite(parsed) && parsed >= 1;
      onContinueAvailabilityChange?.(canContinue);
    }, [image, inputValue, isGenerating, onContinueAvailabilityChange]);

    const rowsCols = useMemo(() => {
      if (!image) {
        return null;
      }
      const { rows, cols } = image.grid;
      return `${rows} x ${cols}`;
    }, [image]);

    const handleInputChange = (value: string) => {
      setInputValue(value);
      const parsed = Number(value);
      if (Number.isNaN(parsed) || parsed < 1) {
        setError('Informe um número válido de peças.');
        return;
      }
      setError(undefined);
      onPieceCountChange(parsed);
    };

    const handleSuggestion = (value: number) => {
      handleInputChange(String(value));
    };

    const handleGenerateClick = async () => {
      const parsed = Number(inputValue);
      if (Number.isNaN(parsed) || parsed < 1) {
        setError('Informe um número válido de peças.');
        return;
      }
      setError(undefined);
      await onGenerate();
    };

    useImperativeHandle(ref, () => ({ submit: handleGenerateClick }));

    return (
      <section className="screen-card" aria-labelledby="piece-count-title">
        <header className="screen-content">
          <h2 id="piece-count-title" className="screen-title">
            Quantas peças tem o seu quebra-cabeça?
          </h2>
          <p className="screen-subtitle">
            Quanto mais preciso o número, mais rápido encontramos a peça ideal.
          </p>
        </header>

        {previewSrc ? (
          <div className="puzzle-preview">
            <img src={previewSrc} alt="Preview do puzzle" />
          </div>
        ) : (
          <StatusBanner variant="warning">
            Envie uma foto primeiro para configurar a grade.
          </StatusBanner>
        )}

        <div className="configurator-body">
          <label className="label" htmlFor="piece-count-input">
            Informe a quantidade de peças
          </label>
          <input
            id="piece-count-input"
            type="number"
            min={1}
            placeholder="Ex.: 1000"
            value={inputValue}
            onChange={(event) => handleInputChange(event.target.value)}
            disabled={isGenerating}
          />

          <div className="suggestion-grid" role="list">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="suggestion-button"
                onClick={() => handleSuggestion(suggestion)}
                disabled={isGenerating}
              >
                {suggestion}
              </button>
            ))}
          </div>

          {rowsCols && currentTotal > 1 && (
            <p className="helper-text">Grade sugerida automaticamente: {rowsCols}</p>
          )}
          {error && <StatusBanner variant="error">{error}</StatusBanner>}

          {isGenerating && splitProgress && splitProgress.total > 0 && (
            <div className="split-progress" aria-label="Progresso da divisão">
              <span
                style={{ width: `${(splitProgress.processed / splitProgress.total) * 100}%` }}
              />
            </div>
          )}
        </div>
      </section>
    );
  },
);

PuzzleConfigurator.displayName = 'PuzzleConfigurator';
