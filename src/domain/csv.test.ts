import { BASE_CATALOG } from '../data/catalog';
import { prefs, completedSession } from '../test/fixtures';
import type { GameResult, GameType } from './types';
import {
  csvEscape,
  csvFilename,
  gamesCsv,
  preferencesCsv,
  rewardsCsv,
  sessionsCsv,
  toCsv,
} from './csv';

function game(type: GameType, result: 'WIN' | 'LOSE'): GameResult {
  return { gameType: type, result, validatedAt: '2026-11-22T12:30:00.000Z', operatorInitials: 'AM' };
}

const seed = completedSession({
  id: 'seed-1',
  isSeed: true,
  code: 'FX-SEED22',
  games: { bacteria: game('bacteria', 'WIN') },
  reward: {
    type: 'greeting',
    issuedAt: '2026-11-22T12:31:00.000Z',
    redeemedAt: null,
    redeemedBy: null,
  },
});
const real = completedSession({
  id: 'real-1',
  code: 'FX-R3ALM2',
  preferences: prefs({ shapeId: 'shape-corazon', colorId: 'color-malva', scentId: 'scent-vainilla' }),
  games: { bacteria: game('bacteria', 'LOSE'), aroma: game('aroma', 'WIN') },
  reward: {
    type: 'photo',
    issuedAt: '2026-11-22T12:33:00.000Z',
    redeemedAt: '2026-11-22T12:40:00.000Z',
    redeemedBy: 'JP',
  },
});
const allSessions = [seed, real];

test('escapes RFC 4180 fields and prefixes a BOM', () => {
  expect(csvEscape('a,b')).toBe('"a,b"');
  expect(csvEscape('q"z')).toBe('"q""z"');
  expect(csvEscape('line\nbreak')).toBe('"line\nbreak"');
  expect(csvEscape(null)).toBe('');
  expect(toCsv(['a', 'b'], [['x,y', 'q"z']])).toBe('\uFEFFa,b\r\n"x,y","q""z"');
});

test('sessions export has the exact headers and separates demo from real', () => {
  const realCsv = sessionsCsv(allSessions, BASE_CATALOG, false);
  const realHeader = realCsv.split('\r\n')[0];
  expect(realHeader).toBe(
    '\uFEFFcodigo,iniciada_en,completada_en,estado,molde,color,aroma,intencion_compra,intencion_regalo,juegos_validados,premio,premio_canjeado_en',
  );
  expect(realCsv).not.toContain('FX-SEED22');

  const demoCsv = sessionsCsv(allSessions, BASE_CATALOG, true);
  const demoHeader = demoCsv.split('\r\n')[0];
  expect(demoHeader.endsWith(',origen')).toBe(true);
  const rows = demoCsv.split('\r\n');
  expect(rows.some((row) => row.startsWith('FX-SEED22') && row.endsWith(',demo'))).toBe(true);
  expect(rows.some((row) => row.startsWith('FX-R3ALM2') && row.endsWith(',real'))).toBe(true);
});

test('preferences export resolves ids and names', () => {
  const csv = preferencesCsv(allSessions, BASE_CATALOG, true);
  expect(csv.split('\r\n')[0]).toBe(
    '\uFEFFcodigo,molde_id,molde,color_id,color,aroma_id,aroma,intencion_compra,intencion_regalo,enviada_en',
  );
  expect(csv).toContain('FX-R3ALM2,shape-corazon,Corazón,color-malva,Malva,scent-vainilla,Vainilla');
});

test('games export uses GANO/NO_GANO and operator initials', () => {
  const csv = gamesCsv(allSessions, true);
  expect(csv.split('\r\n')[0]).toBe('\uFEFFcodigo,juego,resultado,validado_en,operador');
  expect(csv).toContain('FX-R3ALM2,bacteria,NO_GANO,2026-11-22T12:30:00.000Z,AM');
  expect(csv).toContain('FX-R3ALM2,aroma,GANO,2026-11-22T12:30:00.000Z,AM');
});

test('rewards export includes redemption fields and labels', () => {
  const csv = rewardsCsv(allSessions, true);
  expect(csv.split('\r\n')[0]).toBe('\uFEFFcodigo,premio,emitido_en,canjeado_en,canjeado_por');
  expect(csv).toContain('FX-R3ALM2,Foto con la mascota,2026-11-22T12:33:00.000Z,2026-11-22T12:40:00.000Z,JP');
});

test('filename includes the local date and demo suffix', () => {
  const now = new Date('2026-11-22T18:00:00.000Z');
  expect(csvFilename('sesiones', false, now)).toBe('formix-sesiones-2026-11-22.csv');
  expect(csvFilename('sesiones', true, now)).toBe('formix-sesiones-2026-11-22-demo.csv');
  expect(csvFilename('premios', false, now)).toBe('formix-premios-2026-11-22.csv');
});
