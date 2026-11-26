import { generateCode, normalizeCode } from '../domain/code';
import { CONSENT_VERSION, DEFAULT_OPERATOR, MAX_INITIALS } from '../domain/constants';
import { rewardFor, rewardRank } from '../domain/rewards';
import type { AppData, GameResultValue, GameType, Preferences, Session } from '../domain/types';

export type RepoError =
  | 'not-found'
  | 'completed'
  | 'incomplete'
  | 'not-completed'
  | 'already-validated'
  | 'already-redeemed'
  | 'no-reward'
  | 'remote';

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

function cleanInitials(raw: string): string {
  const trimmed = raw.trim().slice(0, MAX_INITIALS).toUpperCase();
  return trimmed || DEFAULT_OPERATOR;
}

export function validateGame(
  data: AppData,
  rawCode: string,
  gameType: GameType,
  result: GameResultValue,
  initials: string,
  now: Date = new Date(),
): RepoResult<Session> {
  const session = findSessionByCode(data, rawCode);
  if (!session) return { ok: false, error: 'not-found' };
  if (session.games[gameType]) return { ok: false, error: 'already-validated' };

  const games = {
    ...session.games,
    [gameType]: {
      gameType,
      result,
      validatedAt: now.toISOString(),
      operatorInitials: cleanInitials(initials),
    },
  };
  const nextType = rewardFor(games);
  if (!nextType) return { ok: false, error: 'not-found' };

  let reward = session.reward;
  let notice: 'reward-locked' | undefined;
  if (!reward) {
    reward = {
      type: nextType,
      issuedAt: now.toISOString(),
      redeemedAt: null,
      redeemedBy: null,
    };
  } else if (reward.redeemedAt) {
    if (rewardRank(nextType) > rewardRank(reward.type)) notice = 'reward-locked';
  } else if (rewardRank(nextType) > rewardRank(reward.type)) {
    reward = { ...reward, type: nextType };
  }

  const updated: Session = { ...session, games, reward };
  const response: RepoResult<Session> = {
    ok: true,
    data: replaceSession(data, updated),
    value: updated,
  };
  if (notice) response.notice = notice;
  return response;
}

export function redeemReward(
  data: AppData,
  rawCode: string,
  initials: string,
  now: Date = new Date(),
): RepoResult<Session> {
  const session = findSessionByCode(data, rawCode);
  if (!session) return { ok: false, error: 'not-found' };
  if (!session.reward) return { ok: false, error: 'no-reward' };
  if (session.reward.redeemedAt) return { ok: false, error: 'already-redeemed' };

  const updated: Session = {
    ...session,
    reward: {
      ...session.reward,
      redeemedAt: now.toISOString(),
      redeemedBy: cleanInitials(initials),
    },
  };
  return { ok: true, data: replaceSession(data, updated), value: updated };
}
