import { Button } from '../components/Button';
import { Mascot } from '../components/Mascot';
import { Soap } from '../components/Soap';
import { itemName } from '../domain/catalog';
import { useFormix } from '../state/FormixProvider';
import { navigate } from '../state/useHashRoute';

export function ThanksPage() {
  const { currentSession, catalog, startNewSession } = useFormix();
  const preferences = currentSession?.preferences;

  const restart = () => {
    startNewSession();
    navigate('/crear/espuma');
  };

  return (
    <section className="flow-page thanks-page">
      <Mascot mood="celebrate" size={170} />
      <header className="flow-head" style={{ textAlign: 'center', justifyItems: 'center' }}>
        <p className="eyebrow">Fin del laboratorio</p>
        <h1 className="flow-title">Gracias por crear con nosotros.</h1>
        <p className="flow-lede">
          Tus elecciones nos ayudan a crear jabones que realmente encanten.
        </p>
      </header>

      <div className="thanks-summary">
        {preferences ? (
          <>
            <Soap shapeId={preferences.shapeId} colorId={preferences.colorId} size={104} />
            <dl>
              <div>
                <dt>Molde</dt>
                <dd>{itemName(catalog, preferences.shapeId)}</dd>
              </div>
              <div>
                <dt>Color</dt>
                <dd>{itemName(catalog, preferences.colorId)}</dd>
              </div>
              <div>
                <dt>Aroma</dt>
                <dd>{itemName(catalog, preferences.scentId)}</dd>
              </div>
            </dl>
          </>
        ) : null}
      </div>

      <Button size="lg" full onClick={restart}>
        Volver a empezar
      </Button>
      <a className="link-button" href="#/">
        Volver al inicio
      </a>
    </section>
  );
}
