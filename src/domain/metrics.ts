import { itemName } from './catalog';
import type { CatalogItem, Session } from './types';

export interface PreferenceStat {
  id: string;
  name: string;
  count: number;
  pct: number;
}

export interface ComboStat {
  key: string;
  shape: string;
  color: string;
  scent: string;
  count: number;
  pct: number;
}

export interface Metrics {
  started: number;
  completed: number;
  completionRate: number;
  attended: number;
  attendanceRate: number;
  rewardsIssued: number;
  rewardsRedeemed: number;
  redemptionRate: number;
  shapes: PreferenceStat[];
  colors: PreferenceStat[];
  scents: PreferenceStat[];
  topCombos: ComboStat[];
}

export function filterByOrigin(sessions: Session[], includeDemo: boolean): Session[] {
  return includeDemo ? sessions : sessions.filter((session) => !session.isSeed);
}

function percentage(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

export function computeMetrics(
  sessions: Session[],
  catalog: CatalogItem[],
  includeDemo: boolean,
): Metrics {
  const filtered = filterByOrigin(sessions, includeDemo);
  const completedSessions = filtered.filter((session) => session.state === 'completed');
  const started = filtered.length;
  const completed = completedSessions.length;
  const attended = completedSessions.filter((session) => Object.keys(session.games).length > 0).length;
  const rewardsIssued = filtered.filter((session) => session.reward).length;
  const rewardsRedeemed = filtered.filter((session) => session.reward?.redeemedAt).length;

  const countBy = (type: 'shape' | 'color' | 'scent'): PreferenceStat[] => {
    const counts = new Map<string, number>();
    for (const session of completedSessions) {
      const id =
        type === 'shape'
          ? session.preferences?.shapeId
          : type === 'color'
            ? session.preferences?.colorId
            : session.preferences?.scentId;
      if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([id, count]) => ({ id, name: itemName(catalog, id), count, pct: percentage(count, completed) }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'es'));
  };

  const combos = new Map<string, { shapeId: string; colorId: string; scentId: string; count: number }>();
  for (const session of completedSessions) {
    const preferences = session.preferences;
    if (!preferences?.shapeId || !preferences.colorId || !preferences.scentId) continue;
    const key = `${preferences.shapeId}|${preferences.colorId}|${preferences.scentId}`;
    const current = combos.get(key);
    if (current) current.count += 1;
    else {
      combos.set(key, {
        shapeId: preferences.shapeId,
        colorId: preferences.colorId,
        scentId: preferences.scentId,
        count: 1,
      });
    }
  }

  const topCombos = [...combos.entries()]
    .map(([key, combo]) => ({
      key,
      shape: itemName(catalog, combo.shapeId),
      color: itemName(catalog, combo.colorId),
      scent: itemName(catalog, combo.scentId),
      count: combo.count,
      pct: percentage(combo.count, completed),
    }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
    .slice(0, 5);

  return {
    started,
    completed,
    completionRate: percentage(completed, started),
    attended,
    attendanceRate: percentage(attended, completed),
    rewardsIssued,
    rewardsRedeemed,
    redemptionRate: percentage(rewardsRedeemed, rewardsIssued),
    shapes: countBy('shape'),
    colors: countBy('color'),
    scents: countBy('scent'),
    topCombos,
  };
}
