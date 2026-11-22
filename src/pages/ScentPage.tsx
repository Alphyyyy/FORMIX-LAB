import { Button } from '../components/Button';
import { Progress } from '../components/Progress';
import { ScentIcon } from '../components/ScentIcon';
import { StatusChip } from '../components/StatusChip';
import { visibleItems } from '../domain/catalog';
import { useFormix } from '../state/FormixProvider';
import { navigate } from '../state/useHashRoute';
import { useSound } from '../state/useSound';

export function ScentPage() {
  const { currentSession, catalog, setPreference } = useFormix();
  const { play } = useSound();
  const scents = visibleItems(catalog, 'scent');
  const selected = currentSession?.preferences?.scentId ?? '';

  const choose = (id: string) => {
    setPreference({ scentId: id });
    play('pop');
  };

  return (
    <section className="flow-page">
      <Progress step={4} />
      <header className="flow-head">
        <p className="eyebrow">Paso 4 · Aroma</p>
        <h1 className="flow-title">Elige tu aroma</h1>
        <p className="flow-lede">Una nota que te acompañe al abrir el jabón.</p>
      </header>

      <div className="scent-grid">
        {scents.map((scent) => {
          const active = selected === scent.id;
          return (
            <button
              key={scent.id}
              type="button"
              className={`scent-card${active ? ' scent-card--selected' : ''}`}
              aria-pressed={active}
              onClick={() => choose(scent.id)}
            >
              <span className="scent-card__icon">
                <ScentIcon name={scent.name} size={34} />
              </span>
              <span className="scent-card__text">
                <span className="scent-card__top">
                  <span className="scent-card__name">{scent.name}</span>
                  {scent.status === 'proposed' ? <StatusChip status="proposed" /> : null}
                </span>
                <span className="scent-card__notes">{scent.notes}</span>
              </span>
              <span className="scent-card__check" aria-hidden="true">
                ✓
              </span>
            </button>
          );
        })}
      </div>

      <p className="form-note">
        No ingerir. Si tienes sensibilidad a las fragancias, participa con precaución.
      </p>

      <Button
        size="lg"
        full
        disabled={!selected}
        onClick={() => {
          play('pop');
          navigate('/crear/creacion');
        }}
      >
        Continuar
      </Button>
    </section>
  );
}
