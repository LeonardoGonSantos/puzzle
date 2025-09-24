import type { MatchResult, PuzzleImage } from '../types/puzzle';

interface PuzzleCanvasProps {
  image?: PuzzleImage;
  match?: MatchResult;
}

export const PuzzleCanvas = ({ image, match }: PuzzleCanvasProps) => {
  if (!image) {
    return (
      <p className="helper-text">Faça upload de uma imagem do quebra-cabeça para visualizar.</p>
    );
  }

  const { grid } = image;
  const highlightStyles = match
    ? {
        top: `${(match.row / grid.rows) * 100}%`,
        left: `${(match.col / grid.cols) * 100}%`,
        width: `${(1 / grid.cols) * 100}%`,
        height: `${(1 / grid.rows) * 100}%`,
      }
    : null;

  return (
    <div className="canvas-wrapper">
      <img src={image.dataUrl} alt="Quebra-cabeça completo" />
      {highlightStyles && (
        <div className="highlight-layer">
          <div className="highlight-rect" style={highlightStyles} />
        </div>
      )}
    </div>
  );
};
