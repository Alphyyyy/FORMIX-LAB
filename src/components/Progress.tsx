const LABELS = ['Espuma', 'Molde', 'Color', 'Aroma', 'Creación'];

export function Progress({ step }: { step: number }) {
  const current = Math.min(5, Math.max(1, step));
  return (
    <div className="progress">
      <div className="progress__meta">
        <span>Paso {current} de 5</span>
        <span>{LABELS[current - 1]}</span>
      </div>
      <div
        className="progress__bar"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={5}
        aria-valuenow={current}
        aria-label={`Paso ${current} de 5`}
      >
        <span className="progress__fill" style={{ width: `${(current / 5) * 100}%` }} />
      </div>
    </div>
  );
}
