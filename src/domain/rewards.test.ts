import { canRedeem, rewardDescription, rewardFor, rewardLabel } from './rewards';
import type { GameResult, Session } from './types';

function game(gameType: 'bacteria' | 'aroma', result: 'WIN' | 'LOSE'): GameResult {
  return { gameType, result, validatedAt: '2026-11-22T12:00:00.000Z', operatorInitials: 'AM' };
}

test('maps validated games to the ladder', () => {
  expect(rewardFor({})).toBeNull();
  expect(rewardFor({ bacteria: game('bacteria', 'LOSE') })).toBe('greeting');
  expect(rewardFor({ bacteria: game('bacteria', 'WIN') })).toBe('photo');
  expect(rewardFor({ bacteria: game('bacteria', 'WIN'), aroma: game('aroma', 'LOSE') })).toBe('photo');
  expect(rewardFor({ bacteria: game('bacteria', 'WIN'), aroma: game('aroma', 'WIN') })).toBe('photo_dance');
  expect(rewardFor({ bacteria: game('bacteria', 'LOSE'), aroma: game('aroma', 'LOSE') })).toBe('greeting');
});

test('labels and descriptions are the approved copy', () => {
  expect(rewardLabel('greeting')).toBe('Saludo de la mascota');
  expect(rewardLabel('photo')).toBe('Foto con la mascota');
  expect(rewardLabel('photo_dance')).toBe('Baile + foto con la mascota');
  expect(rewardDescription('greeting')).toContain('saludo');
  expect(rewardDescription('photo')).toContain('foto');
  expect(rewardDescription('photo_dance')).toContain('Baile');
});

test('canRedeem requires an issued, unredeemed reward', () => {
  const base = { reward: null } as unknown as Session;
  expect(canRedeem(base)).toBe(false);
  expect(canRedeem({ ...base, reward: { type: 'photo', issuedAt: 'x', redeemedAt: null, redeemedBy: null } })).toBe(true);
  expect(canRedeem({ ...base, reward: { type: 'photo', issuedAt: 'x', redeemedAt: 'y', redeemedBy: 'AM' } })).toBe(false);
});
