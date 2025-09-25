import { useState, useRef } from 'react';
import type { PuzzleImage, ProcessingPhase } from '../types/puzzle';
import { StatusBanner } from './StatusBanner';

interface PuzzleUploaderProps {
  phase: ProcessingPhase;
  onPuzzleSelected: (payload: { file: File }) => Promise<void>;
  image?: PuzzleImage;
  isSplitting: boolean;
  lastError?: string;
}

export const PuzzleUploader = ({
  phase,
  onPuzzleSelected,
  image,
  isSplitting,
  lastError,
}: PuzzleUploaderProps) => {
  const [selectedFilename, setSelectedFilename] = useState<string>();
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const processFile = async (file: File | undefined) => {
    if (!file) return;
    setSelectedFilename(file.name);
    await onPuzzleSelected({ file });
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

  return (
    <div className="card">
      <div>
        <h2>Comece o mapa</h2>
        <p className="helper-text">
          Envie uma foto do quebra-cabeça completo. Pode ser da galeria ou tirada na hora.
        </p>
      </div>

      {lastError && <StatusBanner variant="error">{lastError}</StatusBanner>}

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

      {image && phase === 'idle' && (
        <StatusBanner variant="info">
          Foto pronta! Agora vamos confirmar quantas peças existem.
        </StatusBanner>
      )}
    </div>
  );
};
