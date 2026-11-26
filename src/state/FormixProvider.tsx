import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { BASE_CATALOG } from '../data/catalog';
import { createSeedData } from '../data/seed';
import { applyCatalogOverrides } from '../domain/catalog';
import { ADMIN_PIN, DEFAULT_OPERATOR, MAX_INITIALS, OPERATOR_PIN } from '../domain/constants';
import {
  cloudCompleteSession,
  cloudErrorMessage,
  cloudFetchAllSessions,
  cloudFetchCatalog,
  cloudFetchSession,
  cloudFindSessionByCode,
  cloudGetMyStaff,
  cloudRedeemReward,
  cloudSetCatalogStatus,
  cloudSignInStaff,
  cloudSignOut,
  cloudStartSession,
  cloudValidateGame,
  ensureVisitorAuth,
} from '../lib/cloud';
import { isCloudMode } from '../lib/supabase';
import { useHashRoute } from './useHashRoute';
import { useOnline } from './useOnline';
import {
  completeSession,
  createEmptyData,
  findSessionByCode as findLocalSessionByCode,
  markFoamDone as markFoamDoneRepo,
  redeemReward as redeemRewardRepo,
  startSession,
  updatePreferences,
  validateGame as validateGameRepo,
} from './repository';
import type { PreferencePatch, RepoError, RepoResult } from './repository';
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
  allSessions: Session[];
  currentSession: Session | null;
  soundEnabled: boolean;
  staff: StaffSession | null;
  staffLoading: boolean;
  cloudError: string;
  isCloud: boolean;
  isOnline: boolean;
  route: string;
  startNewSession: () => Session;
  resumeSession: (sessionId: string) => void;
  markFoamDone: () => void;
  setPreference: (patch: PreferencePatch) => RepoResult<Session>;
  completeCreation: () => Promise<RepoResult<Session>>;
  validateGame: (
    code: string,
    gameType: GameType,
    result: GameResultValue,
    initials: string,
  ) => Promise<RepoResult<Session>>;
  redeemReward: (code: string, initials: string) => Promise<RepoResult<Session>>;
  findSessionByCode: (code: string) => Promise<Session | null>;
  refreshAllSessions: () => Promise<void>;
  refreshCurrentSession: () => Promise<void>;
  setCatalogStatus: (itemId: string, status: ItemStatus) => void;
  resetDemo: () => void;
  prepareFair: () => void;
  clearSessions: () => void;
  login: (role: StaffRole, pin: string, initials: string) => boolean;
  loginWithPassword: (email: string, password: string) => Promise<StaffSession | null>;
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

function mergeSession(sessions: Session[], session: Session): Session[] {
  const index = sessions.findIndex((item) => item.id === session.id);
  if (index === -1) return [...sessions, session];
  const next = [...sessions];
  next[index] = session;
  return next;
}

function mapCloudError(error: unknown): RepoError {
  const message = cloudErrorMessage(error);
  if (message.includes('already_validated')) return 'already-validated';
  if (message.includes('session_not_found')) return 'not-found';
  if (message.includes('no_reward')) return 'no-reward';
  if (message.includes('not_staff')) return 'not-found';
  if (message.includes('incomplete')) return 'incomplete';
  return 'remote';
}

