import { CODE_ALPHABET, CODE_PREFIX } from './constants';

export function normalizeCode(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z2-9]/g, '');
  const body = cleaned.startsWith('FX') ? cleaned.slice(2) : cleaned;
  if (body.length === 6) return `${CODE_PREFIX}${body}`;
  return cleaned;
}

export function isValidCode(code: string): boolean {
  return /^FX-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(code);
}

export function generateCode(existing: Iterable<string>, rng: () => number = Math.random): string {
  const taken = new Set(existing);
  for (let attempt = 0; attempt < 100; attempt += 1) {
    let body = '';
    for (let i = 0; i < 6; i += 1) {
      body += CODE_ALPHABET[Math.floor(rng() * CODE_ALPHABET.length)];
    }
    const code = `${CODE_PREFIX}${body}`;
    if (!taken.has(code)) return code;
  }
  throw new Error('No se pudo generar un código único');
}
