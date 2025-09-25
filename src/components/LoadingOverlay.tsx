import { useMemo } from 'react';

interface LoadingOverlayProps {
  mode: 'splitting' | 'matching';
  visible: boolean;
}

const messages: Record<LoadingOverlayProps['mode'], string[]> = {
  splitting: ['Quebrando o puzzle em pedacinhos...', 'Preparando miniaturas brilhantes...'],
  matching: ['Comparando quadrantes...', 'Checando onde essa peça se encaixa...'],
};

export const LoadingOverlay = ({ mode, visible }: LoadingOverlayProps) => {
  if (!visible) return null;

  const hints = messages[mode];
  const message = useMemo(
    () => hints[Math.floor(Math.random() * hints.length)],
    [hints],
  );

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
