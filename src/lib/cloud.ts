import type {
  CatalogItem,
  GameResult,
  GameType,
  Reward,
  Session,
  StaffSession,
} from '../domain/types';
import { normalizeCode } from '../domain/code';
import { supabase } from './supabase';

interface CloudGame {
  gameType?: GameType;
  result: 'WIN' | 'LOSE';
  validatedAt: string;
  operatorInitials: string;
}

interface CloudReward {
  type: 'greeting' | 'photo' | 'photo_dance';
  issuedAt: string;
  redeemedAt: string | null;
  redeemedBy: string | null;
}

interface CloudSessionRow {
  id: string;
  user_id: string;
  code: string | null;
  started_at: string;
  completed_at: string | null;
  state: 'started' | 'completed';
  consent_version: string;
  foam_done: boolean;
  shape_id: string | null;
  color_id: string | null;
  scent_id: string | null;
  purchase_intent: boolean;
  gift_intent: boolean;
  games: Record<string, CloudGame> | null;
  reward: CloudReward | null;
}

interface CloudCatalogRow {
  id: string;
  type: 'shape' | 'color' | 'scent';
  name: string;
  notes: string;
  status: 'available' | 'proposed' | 'inactive';
  sort_order: number;
  swatch: string | null;
  swatch_dark: string | null;
  created_at: string;
}

function client() {
  if (!supabase) throw new Error('Supabase no está configurado');
  return supabase;
}

function firstRow<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export function mapCloudSession(row: CloudSessionRow): Session {
  const games: Partial<Record<GameType, GameResult>> = {};
  for (const [key, value] of Object.entries(row.games ?? {})) {
    if (key !== 'bacteria' && key !== 'aroma') continue;
    games[key] = {
      gameType: value.gameType ?? key,
      result: value.result,
      validatedAt: value.validatedAt,
      operatorInitials: value.operatorInitials,
    };
  }

  const reward: Reward | null = row.reward
    ? {
        type: row.reward.type,
        issuedAt: row.reward.issuedAt,
        redeemedAt: row.reward.redeemedAt,
        redeemedBy: row.reward.redeemedBy,
      }
    : null;

  return {
    id: row.id,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    state: row.state,
    code: row.code,
    consentVersion: row.consent_version,
    foamDone: row.foam_done,
    preferences: row.shape_id
      ? {
          shapeId: row.shape_id,
          colorId: row.color_id ?? '',
          scentId: row.scent_id ?? '',
          purchaseIntent: row.purchase_intent,
          giftIntent: row.gift_intent,
          submittedAt: row.completed_at,
        }
      : null,
    games,
    reward,
    isSeed: false,
  };
}

export function mapCloudCatalog(row: CloudCatalogRow): CatalogItem {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    notes: row.notes,
    status: row.status,
    sortOrder: row.sort_order,
    swatch: row.swatch ?? undefined,
    swatchDark: row.swatch_dark ?? undefined,
    createdAt: row.created_at,
  };
}

function mapStaff(value: {
  role: 'operator' | 'admin';
  displayName: string;
  initials: string;
}): StaffSession {
  return {
    role: value.role,
    initials: value.initials,
    loggedAt: new Date().toISOString(),
  };
}

export async function ensureVisitorAuth() {
  const auth = client().auth;
  const { data: current } = await auth.getSession();
  if (current.session) return current.session;

  const { data, error } = await auth.signInAnonymously();
  if (error) throw error;
  return data.session;
}

async function resetAnonymousAuth() {
  const auth = client().auth;
  await auth.signOut();
  const { data, error } = await auth.signInAnonymously();
  if (error) throw error;
  return data.session;
}

export function isStaleAuthError(error: unknown): boolean {
  const candidate = error as { code?: string; message?: string; status?: number } | null;
  const message = candidate?.message ?? '';
  return (
    (candidate?.code === '23503' && message.includes('sessions_user_id_fkey')) ||
    message.includes('not_authenticated') ||
    (candidate?.status === 401 && message.includes('JWT'))
  );
}

async function withVisitorAuthRetry<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isStaleAuthError(error)) throw error;
    await resetAnonymousAuth();
    return operation();
  }
}

async function requireSession() {
  const { data } = await client().auth.getSession();
  if (!data.session) throw new Error('not_authenticated');
  return data.session;
}

export async function cloudFetchCatalog(): Promise<CatalogItem[]> {
  await ensureVisitorAuth();
  const { data, error } = await client()
    .from('catalog_items')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data as CloudCatalogRow[]).map(mapCloudCatalog);
}

