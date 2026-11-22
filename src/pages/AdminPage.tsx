import { useState } from 'react';
import { AdminCatalog } from '../admin/AdminCatalog';
import { AdminNav } from '../admin/AdminNav';
import { AdminSessions } from '../admin/AdminSessions';
import { AdminShare } from '../admin/AdminShare';
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
        isCatalog ? <AdminCatalog /> : <AdminShare />
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
