import { Button } from '../components/Button';
import { Progress } from '../components/Progress';
import { Soap } from '../components/Soap';
import { StatusChip } from '../components/StatusChip';
import { visibleItems } from '../domain/catalog';
import { useFormix } from '../state/FormixProvider';
import { navigate } from '../state/useHashRoute';
import { useSound } from '../state/useSound';

export function ShapePage() {
  const { currentSession, catalog, setPreference } = useFormix();
  const { play } = useSound();
  const shapes = visibleItems(catalog, 'shape');
  const selected = currentSession?.preferences?.shapeId ?? '';

  const choose = (id: string) => {
    setPreference({ shapeId: id });
    play('pop');
  };

  return (
    <section className="flow-page">
      <Progress step={2} />
      <header className="flow-head">
        <p className="eyebrow">Paso 2 · Molde</p>
        <h1 className="flow-title">Elige tu molde</h1>
        <p className="flow-lede">La forma que le da carácter a tu jabón.</p>
      </header>

      <div className="choice-grid">
        {shapes.map((shape) => {
          const active = selected === shape.id;
          return (
            <button
              key={shape.id}
              type="button"
              className={`choice-card${active ? ' choice-card--selected' : ''}`}
              aria-pressed={active}
              onClick={() => choose(shape.id)}
            >
              <span className="choice-card__top">
                <span className="choice-card__soap">
                  <Soap shapeId={shape.id} colorId="color-rosa" size={86} />
                </span>
                {shape.status === 'proposed' ? <StatusChip status="proposed" /> : null}
              </span>
              <span className="choice-card__name">{shape.name}</span>
              <span className="choice-card__notes">{shape.notes}</span>
            </button>
          );
        })}
      </div>

      <Button size="lg" full disabled={!selected} onClick={() => navigate('/crear/color')}>
        Continuar
      </Button>
      <p className="form-note" style={{ textAlign: 'center' }}>
        «Concepto» mide interés: no significa que el molde esté disponible para venta.
      </p>
    </section>
  );
}
