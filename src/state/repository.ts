import { generateCode, normalizeCode } from '../domain/code';
import { CONSENT_VERSION } from '../domain/constants';
import type { AppData, Preferences, Session } from '../domain/types';

export type RepoError =
  | 'not-found'
  | 'completed'
  | 'incomplete'
  | 'not-completed'
  | 'already-validated'
  | 'already-redeemed'
  | 'no-reward';

export type RepoResult<T> =
  | { ok: true; data: AppData; value: T; notice?: 'reward-locked' }
  | { ok: false; error: RepoError };

export type PreferencePatch = Partial<
  Pick<Preferences, 'shapeId' | 'colorId' | 'scentId' | 'purchaseIntent' | 'giftIntent'>
>;

export function createEmptyData(): AppData {
  return { version: 1, sessions: [], catalogOverrides: {}, seededAt: null };
}

function replaceSession(data: AppData, session: Session): AppData {
  return {
    ...data,
    sessions: data.sessions.map((item) => (item.id === session.id ? session : item)),
  };
}

export function startSession(data: AppData, now: Date = new Date()): RepoResult<Session> {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const session: Session = {
    id,
    startedAt: now.toISOString(),
    completedAt: null,
    state: 'started',
    code: null,
    consentVersion: CONSENT_VERSION,
    foamDone: false,
    preferences: null,
    games: {},
    reward: null,
    isSeed: false,
  };
  return { ok: true, data: { ...data, sessions: [...data.sessions, session] }, value: session };
}

export function markFoamDone(data: AppData, id: string): AppData {
  return {
    ...data,
    sessions: data.sessions.map((session) => {
      if (session.id !== id || session.state === 'completed') return session;
      return { ...session, foamDone: true };
    }),
  };
}

export function updatePreferences(
  data: AppData,
  id: string,
  patch: PreferencePatch,
): RepoResult<Session> {
  const session = data.sessions.find((item) => item.id === id);
  if (!session) return { ok: false, error: 'not-found' };
  if (session.state === 'completed') return { ok: false, error: 'completed' };

  const current: Preferences = session.preferences ?? {
    shapeId: '',
    colorId: '',
    scentId: '',
    purchaseIntent: false,
    giftIntent: false,
    submittedAt: null,
  };
  const updated: Session = { ...session, preferences: { ...current, ...patch } };
  return { ok: true, data: replaceSession(data, updated), value: updated };
}

export function completeSession(
  data: AppData,
  id: string,
  now: Date = new Date(),
): RepoResult<Session> {
  const session = data.sessions.find((item) => item.id === id);
  if (!session) return { ok: false, error: 'not-found' };
  if (session.state === 'completed') return { ok: false, error: 'completed' };

  const preferences = session.preferences;
  if (!preferences?.shapeId || !preferences.colorId || !preferences.scentId) {
    return { ok: false, error: 'incomplete' };
  }

  const existingCodes = data.sessions
    .map((item) => item.code)
    .filter((code): code is string => Boolean(code));
  const code = generateCode(existingCodes);
  const completed: Session = {
    ...session,
    state: 'completed',
    completedAt: now.toISOString(),
    code,
    preferences: { ...preferences, submittedAt: now.toISOString() },
  };
  return { ok: true, data: replaceSession(data, completed), value: completed };
}

export function findSessionByCode(data: AppData, raw: string): Session | undefined {
  const code = normalizeCode(raw);
  if (!code) return undefined;
  return data.sessions.find((session) => session.code === code);
}
