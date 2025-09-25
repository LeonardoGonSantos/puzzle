import { useMemo, useRef, useState } from 'react';
import type { MatchingMode, MatchCandidate, MatchResult, ProcessingPhase } from '../types/puzzle';
import { StatusBanner } from './StatusBanner';

const candidateColors = ['#dc2626', '#ea580c', '#ca8a04', '#10b981', '#0ea5e9'];

const MATCHING_MODE_OPTIONS: Array<{
  value: MatchingMode;
  title: string;
  description: string;
  badge?: string;
}> = [
  {
    value: 'hierarchy',
    title: 'Busca guiada por quadrantes',
    description:
      'Explora primeiro os quadrantes mais promissores e refina até chegar na peça exata. Recomendado para a maioria dos casos.',
    badge: 'Mais assertivo',
  },
  {
    value: 'global',
    title: 'Busca direta em todas as peças',
    description:
      'Pula a hierarquia e compara a peça com todas as partes do tabuleiro de uma vez. Ideal para revisões rápidas.',
  },
];

interface PieceMatcherProps {
  phase: ProcessingPhase;
  onPieceUpload: (file: File) => Promise<void>;
  match?: MatchResult;
  candidates?: MatchCandidate[];
  isMatching: boolean;
  matchProgress?: { processed: number; total: number } | null;
  piecesCount: number;
  modelStatus: 'idle' | 'loading' | 'ready';
  lastError?: string;
  matchingMode: MatchingMode;
  onMatchingModeChange: (mode: MatchingMode) => void;
}

export const PieceMatcher = ({
  phase,
  onPieceUpload,
  match,
  candidates = [],
  isMatching,
  matchProgress,
  piecesCount,
  modelStatus,
  lastError,
  matchingMode,
  onMatchingModeChange,
}: PieceMatcherProps) => {
  const [lastUploadedName, setLastUploadedName] = useState<string>();
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const canUploadPiece = piecesCount > 0 && modelStatus !== 'loading';
  const topCandidates = candidates.slice(0, 3);
  const hasCandidates = topCandidates.length > 0;

  const statusNode = useMemo(() => {
    if (lastError) {
      return <StatusBanner variant="error">{lastError}</StatusBanner>;
    }
    if (phase === 'match-found' && match) {
      return (
        <StatusBanner variant="success">
          🧩 Achamos a peça! Linha {match.row + 1}, coluna {match.col + 1}. Confete liberado!
        </StatusBanner>
      );
    }
    if (phase === 'match-not-found') {
      return (
        <StatusBanner variant="warning">
          Hmm, essa peça deu um perdido! Tente outra foto ou ajuste a iluminação.
        </StatusBanner>
      );
    }
    if (phase === 'matching') {
      return <StatusBanner variant="info">Analisando a peça...</StatusBanner>;
    }
    if (phase === 'ready') {
      return (
        <StatusBanner variant="info">
          Todas as peças catalogadas. Pode mandar o close! 😎
        </StatusBanner>
      );
    }
    return null;
  }, [lastError, match, phase]);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLastUploadedName(file.name);
    await onPieceUpload(file);
    event.target.value = '';
  };

  const openGalleryPicker = () => {
    if (!canUploadPiece || isMatching) return;
    galleryInputRef.current?.click();
  };

  const openCameraCapture = () => {
    if (!canUploadPiece || isMatching) return;
    cameraInputRef.current?.click();
  };

  return (
    <div className="card" aria-live="polite">
      <div>
        <h2>Localizar a peça</h2>
        <p className="helper-text">
          Faça upload de uma foto da peça individual para tentar localizar a posição no
          quebra-cabeça.
        </p>
      </div>

      {statusNode}

      <fieldset className="input-group" style={{ border: 'none', padding: 0 }}>
        <legend className="label" style={{ marginBottom: 8 }}>
          Estratégia de busca
        </legend>
        <p className="helper-text" style={{ marginTop: 0 }}>
          Escolha como quer localizar a peça agora. Você pode alternar entre as abordagens sempre
          que quiser.
        </p>
        <div style={{ display: 'grid', gap: 12 }}>
          {MATCHING_MODE_OPTIONS.map((option) => {
            const selected = matchingMode === option.value;
            return (
              <label
                key={option.value}
                className="card"
                style={{
                  borderColor: selected ? '#7c3aed' : 'transparent',
                  boxShadow: selected ? '0 0 0 2px rgba(124,58,237,0.25)' : undefined,
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  gap: 12,
                  padding: 20,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <input
                    type="radio"
                    name="matching-mode"
                    value={option.value}
                    checked={selected}
                    onChange={() => onMatchingModeChange(option.value)}
                    style={{ marginTop: 4 }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600 }}>{option.title}</span>
                      {option.badge && (
                        <span
                          className="badge"
                          style={{ backgroundColor: '#7c3aed', color: '#fff' }}
                        >
                          {option.badge}
                        </span>
                      )}
                    </div>
                    <p className="helper-text" style={{ marginTop: 4 }}>
                      {option.description}
                    </p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="input-group">
        <label className="label" htmlFor="single-piece-input">
          Foto da peça
        </label>
        <div className="upload-actions">
          <button
            type="button"
            className="upload-button"
            onClick={openGalleryPicker}
            disabled={!canUploadPiece || isMatching}
          >
            🖼️ Enviar da galeria
          </button>
          <button
            type="button"
            className="upload-button"
            onClick={openCameraCapture}
            disabled={!canUploadPiece || isMatching}
          >
            🤳 Tirar foto agora
          </button>
        </div>
        <input
          ref={galleryInputRef}
          id="single-piece-input"
          type="file"
          accept="image/*"
          onChange={handleChange}
          style={{ display: 'none' }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleChange}
          style={{ display: 'none' }}
        />
        {!canUploadPiece && (
          <p className="helper-text">
            Primeiro divida o quebra-cabeça para habilitar o matching automático.
          </p>
        )}
        {isMatching && matchProgress && matchProgress.total > 0 && (
          <p className="helper-text">
            Comparando {matchProgress.processed} de {matchProgress.total} peças...
          </p>
        )}
        {lastUploadedName && (
          <p className="helper-text">Último arquivo enviado: {lastUploadedName}</p>
        )}
        {modelStatus === 'loading' && (
          <p className="helper-text">Carregando modelo de reconhecimento, aguarde...</p>
        )}
        <p className="helper-text playful-text">
          Capture a peça como se fosse um close de revista! Fundos lisos ajudam muito. 🧩📸
        </p>
      </div>

      {match && (
        <div className="badge" role="note">
          Similaridade {(match.score * 100).toFixed(1)}%
        </div>
      )}

      {hasCandidates && !isMatching && (
        <div>
          <h3 style={{ margin: '8px 0', fontSize: '1rem' }}>Top 3 posições prováveis</h3>
          <ol style={{ margin: 0, paddingLeft: 20, color: '#1f2937' }}>
            {topCandidates.map((candidate) => (
              <li
                key={candidate.pieceId}
                style={{
                  marginBottom: 6,
                  borderLeft: `4px solid ${
                    candidateColors[candidate.rank - 1] ??
                    candidateColors[candidateColors.length - 1]
                  }`,
                  paddingLeft: 8,
                }}
              >
                Linha {candidate.row + 1}, Coluna {candidate.col + 1}{' '}
                <span className="badge" style={{ marginLeft: 8 }}>
                  {(candidate.score * 100).toFixed(1)}%
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};
