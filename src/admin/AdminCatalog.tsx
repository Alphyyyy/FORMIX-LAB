import type { ItemStatus, ItemType } from '../domain/types';
import { useFormix } from '../state/FormixProvider';

const GROUPS: { type: ItemType; label: string }[] = [
  { type: 'shape', label: 'Moldes' },
  { type: 'color', label: 'Colores' },
  { type: 'scent', label: 'Aromas' },
];

const STATUSES: { value: ItemStatus; label: string }[] = [
  { value: 'available', label: 'Disponible' },
  { value: 'proposed', label: 'Concepto' },
  { value: 'inactive', label: 'Inactivo' },
];

export function AdminCatalog() {
  const { catalog, setCatalogStatus } = useFormix();

  return (
    <section className="admin-catalog">
      <div className="admin-sessions__head">
        <div>
          <p className="eyebrow">Catálogo</p>
          <h2>Opciones del laboratorio</h2>
          <p className="form-note">
            Los cambios afectan a las nuevas selecciones. El historial conserva sus referencias.
          </p>
        </div>
      </div>

      <div className="catalog-groups">
        {GROUPS.map((group) => {
          const items = catalog
            .filter((item) => item.type === group.type)
            .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'es'));
          const counts = {
            available: items.filter((item) => item.status === 'available').length,
            proposed: items.filter((item) => item.status === 'proposed').length,
            inactive: items.filter((item) => item.status === 'inactive').length,
          };
          return (
            <div className="catalog-group" key={group.type}>
              <div className="catalog-group__head">
                <h3>{group.label}</h3>
                <span>
                  {counts.available} disponibles · {counts.proposed} concepto · {counts.inactive}{' '}
                  inactivos
                </span>
              </div>
              <div className="catalog-list">
                {items.map((item) => (
                  <div className="catalog-row" key={item.id}>
                    <div className="catalog-row__copy">
                      <strong>{item.name}</strong>
                      <span>{item.notes}</span>
                    </div>
                    <label className="catalog-select">
                      <span className="visually-hidden">Estado de {item.name}</span>
                      <select
                        aria-label={`Estado de ${item.name}`}
                        value={item.status}
                        onChange={(event) =>
                          setCatalogStatus(item.id, event.target.value as ItemStatus)
                        }
                      >
                        {STATUSES.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
