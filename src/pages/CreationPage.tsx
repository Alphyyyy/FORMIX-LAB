import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { PrivacyDialog } from '../components/PrivacyDialog';
import { Progress } from '../components/Progress';
import { Soap } from '../components/Soap';
import { itemName } from '../domain/catalog';
import { useFormix } from '../state/FormixProvider';
import { navigate } from '../state/useHashRoute';
import { useSound } from '../state/useSound';

const ERROR_MESSAGES: Record<string, string> = {
  incomplete: 'Falta elegir un molde, un color o un aroma.',
  completed: 'Esta fórmula ya está guardada.',
  'not-found': 'No encontramos la sesión. Vuelve a empezar.',
};

export function CreationPage() {
  const { currentSession, catalog, completeCreation, setPreference } = useFormix();
  const { play } = useSound();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const completed = currentSession?.state === 'completed';

  useEffect(() => {
    if (completed) navigate('/mision', { replace: true });
  }, [completed]);

  if (completed) return <p>Redirigiendo a tu misión…</p>;

  const preferences = currentSession?.preferences;
  if (!preferences?.shapeId || !preferences.colorId || !preferences.scentId) {
    return <p>Completa tu fórmula para ver el resumen.</p>;
  }

  const save = () => {
    if (saving) return;
    setSaving(true);
    setError('');
    const result = completeCreation();
    if (result.ok) {
      play('success');
      navigate('/mision');
      return;
    }
    setError(ERROR_MESSAGES[result.error] ?? 'No se pudo guardar la fórmula. Inténtalo de nuevo.');
    setSaving(false);
  };

  return (
    <section className="flow-page">
      <Progress step={5} />
      <header className="flow-head">
        <p className="eyebrow">Paso 5 · Tu creación</p>
        <h1 className="flow-title">Tu creación FORMIX</h1>
        <p className="flow-lede">Esta es tu fórmula. Revísala antes de guardarla.</p>
      </header>

      <div className="selection-preview creation-preview">
        <Soap
          shapeId={preferences.shapeId}
          colorId={preferences.colorId}
          size={196}
        />
      </div>

      <div className="creation-summary">
        <div className="summary-row">
          <span className="summary-row__label">Molde</span>
          <span className="summary-row__value">{itemName(catalog, preferences.shapeId)}</span>
          <a className="summary-row__edit" href="#/crear/molde">
            Editar
          </a>
        </div>
        <div className="summary-row">
          <span className="summary-row__label">Color</span>
          <span className="summary-row__value">{itemName(catalog, preferences.colorId)}</span>
          <a className="summary-row__edit" href="#/crear/color">
            Editar
          </a>
        </div>
        <div className="summary-row">
          <span className="summary-row__label">Aroma</span>
          <span className="summary-row__value">{itemName(catalog, preferences.scentId)}</span>
          <a className="summary-row__edit" href="#/crear/aroma">
            Editar
          </a>
        </div>
      </div>

      <div className="check-list">
        <label className="check-chip">
          <input
            type="checkbox"
            checked={preferences.purchaseIntent}
            onChange={(event) => setPreference({ purchaseIntent: event.target.checked })}
          />
          <span>Me interesaría comprarlo</span>
        </label>
        <label className="check-chip">
          <input
            type="checkbox"
            checked={preferences.giftIntent}
            onChange={(event) => setPreference({ giftIntent: event.target.checked })}
          />
          <span>Sería para regalo</span>
        </label>
      </div>

      <p className="creation-note">Es una preferencia, no un pedido ni una reserva.</p>

      <Button size="lg" full disabled={saving} onClick={save}>
        {saving ? 'Guardando…' : 'Guardar mi creación'}
      </Button>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <button type="button" className="link-button" onClick={() => setPrivacyOpen(true)}>
        Aviso de privacidad
      </button>

      <PrivacyDialog open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </section>
  );
}
