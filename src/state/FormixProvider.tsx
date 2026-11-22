import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { BASE_CATALOG } from '../data/catalog';
import { createSeedData } from '../data/seed';
import { applyCatalogOverrides } from '../domain/catalog';
import { ADMIN_PIN, DEFAULT_OPERATOR, MAX_INITIALS, OPERATOR_PIN } from '../domain/constants';
import { useHashRoute } from './useHashRoute';
import { useOnline } from './useOnline';
import {
  completeSession,
  markFoamDone as markFoamDoneRepo,
  redeemReward as redeemRewardRepo,
  startSession,
  updatePreferences,
  validateGame as validateGameRepo,
} from './repository';
import type { PreferencePatch, RepoResult } from './repository';
import {
  STORAGE_KEYS,
  loadCurrentSessionId,
  loadData,
  loadSoundEnabled,
  loadStaff,
  readData,
  saveCurrentSessionId,
  saveData,
  saveSoundEnabled,
  saveStaff,
} from './storage';
import type {
  AppData,
  CatalogItem,
  GameResultValue,
  GameType,
  ItemStatus,
  Session,
  StaffRole,
  StaffSession,
} from '../domain/types';

export interface FormixContextValue {
  data: AppData;
  catalog: CatalogItem[];
  currentSession: Session | null;
  soundEnabled: boolean;
  staff: StaffSession | null;
  isOnline: boolean;
  route: string;
  startNewSession: () => Session;
  resumeSession: (sessionId: string) => void;
  markFoamDone: () => void;
  setPreference: (patch: PreferencePatch) => RepoResult<Session>;
  completeCreation: () => RepoResult<Session>;
  validateGame: (
    code: string,
    gameType: GameType,
    result: GameResultValue,
    initials: string,
  ) => RepoResult<Session>;
  redeemReward: (code: string, initials: string) => RepoResult<Session>;
  setCatalogStatus: (itemId: string, status: ItemStatus) => void;
  resetDemo: () => void;
  prepareFair: () => void;
  clearSessions: () => void;
  login: (role: StaffRole, pin: string, initials: string) => boolean;
  logout: () => void;
  setSoundEnabled: (enabled: boolean) => void;
}

export interface FormixProviderProps {
  children: ReactNode;
  initialData?: AppData;
  initialCurrentSessionId?: string | null;
  initialStaff?: StaffSession | null;
}

const FormixContext = createContext<FormixContextValue | null>(null);

function cleanInitials(raw: string): string {
  return raw.trim().slice(0, MAX_INITIALS).toUpperCase() || DEFAULT_OPERATOR;
}

