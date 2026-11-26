import { useEffect, useState } from 'react';
import { AdminCatalog } from '../admin/AdminCatalog';
import { AdminNav } from '../admin/AdminNav';
import { AdminSessions } from '../admin/AdminSessions';
import { AdminShare } from '../admin/AdminShare';
import { AdminSummary } from '../admin/AdminSummary';
import { ExportPanel } from '../admin/ExportPanel';
import { useFormix } from '../state/FormixProvider';
import { useHashRoute } from '../state/useHashRoute';

export function AdminPage() {
  const { data, isCloud, refreshAllSessions, cloudError } = useFormix();
  const route = useHashRoute();
  const [includeDemo, setIncludeDemo] = useState(
    () => !isCloud && !data.sessions.some((session) => !session.isSeed),
  );

  useEffect(() => {
    if (isCloud) void refreshAllSessions();
  }, [isCloud, refreshAllSessions]);

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
        {isCloud ? (
          <span className="origin-badge origin-badge--real">Datos en Supabase</span>
        ) : (
          <label className="demo-toggle">
            <input
              type="checkbox"
              checked={includeDemo}
              onChange={(event) => setIncludeDemo(event.target.checked)}
            />
            <span>Incluir datos de ejemplo</span>
          </label>
        )}
      </div>

      {cloudError ? (
        <p className="form-error" role="alert">
          {cloudError}
        </p>
      ) : null}

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