export async function cloudSetCatalogStatus(
  itemId: string,
  status: CatalogItem['status'],
): Promise<CatalogItem> {
  await requireSession();
  const { data, error } = await client()
    .from('catalog_items')
    .update({ status })
    .eq('id', itemId)
    .select('*')
    .single();
  if (error) throw error;
  return mapCloudCatalog(data as CloudCatalogRow);
}

export async function cloudStartSession(session: Session): Promise<void> {
  await withVisitorAuthRetry(async () => {
    await ensureVisitorAuth();
    const { error } = await client().rpc('start_session', {
      p_id: session.id,
      p_consent_version: session.consentVersion,
      p_started_at: session.startedAt,
    });
    if (error) throw error;
  });
}

export async function cloudCompleteSession(session: Session): Promise<Session> {
  if (!session.preferences) throw new Error('incomplete_session');
  return withVisitorAuthRetry(async () => {
    await ensureVisitorAuth();
    const preferences = session.preferences!;
    const { data, error } = await client().rpc('complete_session', {
      p_id: session.id,
      p_consent_version: session.consentVersion,
      p_started_at: session.startedAt,
      p_foam_done: session.foamDone,
      p_shape_id: preferences.shapeId,
      p_color_id: preferences.colorId,
      p_scent_id: preferences.scentId,
      p_purchase_intent: preferences.purchaseIntent,
      p_gift_intent: preferences.giftIntent,
    });
    if (error) throw error;
    const row = firstRow(data as CloudSessionRow | CloudSessionRow[] | null);
    if (!row) throw new Error('empty_session_response');
    return mapCloudSession(row);
  });
}

export async function cloudFetchSession(sessionId: string): Promise<Session | null> {
  await ensureVisitorAuth();
  const { data, error } = await client()
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapCloudSession(data as CloudSessionRow) : null;
}

export async function cloudFindSessionByCode(rawCode: string): Promise<Session | null> {
  await requireSession();
  const code = normalizeCode(rawCode);
  if (!code) return null;
  const { data, error } = await client()
    .from('sessions')
    .select('*')
    .eq('code', code)
    .maybeSingle();
  if (error) throw error;
  return data ? mapCloudSession(data as CloudSessionRow) : null;
}

export async function cloudFetchAllSessions(): Promise<Session[]> {
  await requireSession();
  const { data, error } = await client()
    .from('sessions')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data as CloudSessionRow[]).map(mapCloudSession);
}

export async function cloudValidateGame(
  code: string,
  gameType: GameType,
  result: 'WIN' | 'LOSE',
): Promise<{ session: Session; rewardLocked: boolean }> {
  await requireSession();
  const { data, error } = await client().rpc('validate_game', {
    p_code: normalizeCode(code),
    p_game_type: gameType,
    p_result: result,
  });
  if (error) throw error;
  const payload = data as { session: CloudSessionRow; rewardLocked: boolean };
  return {
    session: mapCloudSession(payload.session),
    rewardLocked: Boolean(payload.rewardLocked),
  };
}

export async function cloudRedeemReward(
  code: string,
): Promise<{ session: Session; alreadyRedeemed: boolean }> {
  await requireSession();
  const { data, error } = await client().rpc('redeem_reward', {
    p_code: normalizeCode(code),
  });
  if (error) throw error;
  const payload = data as { session: CloudSessionRow; alreadyRedeemed: boolean };
  return {
    session: mapCloudSession(payload.session),
    alreadyRedeemed: Boolean(payload.alreadyRedeemed),
  };
}

export async function cloudGetMyStaff(): Promise<StaffSession | null> {
  const { data: auth } = await client().auth.getSession();
  if (!auth.session) return null;

  const { data, error } = await client().rpc('get_my_staff');
  if (error) throw error;
  const row = firstRow(
    data as { role: 'operator' | 'admin'; displayName: string; initials: string } | null,
  );
  return row ? mapStaff(row) : null;
}

export async function cloudSignInStaff(
  email: string,
  password: string,
): Promise<StaffSession> {
  const auth = client().auth;
  const { error } = await auth.signInWithPassword({ email, password });
  if (error) throw error;

  const staff = await cloudGetMyStaff();
  if (!staff) {
    await auth.signOut();
    throw new Error('staff_role_missing');
  }
  return staff;
}

export async function cloudSignOut(): Promise<void> {
  await client().auth.signOut();
}

export function cloudErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Error de conexión con el servidor';
}
