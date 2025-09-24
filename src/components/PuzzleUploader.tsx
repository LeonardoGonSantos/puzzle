import { useState } from 'react';
import type { PuzzleImage, ProcessingPhase } from '../types/puzzle';
import { StatusBanner } from './StatusBanner';

interface PuzzleUploaderProps {
  phase: ProcessingPhase;
  onPuzzleSelected: (payload: { file: File; pieceCount: number }) => Promise<void>;
  onDivide: () => Promise<void>;
  image?: PuzzleImage;
  isSplitting: boolean;
  splitProgress?: { processed: number; total: number } | null;
  lastError?: string;
}

export const PuzzleUploader = ({
  phase,
  onPuzzleSelected,
  onDivide,
  image,
  isSplitting,
  splitProgress,
  lastError,
}: PuzzleUploaderProps) => {
  const [pieceCountInput, setPieceCountInput] = useState('100');
  const [selectedFilename, setSelectedFilename] = useState<string>();

  const isReady = phase === 'ready' || phase === 'splitting';
  const totalPieces = image?.grid.totalPieces ?? (Number(pieceCountInput) || 0);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const count = Number(pieceCountInput);
    setSelectedFilename(file.name);
    await onPuzzleSelected({ file, pieceCount: Number.isFinite(count) ? count : 0 });
    event.target.value = '';
  };

  const handleDivide = async () => {
    await onDivide();
  };

  const canDivide = Boolean(image) && !isSplitting;

  return (
    <div className="card">
      <div>
        <h2>Mapa do quebra-cabeça</h2>
        <p className="helper-text">
          Envie a foto completa e informe quantas peças possui para que possamos dividir
          automaticamente.
        </p>
      </div>

      {lastError && <StatusBanner variant="error">{lastError}</StatusBanner>}

      {isReady && !lastError && (
        <StatusBanner variant="success">Pronto, já mapeamos todas as peças.</StatusBanner>
      )}

      <div className="input-group">
        <label className="label" htmlFor="puzzle-file-input">
          Foto do quebra-cabeça completo
        </label>
        <input
          id="puzzle-file-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isSplitting}
        />
        {selectedFilename && <p className="helper-text">Arquivo selecionado: {selectedFilename}</p>}
      </div>

      <div className="input-group">
        <label className="label" htmlFor="piece-count-input">
          Quantidade de peças
        </label>
        <input
          id="piece-count-input"
          type="number"
          min={1}
          step={1}
          value={pieceCountInput}
          onChange={(event) => setPieceCountInput(event.target.value)}
          disabled={isSplitting}
        />
        <p className="helper-text">
          Total: {totalPieces} peças
          {image?.grid && (
            <span>
              {' '}
              - Grade sugerida: {image.grid.rows} x {image.grid.cols}
            </span>
          )}
        </p>
      </div>

      <div className="input-group">
        <button type="button" className="primary" onClick={handleDivide} disabled={!canDivide}>
          Dividir imagem
        </button>
        {isSplitting && splitProgress && splitProgress.total > 0 && (
          <div className="split-progress" aria-label="Progresso da divisão">
            <span style={{ width: `${(splitProgress.processed / splitProgress.total) * 100}%` }} />
          </div>
        )}
      </div>
    </div>
  );
};
