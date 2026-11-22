import { useState } from 'react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { useFormix } from '../state/FormixProvider';

type Action = 'prepare' | 'reset' | 'clear' | null;

const COPY: Record<Exclude<Action, null>, string> = {
  prepare: 'Se quitarán las 18 sesiones de ejemplo. Las sesiones reales se conservan.',
  reset: 'Se restaurarán las 18 sesiones de ejemplo. Las sesiones reales se conservan.',
  clear: 'Se borrarán todas las sesiones, incluidas las reales. Esta acción no se puede deshacer.',
};

const CONFIRM: Record<Exclude<Action, null>, string> = {
  prepare: 'Quitar ejemplos',
  reset: 'Restablecer',
  clear: 'Borrar todo',
};

export function FairPrep() {
  const { prepareFair, resetDemo, clearSessions } = useFormix();
  const [action, setAction] = useState<Action>(null);
  const [clearText, setClearText] = useState('');
  const [message, setMessage] = useState('');

  const run = () => {
    if (action === 'prepare') {
      prepareFair();
      setMessage('Datos de ejemplo retirados. Las sesiones reales se conservan.');
    }
    if (action === 'reset') {
      resetDemo();
      setMessage('Datos de ejemplo restablecidos.');
    }
    if (action === 'clear') {
      clearSessions();
      setMessage('Todas las sesiones fueron borradas.');
    }
    setAction(null);
    setClearText('');
  };

  return (
    <section className="fair-prep staff-card">
      <div>
        <p className="eyebrow">Preparación</p>
        <h2>Antes de la feria</h2>
        <p className="form-note">
          Retira los ejemplos para empezar con datos limpios. El panel seguirá funcionando en este
          navegador.
        </p>
      </div>
      <div className="fair-actions">
        <Button variant="secondary" onClick={() => setAction('prepare')}>
          Preparar feria
        </Button>
        <Button variant="ghost" onClick={() => setAction('reset')}>
          Restablecer demo
        </Button>
        <Button variant="ghost" onClick={() => setAction('clear')}>
          Borrar todas las sesiones
        </Button>
      </div>
      <p className="form-note" role="status" aria-live="polite">
        {message}
      </p>

      <Modal
        open={action !== null}
        title="Confirmar acción"
        onClose={() => setAction(null)}
      >
        {action ? <p className="form-note" style={{ fontSize: 13 }}>{COPY[action]}</p> : null}
        {action === 'clear' ? (
          <label className="field" style={{ marginTop: 14 }}>
            <span>Escribe BORRAR para confirmar</span>
            <input value={clearText} onChange={(event) => setClearText(event.target.value)} />
          </label>
        ) : null}
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setAction(null)}>
            Cancelar
          </Button>
          <Button
            variant={action === 'clear' ? 'ghost' : 'primary'}
            disabled={action === 'clear' && clearText !== 'BORRAR'}
            onClick={run}
          >
            {action ? CONFIRM[action] : 'Confirmar'}
          </Button>
        </div>
      </Modal>
    </section>
  );
}
