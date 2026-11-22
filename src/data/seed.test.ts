import { createSeedData } from './seed';

const now = new Date('2026-11-22T18:00:00.000Z');
const data = createSeedData(now);

test('seeds 18 flagged sessions with unique ids and completed codes', () => {
  expect(data.sessions).toHaveLength(18);
  expect(data.sessions.every((s) => s.isSeed)).toBe(true);
  expect(new Set(data.sessions.map((s) => s.id)).size).toBe(18);
  const codes = data.sessions.flatMap((s) => (s.code ? [s.code] : []));
  expect(codes).toHaveLength(14);
  expect(new Set(codes).size).toBe(14);
  expect(codes.every((code) => /^FX-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(code))).toBe(true);
});

test('seeds the agreed distribution for a useful dashboard', () => {
  expect(data.sessions.filter((s) => s.state === 'completed')).toHaveLength(14);
  expect(data.sessions.filter((s) => Object.keys(s.games).length > 0)).toHaveLength(10);
  expect(data.sessions.filter((s) => s.reward)).toHaveLength(10);
  expect(data.sessions.filter((s) => s.reward?.redeemedAt)).toHaveLength(4);
  expect(new Set(data.sessions.flatMap((s) => (s.reward ? [s.reward.type] : [])))).toEqual(
    new Set(['greeting', 'photo', 'photo_dance']),
  );
});

test('completed sessions have preferences and started sessions do not', () => {
  for (const session of data.sessions) {
    if (session.state === 'completed') {
      expect(session.completedAt).toBeTruthy();
      expect(session.code).toBeTruthy();
      expect(session.preferences?.shapeId).toBeTruthy();
      expect(session.preferences?.colorId).toBeTruthy();
      expect(session.preferences?.scentId).toBeTruthy();
    } else {
      expect(session.completedAt).toBeNull();
      expect(session.code).toBeNull();
      expect(session.preferences).toBeNull();
    }
  }
});
