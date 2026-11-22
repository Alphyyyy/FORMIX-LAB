import type { GameResult, GameType, RewardType, Session } from './types';

const RANK: Record<RewardType, number> = {
  greeting: 1,
  photo: 2,
  photo_dance: 3,
};

export function rewardFor(games: Partial<Record<GameType, GameResult>>): RewardType | null {
  const results = Object.values(games).filter(Boolean) as GameResult[];
  if (results.length === 0) return null;
  const wins = results.filter((game) => game.result === 'WIN').length;
  if (wins >= 2) return 'photo_dance';
  if (wins === 1) return 'photo';
  return 'greeting';
}

export function rewardRank(type: RewardType): number {
  return RANK[type];
}

export function rewardLabel(type: RewardType): string {
  const labels: Record<RewardType, string> = {
    greeting: 'Saludo de la mascota',
    photo: 'Foto con la mascota',
    photo_dance: 'Baile + foto con la mascota',
  };
  return labels[type];
}

export function rewardDescription(type: RewardType): string {
  const descriptions: Record<RewardType, string> = {
    greeting: 'Un saludo de Burbuja para cerrar la experiencia.',
    photo: 'Una foto con la mascota del puesto.',
    photo_dance: 'Baile breve de 10–15 segundos y foto con la mascota.',
  };
  return descriptions[type];
}

export function canRedeem(session: Session): boolean {
  return Boolean(session.reward && !session.reward.redeemedAt);
}
