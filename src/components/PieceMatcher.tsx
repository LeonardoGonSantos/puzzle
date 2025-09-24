import { useMemo, useState } from 'react';
import type { MatchCandidate, MatchResult, ProcessingPhase } from '../types/puzzle';
import { StatusBanner } from './StatusBanner';

const candidateColors = ['#dc2626', '#ea580c', '#ca8a04', '#10b981', '#0ea5e9'];

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
}: PieceMatcherProps) => {
  const [lastUploadedName, setLastUploadedName] = useState<string>();

  const canUploadPiece = piecesCount > 0 && modelStatus !== 'loading';
  const hasCandidates = candidates.length > 0;

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

      {hasCandidates && !isMatching && (
        <div>
          <h3 style={{ margin: '8px 0', fontSize: '1rem' }}>Top 5 posições prováveis</h3>
          <ol style={{ margin: 0, paddingLeft: 20, color: '#1f2937' }}>
            {candidates.slice(0, 5).map((candidate) => (
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
