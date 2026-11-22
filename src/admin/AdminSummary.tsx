import { computeMetrics } from '../domain/metrics';
import { useFormix } from '../state/FormixProvider';
import { PreferenceBars } from './PreferenceBars';
import { StatCard } from './StatCard';
import { TopCombos } from './TopCombos';

export function AdminSummary({ includeDemo }: { includeDemo: boolean }) {
  const { data, catalog } = useFormix();
  const metrics = computeMetrics(data.sessions, catalog, includeDemo);
  const hasSeeds = data.sessions.some((session) => session.isSeed);

  return (
    <div className="admin-summary">
      {includeDemo && hasSeeds ? <span className="demo-badge">Datos de demostración</span> : null}

      <div className="kpi-grid">
        <StatCard label="Sesiones iniciadas" value={metrics.started} />
        <StatCard label="Completadas" value={metrics.completed} />
        <StatCard label="Tasa de finalización" value={`${metrics.completionRate}%`} />
        <StatCard label="Participación presencial" value={`${metrics.attendanceRate}%`} hint={`${metrics.attended} sesiones`} />
        <StatCard label="Premios emitidos" value={metrics.rewardsIssued} />
        <StatCard label="Premios canjeados" value={metrics.rewardsRedeemed} hint={`${metrics.redemptionRate}% de canje`} />
      </div>

      <div className="admin-columns">
        <section className="admin-panel">
          <p className="eyebrow">Preferencias</p>
          <PreferenceBars title="Moldes" items={metrics.shapes} />
          <PreferenceBars title="Colores" items={metrics.colors} />
          <PreferenceBars title="Aromas" items={metrics.scents} />
        </section>
        <section className="admin-panel">
          <p className="eyebrow">Ranking</p>
          <TopCombos combos={metrics.topCombos} />
        </section>
      </div>

      <p className="method-note">
        Muestra por conveniencia de la feria. Una sesión no equivale necesariamente a una persona
        distinta; los resultados no representan a toda la ciudad.
      </p>
    </div>
  );
}
