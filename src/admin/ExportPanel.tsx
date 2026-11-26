import { useState } from 'react';
import {
  csvFilename,
  gamesCsv,
  preferencesCsv,
  rewardsCsv,
  sessionsCsv,
} from '../domain/csv';
import type { CsvKind } from '../domain/csv';
import { downloadCsv } from '../lib/download';
import { useFormix } from '../state/FormixProvider';

export function ExportPanel() {
  const { allSessions, catalog, isCloud } = useFormix();
  const [includeDemo, setIncludeDemo] = useState(false);

  const exportFile = (kind: CsvKind) => {
    const withDemo = includeDemo && !isCloud;
    const filename = csvFilename(kind, withDemo);
    if (kind === 'sesiones') downloadCsv(filename, sessionsCsv(allSessions, catalog, withDemo));
    if (kind === 'preferencias') {
      downloadCsv(filename, preferencesCsv(allSessions, catalog, withDemo));
    }
    if (kind === 'juegos') downloadCsv(filename, gamesCsv(allSessions, withDemo));
    if (kind === 'premios') downloadCsv(filename, rewardsCsv(allSessions, withDemo));
  };

  return (
    <section className="export-panel staff-card">
      <div>
        <p className="eyebrow">Datos</p>
        <h2>Exportar CSV</h2>
        <p className="form-note">
          La exportación real excluye las sesiones de ejemplo. Activa la casilla para incluir demo.
        </p>
      </div>

      <label className="check-chip">
        <input
          type="checkbox"
          checked={includeDemo}
          onChange={(event) => setIncludeDemo(event.target.checked)}
          disabled={isCloud}
        />
        <span>{isCloud ? 'Datos en Supabase' : 'Incluir demo en el archivo'}</span>
      </label>

      <div className="export-grid">
        <button type="button" className="btn btn--secondary btn--md" onClick={() => exportFile('sesiones')}>
          Sesiones CSV
        </button>
        <button type="button" className="btn btn--secondary btn--md" onClick={() => exportFile('preferencias')}>
          Preferencias CSV
        </button>
        <button type="button" className="btn btn--secondary btn--md" onClick={() => exportFile('juegos')}>
          Juegos CSV
        </button>
        <button type="button" className="btn btn--secondary btn--md" onClick={() => exportFile('premios')}>
          Premios CSV
        </button>
      </div>
    </section>
  );
}
