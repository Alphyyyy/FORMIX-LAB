import { CONSENT_VERSION } from '../domain/constants';
import { rewardFor } from '../domain/rewards';
import type { AppData, GameResult, GameResultValue, GameType, Session } from '../domain/types';

const SHAPES = [
  'shape-patita',
  'shape-corazon',
  'shape-esfera',
  'shape-rosa',
  'shape-osito',
  'shape-estrella',
  'shape-luna',
  'shape-concha',
];
const COLORS = ['color-rosa', 'color-malva', 'color-azul', 'color-verde', 'color-naranja', 'color-marfil'];
const SCENTS = ['scent-fresa', 'scent-chocolate', 'scent-vainilla', 'scent-coco', 'scent-lavanda', 'scent-naranja'];

const CODES = [
  'FX-K7M2Q9',
  'FX-P4N8R2',
  'FX-T6W3Y7',
  'FX-Z2C5V8',
  'FX-H9J4L6',
  'FX-M3B7D9',
  'FX-Q8S2T4',
  'FX-V5X7Z3',
  'FX-A4C6E8',
  'FX-G2K9M4',
  'FX-N7P3R5',
  'FX-U6W8Y2',
  'FX-B9D4F6',
  'FX-J3L7N9',
];

type GameSpec = { type: GameType; result: GameResultValue };

const GAMES: GameSpec[][] = [
  [{ type: 'bacteria', result: 'WIN' }, { type: 'aroma', result: 'WIN' }],
  [{ type: 'bacteria', result: 'WIN' }],
  [{ type: 'bacteria', result: 'LOSE' }],
  [{ type: 'bacteria', result: 'WIN' }, { type: 'aroma', result: 'WIN' }],
  [{ type: 'bacteria', result: 'LOSE' }, { type: 'aroma', result: 'LOSE' }],
  [{ type: 'bacteria', result: 'WIN' }, { type: 'aroma', result: 'LOSE' }],
  [{ type: 'bacteria', result: 'WIN' }],
  [{ type: 'bacteria', result: 'WIN' }, { type: 'aroma', result: 'WIN' }],
  [{ type: 'aroma', result: 'LOSE' }],
  [{ type: 'bacteria', result: 'WIN' }, { type: 'aroma', result: 'WIN' }],
  [],
  [],
  [],
  [],
];

const REDEEMED = new Map<number, string>([
  [0, 'AM'],
  [2, 'JP'],
  [5, 'AM'],
  [7, 'JP'],
]);

const MINUTE = 60_000;
const HOUR = 3_600_000;

function at(now: Date, hoursAgo: number): Date {
  return new Date(now.getTime() - hoursAgo * HOUR);
}

function plus(date: Date, minutes: number): string {
  return new Date(date.getTime() + minutes * MINUTE).toISOString();
}

function buildSession(index: number, now: Date): Session {
  const completed = index < 14;
  const started = at(now, completed ? [1, 2, 3, 5, 7, 9, 12, 16, 20, 24, 30, 36, 42, 47][index] : [0.5, 4, 11, 26][index - 14]);
  const base: Session = {
    id: `seed-session-${String(index + 1).padStart(2, '0')}`,
    startedAt: started.toISOString(),
    completedAt: null,
    state: 'started',
    code: null,
    consentVersion: CONSENT_VERSION,
    foamDone: false,
    preferences: null,
    games: {},
    reward: null,
    isSeed: true,
  };

  if (!completed) return base;

  const completedAt = new Date(started.getTime() + 12 * MINUTE);
  const gameSpecs = GAMES[index];
  const games: Partial<Record<GameType, GameResult>> = {};
  gameSpecs.forEach((spec, gameIndex) => {
    const validatedAt = plus(completedAt, gameIndex + 1);
    games[spec.type] = {
      gameType: spec.type,
      result: spec.result,
      validatedAt,
      operatorInitials: index % 2 === 0 ? 'AM' : 'JP',
    };
  });

  const rewardType = rewardFor(games);
  const lastGame = gameSpecs.length > 0 ? plus(completedAt, gameSpecs.length) : null;
  const issuedAt = lastGame ? plus(new Date(lastGame), 1) : null;
  const redeemedBy = REDEEMED.get(index);

  return {
    ...base,
    startedAt: new Date(completedAt.getTime() - 12 * MINUTE).toISOString(),
    completedAt: completedAt.toISOString(),
    state: 'completed',
    code: CODES[index],
    foamDone: true,
    preferences: {
      shapeId: SHAPES[index % SHAPES.length],
      colorId: COLORS[index % COLORS.length],
      scentId: SCENTS[index % SCENTS.length],
      purchaseIntent: index % 2 === 0,
      giftIntent: index % 3 === 0,
      submittedAt: completedAt.toISOString(),
    },
    games,
    reward:
      rewardType && issuedAt
        ? {
            type: rewardType,
            issuedAt,
            redeemedAt: redeemedBy ? plus(new Date(issuedAt), 5) : null,
            redeemedBy: redeemedBy ?? null,
          }
        : null,
  };
}

export function createSeedSessions(now: Date = new Date()): Session[] {
  return Array.from({ length: 18 }, (_, index) => buildSession(index, now));
}

export function createSeedData(now: Date = new Date()): AppData {
  return {
    version: 1,
    sessions: createSeedSessions(now),
    catalogOverrides: {},
    seededAt: now.toISOString(),
  };
}
