import type { PreferenceStat } from '../domain/metrics';

export function PreferenceBars({ title, items }: { title: string; items: PreferenceStat[] }) {
  return (
    <section className="pref-block">
      <h3>{title}</h3>
      {items.length ? (
        <div className="pref-list">
          {items.map((item) => (
            <div className="pref-row" key={item.id}>
              <span className="pref-row__name">{item.name}</span>
              <span className="pref-row__bar" aria-hidden="true">
                <span style={{ width: `${Math.max(item.pct, 2)}%` }} />
              </span>
              <span className="pref-row__value">
                {item.count} · {item.pct}%
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="form-note">Sin datos todavía.</p>
      )}
    </section>
  );
}
