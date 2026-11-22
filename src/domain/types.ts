export type ItemType = 'shape' | 'color' | 'scent';
export type ItemStatus = 'available' | 'proposed' | 'inactive';

export interface CatalogItem {
  id: string;
  type: ItemType;
  name: string;
  notes: string;
  status: ItemStatus;
  sortOrder: number;
  swatch?: string;
  swatchDark?: string;
  createdAt: string;
}

export interface Preferences {
  shapeId: string;
  colorId: string;
  scentId: string;
  purchaseIntent: boolean;
  giftIntent: boolean;
  submittedAt: string | null;
}

export type GameType = 'bacteria' | 'aroma';
export type GameResultValue = 'WIN' | 'LOSE';

export interface GameResult {
  gameType: GameType;
  result: GameResultValue;
  validatedAt: string;
  operatorInitials: string;
}

export type RewardType = 'greeting' | 'photo' | 'photo_dance';

export interface Reward {
  type: RewardType;
  issuedAt: string;
  redeemedAt: string | null;
  redeemedBy: string | null;
}

export type SessionState = 'started' | 'completed';

export interface Session {
  id: string;
  startedAt: string;
  completedAt: string | null;
  state: SessionState;
  code: string | null;
  consentVersion: string;
  foamDone: boolean;
  preferences: Preferences | null;
  games: Partial<Record<GameType, GameResult>>;
  reward: Reward | null;
  isSeed: boolean;
}

export interface AppData {
  version: 1;
  sessions: Session[];
  catalogOverrides: Record<string, ItemStatus>;
  seededAt: string | null;
}

export type StaffRole = 'operator' | 'admin';

export interface StaffSession {
  role: StaffRole;
  initials: string;
  loggedAt: string;
}
