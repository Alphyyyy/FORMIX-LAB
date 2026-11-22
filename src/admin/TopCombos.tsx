import type { ComboStat } from '../domain/metrics';

export function TopCombos({ combos }: { combos: ComboStat[] }) {
  return (
    <section className="combo-block">
      <h3>Combinaciones más elegidas</h3>
      {combos.length ? (
        <ol className="combo-list">
          {combos.map((combo, index) => (
            <li key={combo.key}>
              <span className="combo-list__rank">{String(index + 1).padStart(2, '0')}</span>
              <span className="combo-list__name">
                {combo.shape} · {combo.color} · {combo.scent}
              </span>
              <span className="combo-list__count">{combo.count}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="form-note">Sin datos todavía.</p>
      )}
    </section>
  );
}
