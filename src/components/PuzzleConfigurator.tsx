import { useEffect, useMemo, useState } from 'react';
import type { PuzzleImage, ProcessingPhase } from '../types/puzzle';
import { StatusBanner } from './StatusBanner';

interface PuzzleConfiguratorProps {
  image?: PuzzleImage;
  phase: ProcessingPhase;
  splitProgress?: { processed: number; total: number } | null;
  onPieceCountChange: (count: number) => void;
  onGenerate: () => Promise<void> | void;
}

const suggestions = [100, 200, 500, 1000];

export const PuzzleConfigurator = ({
  image,
  phase,
  splitProgress,
  onPieceCountChange,
  onGenerate,
}: PuzzleConfiguratorProps) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | undefined>();

  const previewSrc = image?.dataUrl;
  const currentTotal = image?.grid.totalPieces ?? 0;

  useEffect(() => {
    if (currentTotal > 1) {
      setInputValue(String(currentTotal));
      onPieceCountChange(currentTotal);
    }
  }, [currentTotal, onPieceCountChange]);

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

  const isGenerating = phase === 'splitting';
  const canGenerate = Boolean(image) && !isGenerating;

  return (
    <div className="card">
      <div>
        <h2>Confirme as peças</h2>
        <p className="helper-text">
          Revise a foto enviada e informe quantas peças existem no puzzle físico. Quanto mais
          preciso, melhor!
        </p>
      </div>

      {previewSrc ? (
        <div className="puzzle-preview">
          <img src={previewSrc} alt="Preview do puzzle" />
        </div>
      ) : (
        <StatusBanner variant="warning">
          Envie uma foto primeiro para configurar a grade.
        </StatusBanner>
      )}

      <div className="input-group">
        <label className="label" htmlFor="piece-count-step">
          Quantas peças esse puzzle possui?
        </label>
        <input
          id="piece-count-step"
          type="number"
          min={1}
          placeholder="Ex.: 500"
          value={inputValue}
          onChange={(event) => handleInputChange(event.target.value)}
          disabled={isGenerating}
        />
        <div className="chip-row">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="chip-button"
              onClick={() => handleSuggestion(suggestion)}
              disabled={isGenerating}
            >
              {suggestion}
            </button>
          ))}
        </div>
        {rowsCols && currentTotal > 1 && <p className="helper-text">Grade sugerida: {rowsCols}</p>}
        {error && <StatusBanner variant="error">{error}</StatusBanner>}
      </div>

      <button
        type="button"
        className="primary"
        onClick={handleGenerateClick}
        disabled={!canGenerate}
      >
        {isGenerating ? 'Dividindo...' : 'Gerar grade'}
      </button>

      {isGenerating && splitProgress && splitProgress.total > 0 && (
        <div className="split-progress" aria-label="Progresso da divisão">
          <span style={{ width: `${(splitProgress.processed / splitProgress.total) * 100}%` }} />
        </div>
      )}
    </div>
  );
};
