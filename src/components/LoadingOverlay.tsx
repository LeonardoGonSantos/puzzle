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
  const message = hints[Math.floor(Math.random() * hints.length)];

  if (!visible) return null;

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
