import { useState } from 'react';
import { filterByOrigin } from '../domain/metrics';
import { rewardLabel } from '../domain/rewards';
import { useFormix } from '../state/FormixProvider';

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
}

export function AdminSessions({ includeDemo }: { includeDemo: boolean }) {
  const { allSessions, catalog } = useFormix();
  const [search, setSearch] = useState('');
  const sessions = filterByOrigin(allSessions, includeDemo)
    .filter((session) => session.code?.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => (b.completedAt ?? b.startedAt).localeCompare(a.completedAt ?? a.startedAt));

  return (
    <section className="admin-sessions">
      <div className="admin-sessions__head">
        <div>
          <p className="eyebrow">Registro</p>
          <h2>Sesiones</h2>
        </div>
        <label className="field field--search">
          <span>Buscar por código</span>
          <input
            type="search"
            placeholder="FX-XXXXXX"
            value={search}
            onChange={(event) => setSearch(event.target.value.toUpperCase())}
          />
        </label>
      </div>

      <div className="session-table-wrap">
        <table className="session-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Fecha</th>
              <th>Combinación</th>
              <th>Retos</th>
              <th>Premio</th>
              <th>Origen</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => {
              const played = Object.keys(session.games).length;
              return (
                <tr key={session.id}>
                  <td className="session-code">{session.code ?? '—'}</td>
                  <td>{formatDate(session.completedAt ?? session.startedAt)}</td>
                  <td>
                    {session.preferences
                      ? `${catalog.find((item) => item.id === session.preferences?.shapeId)?.name ?? '—'} · ${
                          catalog.find((item) => item.id === session.preferences?.colorId)?.name ?? '—'
                        } · ${catalog.find((item) => item.id === session.preferences?.scentId)?.name ?? '—'}`
                      : '—'}
                  </td>
                  <td>{played ? `${played}/2` : '—'}</td>
                  <td>{session.reward ? rewardLabel(session.reward.type) : '—'}</td>
                  <td>
                    <span className={`origin-badge origin-badge--${session.isSeed ? 'demo' : 'real'}`}>
                      {session.isSeed ? 'Demo' : 'Real'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sessions.length === 0 ? <p className="form-note">No hay sesiones que coincidan.</p> : null}
      </div>
    </section>
  );
}
