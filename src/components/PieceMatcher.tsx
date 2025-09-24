import { useMemo, useState } from 'react';
import type { MatchResult, ProcessingPhase } from '../types/puzzle';
import { StatusBanner } from './StatusBanner';

interface PieceMatcherProps {
  phase: ProcessingPhase;
  onPieceUpload: (file: File) => Promise<void>;
  match?: MatchResult;
  isMatching: boolean;
  matchProgress?: { processed: number; total: number } | null;
  piecesCount: number;
  modelStatus: 'idle' | 'loading' | 'ready';
  lastError?: string;
}

export const PieceMatcher = ({
  phase,
  onPieceUpload,
  match,
  isMatching,
  matchProgress,
  piecesCount,
  modelStatus,
  lastError,
}: PieceMatcherProps) => {
  const [lastUploadedName, setLastUploadedName] = useState<string>();

  const canUploadPiece = piecesCount > 0 && modelStatus !== 'loading';

  const statusNode = useMemo(() => {
    if (lastError) {
      return <StatusBanner variant="error">{lastError}</StatusBanner>;
    }
    if (phase === 'match-found' && match) {
      return (
        <StatusBanner variant="success">
          Encontrei onde ela fica! Linha {match.row + 1}, coluna {match.col + 1}.
        </StatusBanner>
      );
    }
    if (phase === 'match-not-found') {
      return (
        <StatusBanner variant="warning">
          Não encontramos uma peça com alta confiança. Tente ajustar a iluminação ou o
          enquadramento.
        </StatusBanner>
      );
    }
    if (phase === 'matching') {
      return <StatusBanner variant="info">Analisando a peça...</StatusBanner>;
    }
    if (phase === 'ready') {
      return <StatusBanner variant="info">Pronto, já mapeamos todas as peças.</StatusBanner>;
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

      <div className="input-group">
        <label className="label" htmlFor="single-piece-input">
          Foto da peça
        </label>
        <input
          id="single-piece-input"
          type="file"
          accept="image/*"
          capture="environment"
          disabled={!canUploadPiece || isMatching}
          onChange={handleChange}
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
      </div>

      {match && (
        <div className="badge" role="note">
          Similaridade {(match.score * 100).toFixed(1)}%
        </div>
      )}
    </div>
  );
};
