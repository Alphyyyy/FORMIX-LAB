import { useState } from 'react';
import { AdminNav } from '../admin/AdminNav';
import { AdminSessions } from '../admin/AdminSessions';
import { AdminSummary } from '../admin/AdminSummary';
import { ExportPanel } from '../admin/ExportPanel';
import { useFormix } from '../state/FormixProvider';
import { useHashRoute } from '../state/useHashRoute';

export function AdminPage() {
  const { data } = useFormix();
  const route = useHashRoute();
  const [includeDemo, setIncludeDemo] = useState(() => !data.sessions.some((session) => !session.isSeed));

  const isSessions = route === '/admin/sesiones';
  const isCatalog = route === '/admin/catalogo';
  const isShare = route === '/admin/difusion';

  return (
    <section className="admin-page">
      <div className="admin-head">
        <div>
          <p className="eyebrow">Panel FORMIX</p>
          <h1>Resultados de la feria</h1>
          <p className="flow-lede">Preferencias, participación y premios de la experiencia.</p>
        </div>
        <label className="demo-toggle">
          <input
            type="checkbox"
            checked={includeDemo}
            onChange={(event) => setIncludeDemo(event.target.checked)}
          />
          <span>Incluir datos de ejemplo</span>
        </label>
      </div>

      <AdminNav />

      {isCatalog || isShare ? (
        <section className="admin-panel">
          <p className="eyebrow">Próximamente</p>
          <h2>{isCatalog ? 'Catálogo' : 'Difusión'}</h2>
          <p className="form-note">Esta sección se habilita en la siguiente tarea.</p>
        </section>
      ) : isSessions ? (
        <>
          <AdminSessions includeDemo={includeDemo} />
          <ExportPanel />
        </>
      ) : (
        <AdminSummary includeDemo={includeDemo} />
      )}
    </section>
  );
}

export default AdminPage;
