import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

function readStyle(name: string): string {
  return readFileSync(fileURLToPath(new URL(name, import.meta.url)), 'utf8');
}

const tokens = readStyle('./tokens.css');
const app = readStyle('./app.css');
const visitor = readStyle('./visitor.css');
const staff = readStyle('./staff.css');

function token(name: string): string {
  const match = tokens.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`Missing token --${name}`);
  return match[1];
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

function blend(foreground: string, background: string, alpha: number): string {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  return `#${fg
    .map((channel, index) => Math.round(channel * alpha + bg[index] * (1 - alpha)))
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`;
}

function cssRule(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  return match?.[1] ?? '';
}

function minHeight(css: string, selector: string): number {
  const body = cssRule(css, selector);
  const min = body.match(/min-height:\s*(\d+)px/);
  if (min) return Number(min[1]);
  const height = body.match(/(?:^|;)\s*height:\s*(\d+)px/);
  return height ? Number(height[1]) : 0;
}

test('amber status text meets WCAG AA on its tint', () => {
  expect(contrast(token('amber'), token('amber-soft'))).toBeGreaterThanOrEqual(4.5);
});

test('success status text meets WCAG AA on its tint', () => {
  const tint = blend(token('sage'), token('surface'), 0.16);
  expect(contrast(token('success'), tint)).toBeGreaterThanOrEqual(4.5);
});

test.each([
  ['link-button', visitor, '.link-button'],
  ['footer link', visitor, '.visitor-footer a'],
  ['intent check chip', visitor, '.check-chip'],
  ['role segmented button', staff, '.segmented button'],
  ['demo toggle', staff, '.demo-toggle'],
  ['operator result button', staff, '.operator-game__actions .btn'],
  ['catalog status select', staff, '.catalog-select select'],
  ['share action button', staff, '.share-actions .btn'],
  ['export action button', staff, '.export-grid .btn'],
  ['icon button', app, '.icon-button'],
])('interactive target %s is at least 44px tall', (_name, css, selector) => {
  expect(minHeight(css, selector)).toBeGreaterThanOrEqual(44);
});
