import { useCallback, useRef } from 'react';
import type { PieceRecord } from '../types/puzzle';
import './PieceGallery.css';

interface PieceGalleryProps {
  pieces: PieceRecord[];
  maxVisible?: number;
  isLoading?: boolean;
}

const placeholderMessage = 'Nenhuma peça disponível ainda.';
const SCROLL_AMOUNT = 360; // 3 peças por vez

export const PieceGallery = ({ pieces, maxVisible = 40, isLoading }: PieceGalleryProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((direction: 'prev' | 'next') => {
    if (!scrollRef.current) return;

    const scrollAmount = direction === 'next' ? SCROLL_AMOUNT : -SCROLL_AMOUNT;
    scrollRef.current.scrollBy({
      left: scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  const canScrollPrev = useCallback(() => {
    if (!scrollRef.current) return false;
    return scrollRef.current.scrollLeft > 0;
  }, []);

  const canScrollNext = useCallback(() => {
    if (!scrollRef.current) return false;
    return (
      scrollRef.current.scrollLeft + scrollRef.current.offsetWidth < scrollRef.current.scrollWidth
    );
  }, []);

  if (isLoading) {
    return <p className="helper-text">Carregando peças...</p>;
  }

  if (pieces.length === 0) {
    return <p className="helper-text">{placeholderMessage}</p>;
  }

  return (
    <div className="piece-gallery" role="list">
      <button
        type="button"
        className="piece-scroll-button prev"
        onClick={() => handleScroll('prev')}
        disabled={!canScrollPrev()}
        aria-label="Ver peças anteriores"
      >
        ←
      </button>

      <div className="piece-gallery-inner" ref={scrollRef}>
        {pieces.slice(0, maxVisible).map((piece) => (
          <div className="piece-card" key={piece.id} role="listitem">
            {piece.thumbnailUrl ? (
              <img src={piece.thumbnailUrl} alt={`Peça ${piece.row + 1}x${piece.col + 1}`} />
            ) : (
              <div className="loading-placeholder" />
            )}
            <div className="piece-info">
              <span>
                {piece.row + 1}×{piece.col + 1}
                {typeof piece.score === 'number' && (
                  <span className="score-badge">{(piece.score * 100).toFixed(1)}%</span>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="piece-scroll-button next"
        onClick={() => handleScroll('next')}
        disabled={!canScrollNext()}
        aria-label="Ver próximas peças"
      >
        →
      </button>

      {pieces.length > maxVisible && (
        <p className="helper-text">+{pieces.length - maxVisible} peças ocultas</p>
      )}
    </div>
  );
};
