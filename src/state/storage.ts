import { createSeedData } from '../data/seed';
import type { AppData, StaffSession } from '../domain/types';

export const STORAGE_KEYS = {
  data: 'formix.data.v1',
  currentSession: 'formix.currentSession.v1',
  sound: 'formix.sound.v1',
  staff: 'formix.staff.v1',
} as const;

function readRaw(storage: 'local' | 'session', key: string): string | null {
  try {
    return (storage === 'local' ? localStorage : sessionStorage).getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(storage: 'local' | 'session', key: string, value: string): void {
  try {
    (storage === 'local' ? localStorage : sessionStorage).setItem(key, value);
  } catch {
    // Storage may be unavailable in private mode; the in-memory state still works.
  }
}

function removeRaw(storage: 'local' | 'session', key: string): void {
  try {
    (storage === 'local' ? localStorage : sessionStorage).removeItem(key);
  } catch {
    // Ignore unavailable storage.
  }
}

export function readData(): AppData | null {
  const raw = readRaw('local', STORAGE_KEYS.data);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AppData>;
    if (parsed.version !== 1 || !Array.isArray(parsed.sessions)) return null;
    return {
      version: 1,
      sessions: parsed.sessions,
      catalogOverrides: parsed.catalogOverrides ?? {},
      seededAt: parsed.seededAt ?? null,
    };
  } catch {
    return null;
  }
}

export function loadData(now: Date = new Date()): AppData {
  const stored = readData();
  if (stored) return stored;
  const seeded = createSeedData(now);
  saveData(seeded);
  return seeded;
}

export function saveData(data: AppData): void {
  writeRaw('local', STORAGE_KEYS.data, JSON.stringify(data));
}

export function loadCurrentSessionId(): string | null {
  return readRaw('local', STORAGE_KEYS.currentSession);
}

export function saveCurrentSessionId(id: string | null): void {
  if (id) writeRaw('local', STORAGE_KEYS.currentSession, id);
  else removeRaw('local', STORAGE_KEYS.currentSession);
}

export function loadSoundEnabled(): boolean {
  return readRaw('local', STORAGE_KEYS.sound) !== 'false';
}

export function saveSoundEnabled(enabled: boolean): void {
  writeRaw('local', STORAGE_KEYS.sound, String(enabled));
}

export function loadStaff(): StaffSession | null {
  const raw = readRaw('session', STORAGE_KEYS.staff);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StaffSession>;
    if ((parsed.role !== 'operator' && parsed.role !== 'admin') || typeof parsed.initials !== 'string') {
      return null;
    }
    return {
      role: parsed.role,
      initials: parsed.initials,
      loggedAt: parsed.loggedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveStaff(staff: StaffSession | null): void {
  if (staff) writeRaw('session', STORAGE_KEYS.staff, JSON.stringify(staff));
  else removeRaw('session', STORAGE_KEYS.staff);
}

export function clearAllStorage(): void {
  removeRaw('local', STORAGE_KEYS.data);
  removeRaw('local', STORAGE_KEYS.currentSession);
  removeRaw('local', STORAGE_KEYS.sound);
  removeRaw('session', STORAGE_KEYS.staff);
}
