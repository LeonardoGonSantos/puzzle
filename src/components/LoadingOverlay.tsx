import { useEffect, useState } from 'react';

interface LoadingOverlayProps {
  mode: 'splitting' | 'matching';
  visible: boolean;
}

const messages: Record<LoadingOverlayProps['mode'], string[]> = {
  splitting: ['Quebrando o puzzle em pedacinhos...', 'Preparando miniaturas brilhantes...'],
  matching: ['Comparando quadrantes...', 'Checando onde essa peça se encaixa...'],
};

export const LoadingOverlay = ({ mode, visible }: LoadingOverlayProps) => {
  const hints = messages[mode];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!visible) {
      setIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % hints.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [hints.length, visible]);

  if (!visible) return null;

  const message = hints[index] ?? hints[0];

  return (
    <div className="loading-overlay" role="status" aria-live="assertive">
      <div className="loading-card">
        <div className="loading-emoji" aria-hidden>
          <div className="dancing-piece" />
        </div>
        <p>{message}</p>
      </div>
    </div>
  );
};
