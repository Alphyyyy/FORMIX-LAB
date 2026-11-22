import { Button } from '../components/Button';
import { Progress } from '../components/Progress';
import { Soap } from '../components/Soap';
import { visibleItems } from '../domain/catalog';
import { useFormix } from '../state/FormixProvider';
import { navigate } from '../state/useHashRoute';
import { useSound } from '../state/useSound';

export function ColorPage() {
  const { currentSession, catalog, setPreference } = useFormix();
  const { play } = useSound();
  const colors = visibleItems(catalog, 'color');
  const selected = currentSession?.preferences?.colorId ?? '';
  const previewColor = selected || colors[0]?.id || '';
  const shapeId = currentSession?.preferences?.shapeId ?? 'shape-patita';

  const choose = (id: string) => {
    setPreference({ colorId: id });
    play('pop');
  };

  return (
    <section className="flow-page">
      <Progress step={3} />
      <header className="flow-head">
        <p className="eyebrow">Paso 3 · Color</p>
        <h1 className="flow-title">Dale color a tu jabón</h1>
        <p className="flow-lede">Así se ve tu molde con cada tono del taller.</p>
      </header>

      <div className="selection-preview">
        <Soap shapeId={shapeId} colorId={previewColor} size={178} />
      </div>

      <div className="swatch-grid">
        {colors.map((color) => {
          const active = selected === color.id;
          return (
            <button
              key={color.id}
              type="button"
              className={`swatch${active ? ' swatch--selected' : ''}`}
              aria-pressed={active}
              onClick={() => choose(color.id)}
            >
              <span
                className="swatch__dot"
                aria-hidden="true"
                style={{
                  background: `radial-gradient(circle at 32% 26%, rgba(255,255,255,.8), transparent 34%), linear-gradient(145deg, ${color.swatch}, ${color.swatchDark})`,
                }}
              />
              <span className="swatch__name">{color.name}</span>
              <span className="swatch__check" aria-hidden="true">
                ✓
              </span>
            </button>
          );
        })}
      </div>

      <Button
        size="lg"
        full
        disabled={!selected}
        onClick={() => {
          play('pop');
          navigate('/crear/aroma');
        }}
      >
        Continuar
      </Button>
      <p className="form-note" style={{ textAlign: 'center' }}>
        Los tonos «Concepto» miden interés; no confirman disponibilidad.
      </p>
    </section>
  );
}
