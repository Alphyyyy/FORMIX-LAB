import { generateCode, isValidCode, normalizeCode } from './code';

test('normalizes codes with or without prefix and stray characters', () => {
  expect(normalizeCode(' fx-abc234 ')).toBe('FX-ABC234');
  expect(normalizeCode('abc234')).toBe('FX-ABC234');
  expect(normalizeCode('fx ab-c2 34')).toBe('FX-ABC234');
});

test('validates format and alphabet', () => {
  expect(isValidCode('FX-ABC234')).toBe(true);
  expect(isValidCode('FX-ABC23I')).toBe(false);
  expect(isValidCode('FX-ABC01O')).toBe(false);
  expect(isValidCode('ABC234')).toBe(false);
});

test('generates six unambiguous characters and avoids collisions', () => {
  const code = generateCode([]);
  expect(code).toMatch(/^FX-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  expect(code).not.toMatch(/[IO01]/);

  const values = [0, 0, 0, 0, 0, 0, 1 / 32, 1 / 32, 1 / 32, 1 / 32, 1 / 32, 1 / 32];
  let i = 0;
  const rng = () => values[i++] ?? 0;
  expect(generateCode(['FX-AAAAAA'], rng)).toBe('FX-BBBBBB');
});
