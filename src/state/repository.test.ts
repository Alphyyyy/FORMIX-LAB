import { CONSENT_VERSION } from '../domain/constants';
import {
  completeSession,
  createEmptyData,
  findSessionByCode,
  markFoamDone,
  redeemReward,
  startSession,
  updatePreferences,
  validateGame,
} from './repository';

function startTestSession(now?: Date) {
  const result = startSession(createEmptyData(), now);
  if (!result.ok) throw new Error('start failed');
  return { data: result.data, session: result.value };
}

test('starts an anonymous session with no code or preferences', () => {
  const result = startSession(createEmptyData(), new Date('2026-11-22T10:00:00.000Z'));
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  const session = result.value;
  expect(session.state).toBe('started');
  expect(session.code).toBeNull();
  expect(session.preferences).toBeNull();
  expect(session.games).toEqual({});
  expect(session.isSeed).toBe(false);
  expect(session.consentVersion).toBe(CONSENT_VERSION);
  expect(session.startedAt).toBe('2026-11-22T10:00:00.000Z');
});

test('marks foam done and saves one selection set at a time', () => {
  const { data, session } = startTestSession();
  const withFoam = markFoamDone(data, session.id);
  const result = updatePreferences(withFoam, session.id, { shapeId: 'shape-patita' });
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.value.foamDone).toBe(true);
  expect(result.value.preferences?.shapeId).toBe('shape-patita');
  expect(result.value.state).toBe('started');
});

