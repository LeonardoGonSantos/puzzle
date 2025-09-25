import { forwardRef, useImperativeHandle, useRef, type ChangeEvent } from 'react';
import type { PuzzleImage, ProcessingPhase } from '../types/puzzle';
import { StatusBanner } from './StatusBanner';
import { FixedFooter } from './shell/FixedFooter';
import './PuzzleUploader.css';

export interface PuzzleUploaderHandle {
  openGallery: () => void;
  openCamera: () => void;
}

interface PuzzleUploaderProps {
  phase: ProcessingPhase;
  onPuzzleSelected: (payload: { file: File }) => Promise<void>;
  image?: PuzzleImage;
  isSplitting: boolean;
  lastError?: string;
}

export const PuzzleUploader = forwardRef<PuzzleUploaderHandle, PuzzleUploaderProps>(
  ({ phase, onPuzzleSelected, image, isSplitting, lastError }, ref) => {
    const galleryInputRef = useRef<HTMLInputElement | null>(null);
    const cameraInputRef = useRef<HTMLInputElement | null>(null);

    const processFile = async (file: File | undefined) => {
      if (!file || isSplitting) return;
      await onPuzzleSelected({ file });
    };

    const handleGalleryChange = async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      await processFile(file);
      event.target.value = '';
    };

    const handleCameraChange = async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      await processFile(file);
      event.target.value = '';
    };

    const openGallery = () => {
      if (isSplitting) return;
      galleryInputRef.current?.click();
    };

    const openCamera = () => {
      if (isSplitting) return;
      cameraInputRef.current?.click();
    };

    useImperativeHandle(
      ref,
      () => ({
        openGallery,
        openCamera,
      }),
      [],
    );

    return (
      <>
        <section className="screen-card" aria-labelledby="welcome-title">
          <header className="screen-content">
            <h1 id="welcome-title" className="screen-title">
              Vamos jogar? 🧩
            </h1>
            <p className="screen-subtitle">
              Envie uma foto do seu quebra-cabeça completo para criarmos o mapa interativo das
              peças.
            </p>
          </header>

          <div className="uploader-body">
            {lastError && <StatusBanner variant="error">{lastError}</StatusBanner>}

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

            {image?.dataUrl && phase !== 'splitting' && (
              <>
                <div className="uploader-preview">
                  <img src={image.dataUrl} alt="Preview do quebra-cabeça" />
                </div>
                <StatusBanner variant="success">Foto recebida! Vamos começar? 🎯</StatusBanner>
              </>
            )}

            <p className="helper-text playful-text">
              Capture o puzzle inteiro com boa luz. Assim encontramos cada peça num piscar de olhos!
              ✨
            </p>
          </div>
        </section>

        <FixedFooter>
          {!image?.dataUrl ? (
            <>
              <button
                type="button"
                className="secondary-button"
                onClick={openGallery}
                disabled={isSplitting}
              >
                📂 Enviar da galeria
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={openCamera}
                disabled={isSplitting}
              >
                📸 Tirar foto agora
              </button>
            </>
          ) : (
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                /* Aqui vai a função para ir para o próximo passo */
              }}
              disabled={isSplitting}
            >
              Continuar
            </button>
          )}
        </FixedFooter>
      </>
    );
  },
);

PuzzleUploader.displayName = 'PuzzleUploader';