export function FormixProvider({
  children,
  initialData,
  initialCurrentSessionId,
  initialStaff,
}: FormixProviderProps) {
  const [data, setDataState] = useState<AppData>(() => initialData ?? loadData());
  const [currentSessionId, setCurrentSessionIdState] = useState<string | null>(() =>
    initialCurrentSessionId !== undefined ? initialCurrentSessionId : loadCurrentSessionId(),
  );
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => loadSoundEnabled());
  const [staff, setStaff] = useState<StaffSession | null>(() =>
    initialStaff !== undefined ? initialStaff : loadStaff(),
  );
  const dataRef = useRef(data);
  const isOnline = useOnline();
  const route = useHashRoute();

  const setData = useCallback((next: AppData) => {
    dataRef.current = next;
    setDataState(next);
  }, []);

  const setCurrentSessionId = useCallback((id: string | null) => {
    setCurrentSessionIdState(id);
    saveCurrentSessionId(id);
  }, []);

  useEffect(() => {
    saveData(data);
  }, [data]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.data) {
        const next = readData();
        if (next) {
          dataRef.current = next;
          setDataState(next);
        }
      }
      if (event.key === STORAGE_KEYS.currentSession) {
        setCurrentSessionIdState(loadCurrentSessionId());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const catalog = useMemo(
    () => applyCatalogOverrides(BASE_CATALOG, data.catalogOverrides),
    [data.catalogOverrides],
  );

  const currentSession = useMemo(
    () => data.sessions.find((session) => session.id === currentSessionId) ?? null,
    [data.sessions, currentSessionId],
  );

  const startNewSession = useCallback((): Session => {
    const result = startSession(dataRef.current);
    if (!result.ok) throw new Error('No se pudo iniciar la sesión');
    setData(result.data);
    setCurrentSessionId(result.value.id);
    return result.value;
  }, [setCurrentSessionId, setData]);

  const resumeSession = useCallback(
    (sessionId: string) => {
      setCurrentSessionId(sessionId);
    },
    [setCurrentSessionId],
  );

  const markFoamDone = useCallback(() => {
    if (!currentSessionId) return;
    setData(markFoamDoneRepo(dataRef.current, currentSessionId));
  }, [currentSessionId, setData]);

  const setPreference = useCallback(
    (patch: PreferencePatch): RepoResult<Session> => {
      if (!currentSessionId) return { ok: false, error: 'not-found' };
      const result = updatePreferences(dataRef.current, currentSessionId, patch);
      if (result.ok) setData(result.data);
      return result;
    },
    [currentSessionId, setData],
  );

  const completeCreation = useCallback((): RepoResult<Session> => {
    if (!currentSessionId) return { ok: false, error: 'not-found' };
    const result = completeSession(dataRef.current, currentSessionId);
    if (result.ok) setData(result.data);
    return result;
  }, [currentSessionId, setData]);

  const validateGame = useCallback(
    (
      code: string,
      gameType: GameType,
      result: GameResultValue,
      initials: string,
    ): RepoResult<Session> => {
      const outcome = validateGameRepo(dataRef.current, code, gameType, result, initials);
      if (outcome.ok) setData(outcome.data);
      return outcome;
    },
    [setData],
  );

  const redeemReward = useCallback(
    (code: string, initials: string): RepoResult<Session> => {
      const outcome = redeemRewardRepo(dataRef.current, code, initials);
      if (outcome.ok) setData(outcome.data);
      return outcome;
    },
    [setData],
  );

  const setCatalogStatus = useCallback(
    (itemId: string, status: ItemStatus) => {
      const current = dataRef.current;
      setData({
        ...current,
        catalogOverrides: { ...current.catalogOverrides, [itemId]: status },
      });
    },
    [setData],
  );

  const resetDemo = useCallback(() => {
    const current = dataRef.current;
    const fresh = createSeedData();
    const realSessions = current.sessions.filter((session) => !session.isSeed);
    setData({
      ...fresh,
      sessions: [...realSessions, ...fresh.sessions],
      catalogOverrides: current.catalogOverrides,
    });
  }, [setData]);

  const prepareFair = useCallback(() => {
    const current = dataRef.current;
    const currentIsSeed = current.sessions.some(
      (session) => session.id === currentSessionId && session.isSeed,
    );
    setData({
      ...current,
      sessions: current.sessions.filter((session) => !session.isSeed),
      seededAt: null,
    });
    if (currentIsSeed) setCurrentSessionId(null);
  }, [currentSessionId, setCurrentSessionId, setData]);

  const clearSessions = useCallback(() => {
    setData({ ...dataRef.current, sessions: [], seededAt: null });
    setCurrentSessionId(null);
  }, [setCurrentSessionId, setData]);

  const login = useCallback(
    (role: StaffRole, pin: string, initials: string): boolean => {
      const expected = role === 'admin' ? ADMIN_PIN : OPERATOR_PIN;
      if (pin.trim() !== expected) return false;
      const session: StaffSession = {
        role,
        initials: cleanInitials(initials),
        loggedAt: new Date().toISOString(),
      };
      setStaff(session);
      saveStaff(session);
      return true;
    },
    [],
  );

  const logout = useCallback(() => {
    setStaff(null);
    saveStaff(null);
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    saveSoundEnabled(enabled);
  }, []);

  const value: FormixContextValue = {
    data,
    catalog,
    currentSession,
    soundEnabled,
    staff,
    isOnline,
    route,
    startNewSession,
    resumeSession,
    markFoamDone,
    setPreference,
    completeCreation,
    validateGame,
    redeemReward,
    setCatalogStatus,
    resetDemo,
    prepareFair,
    clearSessions,
    login,
    logout,
    setSoundEnabled,
  };

  return <FormixContext.Provider value={value}>{children}</FormixContext.Provider>;
}

export function useFormix(): FormixContextValue {
  const context = useContext(FormixContext);
  if (!context) throw new Error('useFormix debe usarse dentro de FormixProvider');
  return context;
}
