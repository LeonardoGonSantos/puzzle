interface StepIndicatorProps {
  current: 1 | 2 | 3;
}

const labels = ['Foto', 'Peças', 'Encontrar'];
const icons = ['📷', '🧮', '🔍'];

export const StepIndicator = ({ current }: StepIndicatorProps) => (
  <nav className="stepper" aria-label="Progresso do fluxo">
    {labels.map((label, index) => {
      const step = (index + 1) as 1 | 2 | 3;
      const isActive = step === current;
      const isComplete = step < current;

      return (
        <div
          key={label}
          className="stepper-item"
          data-active={isActive}
          data-complete={isComplete}
          aria-current={isActive ? 'step' : undefined}
        >
          <span className="stepper-icon">{icons[index]}</span>
          <span className="stepper-label">{label}</span>
        </div>
      );
    })}
  </nav>
);
