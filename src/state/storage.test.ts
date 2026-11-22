import { STORAGE_KEYS, clearAllStorage, loadCurrentSessionId, loadData, loadSoundEnabled, loadStaff, readData, saveCurrentSessionId, saveData, saveSoundEnabled, saveStaff } from './storage';
import { completedSession, makeData } from '../test/fixtures';

const now = new Date('2026-11-22T18:00:00.000Z');

test('seeds the data store when it is empty', () => {
  const data = loadData(now);
  expect(data.sessions).toHaveLength(18);
  expect(data.seededAt).toBe(now.toISOString());
  expect(localStorage.getItem(STORAGE_KEYS.data)).toContain('seed-session-01');
  expect(readData()?.sessions).toHaveLength(18);
});

test('round-trips saved data', () => {
  const data = makeData([completedSession()]);
  saveData(data);
  expect(readData()).toEqual(data);
});

test('reseeds malformed or versioned data', () => {
  localStorage.setItem(STORAGE_KEYS.data, '{');
  expect(loadData(now).sessions).toHaveLength(18);

  localStorage.setItem(STORAGE_KEYS.data, JSON.stringify({ version: 2, sessions: [] }));
  expect(loadData(now).sessions).toHaveLength(18);
});

test('round-trips the current session and sound preference', () => {
  expect(loadCurrentSessionId()).toBeNull();
  saveCurrentSessionId('session-1');
  expect(loadCurrentSessionId()).toBe('session-1');
  saveCurrentSessionId(null);
  expect(loadCurrentSessionId()).toBeNull();

  expect(loadSoundEnabled()).toBe(true);
  saveSoundEnabled(false);
  expect(loadSoundEnabled()).toBe(false);
});

test('round-trips staff in sessionStorage', () => {
  const staff = { role: 'operator' as const, initials: 'AM', loggedAt: now.toISOString() };
  saveStaff(staff);
  expect(loadStaff()).toEqual(staff);
  expect(sessionStorage.getItem(STORAGE_KEYS.staff)).toContain('AM');
  saveStaff(null);
  expect(loadStaff()).toBeNull();
});

test('clears every FORMIX key', () => {
  saveData(makeData([completedSession()]));
  saveCurrentSessionId('session-1');
  saveSoundEnabled(false);
  saveStaff({ role: 'admin', initials: 'JP', loggedAt: now.toISOString() });
  clearAllStorage();
  expect(localStorage.getItem(STORAGE_KEYS.data)).toBeNull();
  expect(localStorage.getItem(STORAGE_KEYS.currentSession)).toBeNull();
  expect(localStorage.getItem(STORAGE_KEYS.sound)).toBeNull();
  expect(sessionStorage.getItem(STORAGE_KEYS.staff)).toBeNull();
});
