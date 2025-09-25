import { useEffect, useRef, useState } from 'react';
import type { PuzzleImage, ProcessingPhase } from '../types/puzzle';
import { StatusBanner } from './StatusBanner';

interface PuzzleUploaderProps {
  phase: ProcessingPhase;
  onPuzzleSelected: (payload: { file: File; pieceCount: number }) => Promise<void>;
  onDivide: () => Promise<void>;
  onPieceCountChange?: (pieceCount: number) => void;
  image?: PuzzleImage;
  isSplitting: boolean;
  splitProgress?: { processed: number; total: number } | null;
  lastError?: string;
}

export const PuzzleUploader = ({
  phase,
  onPuzzleSelected,
  onDivide,
  onPieceCountChange,
  image,
  isSplitting,
  splitProgress,
  lastError,
}: PuzzleUploaderProps) => {
  const [pieceCountInput, setPieceCountInput] = useState('100');
  const [selectedFilename, setSelectedFilename] = useState<string>();
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (image?.grid?.totalPieces) {
      setPieceCountInput(String(image.grid.totalPieces));
    }
  }, [image?.id, image?.grid.totalPieces]);

  const isReady = phase === 'ready' || phase === 'splitting';
  const totalPieces = image?.grid.totalPieces ?? (Number(pieceCountInput) || 0);

  const processFile = async (file: File | undefined) => {
    if (!file) return;
    const count = Number(pieceCountInput);
    setSelectedFilename(file.name);
    await onPuzzleSelected({ file, pieceCount: Number.isFinite(count) ? count : 0 });
  };

  const handleGalleryChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    await processFile(file);
    event.target.value = '';
  };

  const handleCameraChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    await processFile(file);
    event.target.value = '';
  };

  const triggerGalleryPicker = () => {
    if (isSplitting) return;
    galleryInputRef.current?.click();
  };

  const triggerCameraCapture = () => {
    if (isSplitting) return;
    cameraInputRef.current?.click();
  };

  const handlePieceCountInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setPieceCountInput(value);
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      onPieceCountChange?.(parsed);
    }
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
        <StatusBanner variant="success">
          🎉 Uhul! Quebra-cabeça fatiado – pronto para investigar as peças.
        </StatusBanner>
      )}

      <div className="input-group">
        <label className="label" htmlFor="puzzle-file-input">
          Foto do quebra-cabeça completo
        </label>
        <div className="upload-actions">
          <button
            type="button"
            className="upload-button"
            onClick={triggerGalleryPicker}
            disabled={isSplitting}
          >
            📁 Enviar da galeria
          </button>
          <button
            type="button"
            className="upload-button"
            onClick={triggerCameraCapture}
            disabled={isSplitting}
          >
            📸 Tirar foto agora
          </button>
        </div>
        <input
          ref={galleryInputRef}
          id="puzzle-file-input"
          type="file"
          accept="image/*"
          onChange={handleGalleryChange}
          style={{ display: 'none' }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraChange}
          style={{ display: 'none' }}
        />
        {selectedFilename && <p className="helper-text">Arquivo selecionado: {selectedFilename}</p>}
        <p className="helper-text playful-text">
          Dica: alinhe o puzzle como se fosse uma foto para álbum – luz natural deixa os detalhes
          brilhando! ✨
        </p>
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
          onChange={handlePieceCountInputChange}
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
