import type { CSSProperties } from 'react';
import type { MatchCandidate, MatchResult, PuzzleImage } from '../types/puzzle';

interface PuzzleCanvasProps {
  image?: PuzzleImage;
  match?: MatchResult;
  candidates?: MatchCandidate[];
}

const palette = [
  { border: 'rgba(220, 38, 38, 0.9)', fill: 'rgba(254, 202, 202, 0.35)' },
  { border: 'rgba(234, 88, 12, 0.9)', fill: 'rgba(254, 215, 170, 0.35)' },
  { border: 'rgba(202, 138, 4, 0.9)', fill: 'rgba(254, 240, 138, 0.35)' },
  { border: 'rgba(16, 185, 129, 0.9)', fill: 'rgba(187, 247, 208, 0.35)' },
  { border: 'rgba(14, 165, 233, 0.9)', fill: 'rgba(191, 219, 254, 0.35)' },
];

export const PuzzleCanvas = ({ image, match, candidates = [] }: PuzzleCanvasProps) => {
  if (!image) {
    return (
      <p className="helper-text">Faça upload de uma imagem do quebra-cabeça para visualizar.</p>
    );
  }

  const { grid } = image;
  const overlays = (
    candidates.length > 0
      ? candidates
      : match
        ? [
            {
              pieceId: match.pieceId,
              row: match.row,
              col: match.col,
              score: match.score,
              rank: 1,
            },
          ]
        : []
  ) as MatchCandidate[];

  return (
    <div className="canvas-wrapper">
      <img src={image.dataUrl} alt="Quebra-cabeça completo" />
      {overlays.length > 0 && (
        <div className="highlight-layer">
          {overlays.slice(0, 3).map((candidate) => {
            const swatch = palette[candidate.rank - 1] ?? palette[palette.length - 1];
            const style: CSSProperties = {
              top: `${(candidate.row / grid.rows) * 100}%`,
              left: `${(candidate.col / grid.cols) * 100}%`,
              width: `${(1 / grid.cols) * 100}%`,
              height: `${(1 / grid.rows) * 100}%`,
              borderColor: swatch.border,
              background: swatch.fill,
            };

            return (
              <div key={candidate.pieceId} className="highlight-rect" style={style}>
                <span
                  style={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
                    padding: '2px 6px',
                    borderRadius: 999,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  }}
                >
                  #{candidate.rank}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
