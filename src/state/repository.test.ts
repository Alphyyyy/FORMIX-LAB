import { CONSENT_VERSION } from '../domain/constants';
import {
  completeSession,
  createEmptyData,
  findSessionByCode,
  markFoamDone,
  startSession,
  updatePreferences,
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
