import { BASE_CATALOG } from '../data/catalog';
import { applyCatalogOverrides } from './catalog';
import { computeMetrics, filterByOrigin } from './metrics';
import { completedSession, makeSession, prefs } from '../test/fixtures';
import type { GameResult, GameType, RewardType } from './types';

function game(type: GameType, result: 'WIN' | 'LOSE'): GameResult {
  return { gameType: type, result, validatedAt: '2026-11-22T12:00:00.000Z', operatorInitials: 'AM' };
}

function reward(type: RewardType, redeemed = false) {
  return {
    type,
    issuedAt: '2026-11-22T12:00:00.000Z',
    redeemedAt: redeemed ? '2026-11-22T12:05:00.000Z' : null,
    redeemedBy: redeemed ? 'AM' : null,
  };
}

const seed = completedSession({
  id: 'seed-1',
  isSeed: true,
  games: { bacteria: game('bacteria', 'WIN'), aroma: game('aroma', 'WIN') },
  reward: reward('photo_dance', true),
});
const realPhoto = completedSession({
  id: 'real-photo',
  games: { bacteria: game('bacteria', 'WIN') },
  reward: reward('photo'),
});
const realNoGames = completedSession({
  id: 'real-no-games',
  preferences: prefs({ shapeId: 'shape-corazon', colorId: 'color-malva', scentId: 'scent-vainilla' }),
});
const realStarted = makeSession({ id: 'real-started' });
const sessions = [seed, realPhoto, realNoGames, realStarted];

test('computes the agreed dashboard values', () => {
  const metrics = computeMetrics(sessions, BASE_CATALOG, true);
  expect(metrics).toMatchObject({
    started: 4,
    completed: 3,
    completionRate: 75,
    attended: 2,
    attendanceRate: 67,
    rewardsIssued: 2,
    rewardsRedeemed: 1,
    redemptionRate: 50,
  });
  expect(metrics.shapes[0]).toMatchObject({ name: 'Patita', count: 2, pct: 67 });
  expect(metrics.topCombos[0]).toMatchObject({
    shape: 'Patita',
    color: 'Rosa',
    scent: 'Fresa',
    count: 2,
  });
});

test('can exclude demo sessions from every metric', () => {
  const metrics = computeMetrics(sessions, BASE_CATALOG, false);
  expect(metrics.started).toBe(3);
  expect(metrics.completed).toBe(2);
  expect(metrics.attended).toBe(1);
  expect(metrics.rewardsIssued).toBe(1);
  expect(metrics.rewardsRedeemed).toBe(0);
  expect(filterByOrigin(sessions, false).every((session) => !session.isSeed)).toBe(true);
});

test('returns zeroes and empty arrays without data', () => {
  const metrics = computeMetrics([], BASE_CATALOG, true);
  expect(metrics).toMatchObject({
    started: 0,
    completed: 0,
    completionRate: 0,
    attended: 0,
    attendanceRate: 0,
    rewardsIssued: 0,
    rewardsRedeemed: 0,
    redemptionRate: 0,
  });
  expect(metrics.shapes).toEqual([]);
  expect(metrics.colors).toEqual([]);
  expect(metrics.scents).toEqual([]);
  expect(metrics.topCombos).toEqual([]);
});

test('resolves inactive historical items by name', () => {
  const inactive = applyCatalogOverrides(BASE_CATALOG, { 'shape-patita': 'inactive' });
  const metrics = computeMetrics(sessions, inactive, true);
  expect(metrics.shapes[0]?.name).toBe('Patita');
});
