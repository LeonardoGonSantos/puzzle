import type { PieceRecord } from '../types/puzzle';

interface PieceGalleryProps {
  pieces: PieceRecord[];
  maxVisible?: number;
  isLoading?: boolean;
}

const placeholderMessage = 'Nenhuma peça disponível ainda.';

export const PieceGallery = ({ pieces, maxVisible = 40, isLoading }: PieceGalleryProps) => {
  if (isLoading) {
    return <p className="helper-text">Carregando peças...</p>;
  }

  if (pieces.length === 0) {
    return <p className="helper-text">{placeholderMessage}</p>;
  }

  return (
    <div className="piece-gallery" role="list">
      {pieces.slice(0, maxVisible).map((piece) => (
        <div className="piece-card" key={piece.id} role="listitem">
          {piece.thumbnailUrl ? (
            <img src={piece.thumbnailUrl} alt={`Peça ${piece.row + 1}x${piece.col + 1}`} />
          ) : (
            <div
              style={{
                width: '100%',
                aspectRatio: '1 / 1',
                borderRadius: 12,
                background: '#e2e8f0',
              }}
            />
          )}
          <span>
            Linha {piece.row + 1} • Coluna {piece.col + 1}
            {typeof piece.score === 'number' && (
              <span className="badge" style={{ marginLeft: 6 }}>
                Score {(piece.score * 100).toFixed(1)}%
              </span>
            )}
          </span>
        </div>
      ))}
      {pieces.length > maxVisible && (
        <p className="helper-text">+{pieces.length - maxVisible} peças ocultas</p>
      )}
    </div>
  );
};
