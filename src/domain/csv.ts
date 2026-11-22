import { itemName } from './catalog';
import { rewardLabel } from './rewards';
import type { CatalogItem, Session } from './types';

export type CsvKind = 'sesiones' | 'preferencias' | 'juegos' | 'premios';

export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(csvEscape).join(','));
  return `\uFEFF${lines.join('\r\n')}`;
}

function included(sessions: Session[], includeDemo: boolean): Session[] {
  return sessions.filter((session) => session.code && (includeDemo || !session.isSeed));
}

function yesNo(value: boolean | undefined): string {
  return value ? 'si' : 'no';
}

function stateLabel(session: Session): string {
  return session.state === 'completed' ? 'completada' : 'iniciada';
}

function rewardRedemption(session: Session): string {
  return session.reward?.redeemedAt ?? '';
}

export function sessionsCsv(
  sessions: Session[],
  catalog: CatalogItem[],
  includeDemo: boolean,
): string {
  const headers = [
    'codigo',
    'iniciada_en',
    'completada_en',
    'estado',
    'molde',
    'color',
    'aroma',
    'intencion_compra',
    'intencion_regalo',
    'juegos_validados',
    'premio',
    'premio_canjeado_en',
  ];
  if (includeDemo) headers.push('origen');

  const rows = included(sessions, includeDemo).map((session) => {
    const preferences = session.preferences;
    const row: unknown[] = [
      session.code,
      session.startedAt,
      session.completedAt ?? '',
      stateLabel(session),
      itemName(catalog, preferences?.shapeId),
      itemName(catalog, preferences?.colorId),
      itemName(catalog, preferences?.scentId),
      yesNo(preferences?.purchaseIntent),
      yesNo(preferences?.giftIntent),
      Object.keys(session.games).length,
      session.reward ? rewardLabel(session.reward.type) : '',
      rewardRedemption(session),
    ];
    if (includeDemo) row.push(session.isSeed ? 'demo' : 'real');
    return row;
  });
  return toCsv(headers, rows);
}

export function preferencesCsv(
  sessions: Session[],
  catalog: CatalogItem[],
  includeDemo: boolean,
): string {
  const headers = [
    'codigo',
    'molde_id',
    'molde',
    'color_id',
    'color',
    'aroma_id',
    'aroma',
    'intencion_compra',
    'intencion_regalo',
    'enviada_en',
  ];
  const rows = included(sessions, includeDemo)
    .filter((session) => session.preferences)
    .map((session) => {
      const preferences = session.preferences!;
      return [
        session.code,
        preferences.shapeId,
        itemName(catalog, preferences.shapeId),
        preferences.colorId,
        itemName(catalog, preferences.colorId),
        preferences.scentId,
        itemName(catalog, preferences.scentId),
        yesNo(preferences.purchaseIntent),
        yesNo(preferences.giftIntent),
        preferences.submittedAt ?? '',
      ];
    });
  return toCsv(headers, rows);
}

export function gamesCsv(sessions: Session[], includeDemo: boolean): string {
  const headers = ['codigo', 'juego', 'resultado', 'validado_en', 'operador'];
  const rows: unknown[][] = [];
  for (const session of included(sessions, includeDemo)) {
    for (const game of Object.values(session.games)) {
      if (!game) continue;
      rows.push([
        session.code,
        game.gameType,
        game.result === 'WIN' ? 'GANO' : 'NO_GANO',
        game.validatedAt,
        game.operatorInitials,
      ]);
    }
  }
  return toCsv(headers, rows);
}

export function rewardsCsv(sessions: Session[], includeDemo: boolean): string {
  const headers = ['codigo', 'premio', 'emitido_en', 'canjeado_en', 'canjeado_por'];
  const rows = included(sessions, includeDemo)
    .filter((session) => session.reward)
    .map((session) => [
      session.code,
      rewardLabel(session.reward!.type),
      session.reward!.issuedAt,
      session.reward!.redeemedAt ?? '',
      session.reward!.redeemedBy ?? '',
    ]);
  return toCsv(headers, rows);
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function csvFilename(kind: CsvKind, includeDemo: boolean, now: Date = new Date()): string {
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `formix-${kind}-${date}${includeDemo ? '-demo' : ''}.csv`;
}