export function FormixProvider({
  children,
  initialData,
  initialCurrentSessionId,
  initialStaff,
}: FormixProviderProps) {
  const [data, setDataState] = useState<AppData>(() =>
    initialData ?? (isCloudMode ? (readData() ?? createEmptyData()) : loadData()),
  );
  const [currentSessionId, setCurrentSessionIdState] = useState<string | null>(() =>
    initialCurrentSessionId !== undefined ? initialCurrentSessionId : loadCurrentSessionId(),
  );
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => loadSoundEnabled());
  const [staff, setStaff] = useState<StaffSession | null>(() =>
    initialStaff !== undefined ? initialStaff : isCloudMode ? null : loadStaff(),
  );
  const [cloudCatalog, setCloudCatalog] = useState<CatalogItem[] | null>(null);
  const [cloudSessions, setCloudSessions] = useState<Session[]>([]);
  const [staffLoading, setStaffLoading] = useState(isCloudMode);
  const [cloudError, setCloudError] = useState('');
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

  useEffect(() => {
    if (!isCloudMode) {
      setStaffLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await ensureVisitorAuth();
        const [catalogItems, currentStaff] = await Promise.all([
          cloudFetchCatalog(),
          cloudGetMyStaff(),
        ]);
        if (cancelled) return;
        setCloudCatalog(catalogItems);
        if (currentStaff) {
          setStaff(currentStaff);
          const sessions = await cloudFetchAllSessions();
          if (!cancelled) setCloudSessions(sessions);
        }
      } catch (error) {
        if (!cancelled) setCloudError(cloudErrorMessage(error));
      } finally {
        if (!cancelled) setStaffLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const catalog = useMemo(
    () => cloudCatalog ?? applyCatalogOverrides(BASE_CATALOG, data.catalogOverrides),
    [cloudCatalog, data.catalogOverrides],
  );

  const currentSession = useMemo(
    () => data.sessions.find((session) => session.id === currentSessionId) ?? null,
    [data.sessions, currentSessionId],
  );

  const allSessions = isCloudMode ? cloudSessions : data.sessions;

  const refreshAllSessions = useCallback(async () => {
    if (!isCloudMode) return;
    try {
      setCloudSessions(await cloudFetchAllSessions());
      setCloudError('');
    } catch (error) {
      setCloudError(cloudErrorMessage(error));
    }
  }, []);

  const refreshCurrentSession = useCallback(async () => {
    if (!isCloudMode || !currentSessionId) return;
    try {
      const remote = await cloudFetchSession(currentSessionId);
      if (remote) {
        setData({
          ...dataRef.current,
          sessions: mergeSession(dataRef.current.sessions, remote),
        });
      }
    } catch (error) {
      setCloudError(cloudErrorMessage(error));
    }
  }, [currentSessionId, setData]);

  const startNewSession = useCallback((): Session => {
    const result = startSession(dataRef.current);
    if (!result.ok) throw new Error('No se pudo iniciar la sesión');
    setData(result.data);
    setCurrentSessionId(result.value.id);
    if (isCloudMode) {
      void cloudStartSession(result.value).catch((error) => {
        setCloudError(cloudErrorMessage(error));
      });
    }
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

  const completeCreation = useCallback(async (): Promise<RepoResult<Session>> => {
    if (!currentSessionId) return { ok: false, error: 'not-found' };
    const local = dataRef.current.sessions.find((session) => session.id === currentSessionId);
    if (!local) return { ok: false, error: 'not-found' };
    if (!local.preferences?.shapeId || !local.preferences.colorId || !local.preferences.scentId) {
      return { ok: false, error: 'incomplete' };
    }

    if (isCloudMode) {
      try {
        const remote = await cloudCompleteSession(local);
        const nextData = {
          ...dataRef.current,
          sessions: mergeSession(dataRef.current.sessions, remote),
        };
        setData(nextData);
        setCloudSessions((previous) => mergeSession(previous, remote));
        setCloudError('');
        return { ok: true, data: nextData, value: remote };
      } catch (error) {
        setCloudError(cloudErrorMessage(error));
        return { ok: false, error: mapCloudError(error) };
      }
    }

    const result = completeSession(dataRef.current, currentSessionId);
    if (result.ok) setData(result.data);
    return result;
  }, [currentSessionId, setData]);

  const validateGame = useCallback(
    async (
      code: string,
      gameType: GameType,
      result: GameResultValue,
      initials: string,
    ): Promise<RepoResult<Session>> => {
      if (isCloudMode) {
        try {
          const outcome = await cloudValidateGame(code, gameType, result);
          const nextData = {
            ...dataRef.current,
            sessions: mergeSession(dataRef.current.sessions, outcome.session),
          };
          setData(nextData);
          setCloudSessions((previous) => mergeSession(previous, outcome.session));
          setCloudError('');
          const response: RepoResult<Session> = {
            ok: true,
            data: nextData,
            value: outcome.session,
          };
          if (outcome.rewardLocked) response.notice = 'reward-locked';
          return response;
        } catch (error) {
          setCloudError(cloudErrorMessage(error));
          return { ok: false, error: mapCloudError(error) };
        }
      }

      const outcome = validateGameRepo(dataRef.current, code, gameType, result, initials);
      if (outcome.ok) setData(outcome.data);
      return outcome;
    },
    [setData],
  );

  const redeemReward = useCallback(
    async (code: string, initials: string): Promise<RepoResult<Session>> => {
      if (isCloudMode) {
        try {
          const outcome = await cloudRedeemReward(code);
          if (outcome.alreadyRedeemed) {
            return { ok: false, error: 'already-redeemed' };
          }
          const nextData = {
            ...dataRef.current,
            sessions: mergeSession(dataRef.current.sessions, outcome.session),
          };
          setData(nextData);
          setCloudSessions((previous) => mergeSession(previous, outcome.session));
          setCloudError('');
          return { ok: true, data: nextData, value: outcome.session };
        } catch (error) {
          setCloudError(cloudErrorMessage(error));
          return { ok: false, error: mapCloudError(error) };
        }
      }

      const outcome = redeemRewardRepo(dataRef.current, code, initials);
      if (outcome.ok) setData(outcome.data);
      return outcome;
    },
    [setData],
  );

  const findSessionByCode = useCallback(async (code: string): Promise<Session | null> => {
    if (!isCloudMode) {
      return findLocalSessionByCode(dataRef.current, code) ?? null;
    }
    try {
      const session = await cloudFindSessionByCode(code);
      setCloudError('');
      return session;
    } catch (error) {
      setCloudError(cloudErrorMessage(error));
      return null;
    }
  }, []);

  const setCatalogStatus = useCallback(
    (itemId: string, status: ItemStatus) => {
      if (isCloudMode) {
        setCloudCatalog((previous) =>
          previous?.map((item) => (item.id === itemId ? { ...item, status } : item)) ?? null,
        );
        void cloudSetCatalogStatus(itemId, status)
          .then((updated) => {
            setCloudCatalog(
              (previous) =>
                previous?.map((item) => (item.id === updated.id ? updated : item)) ?? null,
            );
            setCloudError('');
          })
          .catch(async (error) => {
            setCloudError(cloudErrorMessage(error));
            try {
              setCloudCatalog(await cloudFetchCatalog());
            } catch {
              // Keep the optimistic value if the refresh also fails.
            }
          });
        return;
      }

      const current = dataRef.current;
      setData({
        ...current,
        catalogOverrides: { ...current.catalogOverrides, [itemId]: status },
      });
    },
    [setData],
  );

  const resetDemo = useCallback(() => {
    if (isCloudMode) return;
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
    if (isCloudMode) return;
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
    if (isCloudMode) return;
    setData({ ...dataRef.current, sessions: [], seededAt: null });
    setCurrentSessionId(null);
  }, [setCurrentSessionId, setData]);

  const login = useCallback(
    (role: StaffRole, pin: string, initials: string): boolean => {
      if (isCloudMode) return false;
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

  const loginWithPassword = useCallback(
    async (email: string, password: string): Promise<StaffSession | null> => {
      if (!isCloudMode) return null;
      try {
        const session = await cloudSignInStaff(email, password);
        setStaff(session);
        setCloudError('');
        try {
          setCloudSessions(await cloudFetchAllSessions());
        } catch {
          // The panel can refresh again after login.
        }
        return session;
      } catch (error) {
        setCloudError(cloudErrorMessage(error));
        return null;
      }
    },
    [],
  );

  const logout = useCallback(() => {
    setStaff(null);
    setCloudSessions([]);
    if (isCloudMode) {
      void cloudSignOut();
    } else {
      saveStaff(null);
    }
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    saveSoundEnabled(enabled);
  }, []);

  const value: FormixContextValue = {
    data,
    catalog,
    allSessions,
    currentSession,
    soundEnabled,
    staff,
    staffLoading,
    cloudError,
    isCloud: isCloudMode,
    isOnline,
    route,
    startNewSession,
    resumeSession,
    markFoamDone,
    setPreference,
    completeCreation,
    validateGame,
    redeemReward,
    findSessionByCode,
    refreshAllSessions,
    refreshCurrentSession,
    setCatalogStatus,
    resetDemo,
    prepareFair,
    clearSessions,
    login,
    loginWithPassword,
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
