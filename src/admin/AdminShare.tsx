import { FairPrep } from './FairPrep';
import { QrCard } from './QrCard';

export function AdminShare() {
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
        <FairPrep />
      </div>
    </section>
  );
}
