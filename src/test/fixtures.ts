import { CONSENT_VERSION } from '../domain/constants';
import type { AppData, Preferences, Session } from '../domain/types';

export function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-1',
    startedAt: '2026-11-22T10:00:00.000Z',
    completedAt: null,
    state: 'started',
    code: null,
    consentVersion: CONSENT_VERSION,
    foamDone: false,
    preferences: null,
    games: {},
    reward: null,
    isSeed: false,
    ...overrides,
  };
}

export function makeData(sessions: Session[] = []): AppData {
  return { version: 1, sessions, catalogOverrides: {}, seededAt: null };
}

export function prefs(overrides: Partial<Preferences> = {}): Preferences {
  return {
    shapeId: 'shape-patita',
    colorId: 'color-rosa',
    scentId: 'scent-fresa',
    purchaseIntent: false,
    giftIntent: false,
    submittedAt: null,
    ...overrides,
  };
}

export function completedSession(overrides: Partial<Session> = {}): Session {
  return makeSession({
    completedAt: '2026-11-22T10:04:00.000Z',
    state: 'completed',
    code: 'FX-ABC234',
    foamDone: true,
    preferences: prefs({ submittedAt: '2026-11-22T10:04:00.000Z' }),
    ...overrides,
  });
}
