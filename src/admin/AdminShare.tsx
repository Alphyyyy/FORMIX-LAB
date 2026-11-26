import { useFormix } from '../state/FormixProvider';
import { FairPrep } from './FairPrep';
import { QrCard } from './QrCard';

export function AdminShare() {
  const { isCloud } = useFormix();

  return (
    <section className="admin-share">
      <div>
        <p className="eyebrow">Difusión</p>
        <h2>Comparte el laboratorio</h2>
        <p className="form-note">
          Imprime el QR en el puesto o comparte el enlace para abrir la experiencia en un celular.
        </p>
      </div>
      <div className="share-grid">
        <QrCard />
        {isCloud ? (
          <section className="fair-prep staff-card">
            <div>
              <p className="eyebrow">Modo nube</p>
              <h2>Datos en Supabase</h2>
              <p className="form-note">
                Las sesiones se guardan en la nube y se comparten entre dispositivos. Para borrar
                datos de prueba antes del evento, usa el SQL Editor de Supabase.
              </p>
            </div>
          </section>
        ) : (
          <FairPrep />
        )}
      </div>
    </section>
  );
}
