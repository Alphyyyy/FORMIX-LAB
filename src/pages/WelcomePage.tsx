import { useState } from 'react';
import { Button } from '../components/Button';
import { Mascot } from '../components/Mascot';
import { PrivacyDialog } from '../components/PrivacyDialog';
import { resumePath } from '../domain/flow';
import { useFormix } from '../state/FormixProvider';
import { navigate } from '../state/useHashRoute';
import { useSound } from '../state/useSound';

export function WelcomePage() {
  const { currentSession, catalog, startNewSession } = useFormix();
  const { play } = useSound();
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const inProgress = currentSession?.state === 'started';
  const completed = currentSession?.state === 'completed';

  const begin = () => {
    startNewSession();
    play('jingle');
    navigate('/crear/espuma');
  };

  const startAnother = () => {
    startNewSession();
    play('pop');
    navigate('/crear/espuma');
  };

  const continueFormula = () => {
    navigate(resumePath(currentSession, catalog));
  };

  const statusMessage = completed
    ? 'Tu fórmula está guardada. Puedes ver tu misión o crear otra.'
    : inProgress
      ? 'Tienes una fórmula a medias. Puedes continuar o empezar de nuevo.'
      : 'Listo para crear tu fórmula.';

  return (
    <section className="welcome">
      <div className="welcome__copy">
        <p className="eyebrow">FORMIX LAB · Feria 2026</p>
        <h1 className="display">
          Tu jabón. <span className="welcome__line">Tu fórmula.</span>
        </h1>
        <p className="lede">
          Entra al laboratorio de FORMIX: elige molde, color y aroma, y descubre tu combinación.
        </p>
        <div className="welcome__facts" aria-label="Datos de la experiencia">
          <span>3 minutos</span>
          <span>Sin registro</span>
          <span>Sin datos personales</span>
        </div>
      </div>

      <div className="welcome__mascot">
        <Mascot mood={completed ? 'celebrate' : inProgress ? 'wink' : 'hello'} size={210} />
        <span className="welcome__tag">Burbuja · tu guía de laboratorio</span>
      </div>

      <div className="welcome__actions">
        {completed ? (
          <>
            <Button size="lg" full onClick={() => navigate('/mision')}>
              Ver mi misión
            </Button>
            <Button variant="secondary" full onClick={startAnother}>
              Crear otra
            </Button>
          </>
        ) : inProgress ? (
          <>
            <Button size="lg" full onClick={continueFormula}>
              Continuar mi fórmula
            </Button>
            <Button variant="secondary" full onClick={startAnother}>
              Empezar de nuevo
            </Button>
          </>
        ) : (
          <Button size="lg" full onClick={begin}>
            Entrar al laboratorio
          </Button>
        )}

        <button type="button" className="link-button" onClick={() => setPrivacyOpen(true)}>
          Aviso de privacidad
        </button>
      </div>

      <p className="welcome__trust">
        Investigación anónima de preferencias. Esta experiencia no es una tienda ni una reserva de
        producto.
      </p>

      <p className="visually-hidden" aria-live="polite">
        {statusMessage}
      </p>

      <PrivacyDialog open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </section>
  );
}