test('completes only with all three selections and issues a valid unique code', () => {
  const first = startTestSession();
  const missing = completeSession(first.data, first.session.id);
  expect(missing).toEqual({ ok: false, error: 'incomplete' });

  const withPrefs = updatePreferences(first.data, first.session.id, {
    shapeId: 'shape-patita',
    colorId: 'color-rosa',
    scentId: 'scent-fresa',
  });
  if (!withPrefs.ok) throw new Error('setup failed');
  const done = completeSession(withPrefs.data, first.session.id, new Date('2026-11-22T10:04:00.000Z'));
  expect(done.ok).toBe(true);
  if (!done.ok) return;
  expect(done.value.state).toBe('completed');
  expect(done.value.code).toMatch(/^FX-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  expect(done.value.preferences?.submittedAt).toBe('2026-11-22T10:04:00.000Z');

  const second = startTestSession();
  const secondPrefs = updatePreferences(second.data, second.session.id, {
    shapeId: 'shape-corazon',
    colorId: 'color-malva',
    scentId: 'scent-vainilla',
  });
  if (!secondPrefs.ok) throw new Error('setup failed');
  const secondDone = completeSession(secondPrefs.data, second.session.id);
  if (!secondDone.ok) throw new Error('setup failed');
  expect(secondDone.value.code).not.toBe(done.value.code);
});

test('rejects preference edits after completion and resolves codes with or without prefix', () => {
  const { data, session } = startTestSession();
  const withPrefs = updatePreferences(data, session.id, {
    shapeId: 'shape-patita',
    colorId: 'color-rosa',
    scentId: 'scent-fresa',
  });
  if (!withPrefs.ok) throw new Error('setup failed');
  const done = completeSession(withPrefs.data, session.id);
  if (!done.ok) throw new Error('setup failed');

  expect(updatePreferences(done.data, session.id, { shapeId: 'shape-corazon' })).toEqual({
    ok: false,
    error: 'completed',
  });
  expect(findSessionByCode(done.data, done.value.code!.slice(3))?.id).toBe(session.id);
  expect(findSessionByCode(done.data, 'FX-NOPE23')).toBeUndefined();
});

test('markFoamDone leaves a completed session unchanged', () => {
  const { data, session } = startTestSession();
  const withPrefs = updatePreferences(data, session.id, {
    shapeId: 'shape-patita',
    colorId: 'color-rosa',
    scentId: 'scent-fresa',
  });
  if (!withPrefs.ok) throw new Error('setup failed');
  const done = completeSession(withPrefs.data, session.id);
  if (!done.ok) throw new Error('setup failed');

  expect(markFoamDone(done.data, session.id)).toEqual(done.data);
});

function completedWithCode() {
  const started = startSession(createEmptyData());
  if (!started.ok) throw new Error('start failed');
  const saved = updatePreferences(started.data, started.value.id, {
    shapeId: 'shape-patita',
    colorId: 'color-rosa',
    scentId: 'scent-fresa',
  });
  if (!saved.ok) throw new Error('setup failed');
  const done = completeSession(saved.data, started.value.id);
  if (!done.ok) throw new Error('setup failed');
  return done;
}

test('rejects unknown codes and sessions without a code', () => {
  const done = completedWithCode();
  expect(validateGame(done.data, 'FX-NOPE23', 'bacteria', 'WIN', 'AM')).toEqual({
    ok: false,
    error: 'not-found',
  });

  const started = startSession(createEmptyData());
  if (!started.ok) throw new Error('start failed');
  expect(validateGame(started.data, 'FX-ABC234', 'bacteria', 'WIN', 'AM')).toEqual({
    ok: false,
    error: 'not-found',
  });
});

test('first game issues greeting on a loss and photo on a win', () => {
  const done = completedWithCode();
  const lost = validateGame(done.data, done.value.code!, 'bacteria', 'LOSE', 'am');
  expect(lost.ok).toBe(true);
  if (!lost.ok) return;
  expect(lost.value.reward?.type).toBe('greeting');
  expect(lost.value.games.bacteria?.operatorInitials).toBe('AM');

  const won = validateGame(done.data, done.value.code!, 'bacteria', 'WIN', '  AM  ');
  expect(won.ok).toBe(true);
  if (!won.ok) return;
  expect(won.value.reward?.type).toBe('photo');
  expect(won.value.games.bacteria?.operatorInitials).toBe('AM');
});

test('upgrades the same reward in place until redemption', () => {
  const done = completedWithCode();
  const first = validateGame(done.data, done.value.code!, 'bacteria', 'WIN', 'AM');
  if (!first.ok) throw new Error('setup failed');
  const issuedAt = first.value.reward?.issuedAt;

  const second = validateGame(first.data, done.value.code!, 'aroma', 'WIN', 'JP');
  expect(second.ok).toBe(true);
  if (!second.ok) return;
  expect(second.value.reward?.type).toBe('photo_dance');
  expect(second.value.reward?.issuedAt).toBe(issuedAt);
});

test('rejects duplicate game validation without changing the reward', () => {
  const done = completedWithCode();
  const first = validateGame(done.data, done.value.code!, 'bacteria', 'WIN', 'AM');
  if (!first.ok) throw new Error('setup failed');
  const duplicate = validateGame(first.data, done.value.code!, 'bacteria', 'LOSE', 'JP');
  expect(duplicate).toEqual({ ok: false, error: 'already-validated' });
  expect(first.data.sessions[0].games.bacteria?.result).toBe('WIN');
});

test('second game after redemption is recorded but cannot upgrade the reward', () => {
  const done = completedWithCode();
  const first = validateGame(done.data, done.value.code!, 'bacteria', 'WIN', 'AM');
  if (!first.ok) throw new Error('setup failed');
  const redeemed = redeemReward(first.data, done.value.code!, 'AM');
  if (!redeemed.ok) throw new Error('setup failed');
  const redeemedAt = redeemed.value.reward?.redeemedAt;

  const second = validateGame(redeemed.data, done.value.code!, 'aroma', 'WIN', 'JP');
  expect(second.ok).toBe(true);
  if (!second.ok) return;
  expect(second.notice).toBe('reward-locked');
  expect(second.value.reward?.type).toBe('photo');
  expect(second.value.reward?.redeemedAt).toBe(redeemedAt);
  expect(second.value.games.aroma?.result).toBe('WIN');
});

test('redeems only an issued reward and only once', () => {
  const done = completedWithCode();
  expect(redeemReward(done.data, done.value.code!, 'AM')).toEqual({ ok: false, error: 'no-reward' });

  const first = validateGame(done.data, done.value.code!, 'bacteria', 'WIN', 'AM');
  if (!first.ok) throw new Error('setup failed');
  const redeemed = redeemReward(first.data, done.value.code!, '  JP  ');
  expect(redeemed.ok).toBe(true);
  if (!redeemed.ok) return;
  expect(redeemed.value.reward?.redeemedBy).toBe('JP');
  expect(redeemed.value.reward?.redeemedAt).toBeTruthy();

  expect(redeemReward(redeemed.data, done.value.code!, 'AM')).toEqual({
    ok: false,
    error: 'already-redeemed',
  });
});

test('cleans operator initials and applies the default and maximum length', () => {
  const done = completedWithCode();
  const blank = validateGame(done.data, done.value.code!, 'bacteria', 'WIN', '   ');
  if (!blank.ok) throw new Error('setup failed');
  expect(blank.value.games.bacteria?.operatorInitials).toBe('Operador');

  const long = validateGame(done.data, done.value.code!, 'aroma', 'WIN', '  ABCDEFGHIJKLMNOP  ');
  if (!long.ok) throw new Error('setup failed');
  expect(long.value.games.aroma?.operatorInitials).toBe('ABCDEFGHIJKL');
});
