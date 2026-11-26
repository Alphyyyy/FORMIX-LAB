import { CONSENT_VERSION } from '../domain/constants';
import { isCloudMode } from '../lib/supabase';
import { Modal } from './Modal';

export function PrivacyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Aviso de privacidad">
      <div className="privacy-copy">
        <p>
          FORMIX LAB es una actividad de investigación de mercado de FORMIX. Queremos entender qué
          formas, colores y aromas prefieren las personas que visitan la feria.
        </p>
        <p>
          <strong>No solicitamos nombre, teléfono, correo ni DNI.</strong> Guardamos de forma anónima
          tus elecciones (molde, color y aroma), la fecha, el resultado de los retos y el estado del
          premio.
        </p>
        <p>
          {isCloudMode
            ? 'Los datos se guardan en un servidor seguro de FORMIX para analizar las preferencias de la feria. No se usan para publicidad ni se comparten con terceros.'
            : 'Los datos se almacenan en este dispositivo durante la demostración y se exportan de forma agregada para orientar la producción. No se usan para publicidad ni se comparten con terceros.'}
        </p>
        <p>
          Puedes pedir información al equipo del puesto. Una sesión no identifica necesariamente a
          una persona distinta: una misma persona puede repetir la experiencia.
        </p>
        <p className="privacy-copy__version">Versión del aviso: {CONSENT_VERSION}</p>
      </div>
    </Modal>
  );
}
