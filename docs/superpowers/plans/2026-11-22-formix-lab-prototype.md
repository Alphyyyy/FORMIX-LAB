# FORMIX LAB Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first, local-first web prototype of FORMIX LAB that runs the full visitor flow, operator validation, admin dashboard, and CSV exports with a refined "editorial lab" visual direction.

**Architecture:** Static React SPA with hash routing. Pure domain modules (catalog, codes, rewards, metrics, CSV, flow) sit above a repository that persists an `AppData` document to `localStorage`. Visitor and staff routes share one provider; no backend, no cross-device sync. Demo data is seeded on first load and flagged separately from real sessions.

**Tech Stack:** React 19, TypeScript 7, Vite 8, Vitest 5, Testing Library, `qrcode.react`, Fontsource Fraunces + Manrope.

**Spec:** `docs/superpowers/specs/2026-11-22-formix-lab-prototype-design.md`

## Global Constraints

- All user-facing copy is in Spanish. Dates in CSV are ISO; dates in UI are local and human-readable.
- Mobile-first. Interactive targets are at least 44×44 px. Text and controls meet WCAG AA. Every drag interaction has a tap and keyboard alternative.
- Respect `prefers-reduced-motion`: no floating bubbles, parallax, or long transitions.
- No personal data fields. The only optional signals are `purchaseIntent` and `giftIntent`.
- Data lives in `localStorage`; the panel and operator only work in the same browser. Never claim cross-device sync or server security.
- Public code format: `FX-` plus exactly six characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no I, O, 0, 1). Codes are unique and non-sequential.
- Demo staff PINs: operator `2468`, admin `1357`. They are a demo gate, not security.
- Status labels: `available` → “Disponible”, `proposed` → “Concepto”, `inactive` → “Inactivo”. Only `inactive` is hidden from visitors.
- Reward ladder: no games validated → no reward; at least one game validated with zero wins → `greeting`; one win → `photo`; two wins → `photo_dance`. Rewards upgrade in place until redeemed, then lock.
- Seed sessions have `isSeed: true`. Real exports exclude them; demo exports add an `origen` column and a `-demo` filename suffix.
- CSV is UTF-8 with BOM, CRLF line endings, and RFC 4180 escaping.
- No external photos, commercial audio, or runtime font CDNs. Visuals are SVG/CSS; audio is synthesized with Web Audio.
- No service worker. First load requires network; after that the app works from local data.
- Commit after every task. Do not combine task commits.

## Review Focus

1. **Reload or deep link mid-flow** — the app must resume the furthest valid step and never lose saved choices. Tested in Tasks 10 and 11.
2. **Catalog item deactivated mid-session or after completion** — it disappears from new selections, but historical sessions still resolve its name. Tested in Tasks 2, 10, and 22.
3. **Second challenge validated after the reward was redeemed** — the result is recorded but the reward is neither duplicated nor upgraded; the operator sees a clear notice. Tested in Tasks 6 and 20.
4. **CSV export with mixed demo and real sessions** — real files exclude seeds, demo files include `origen`, and escaping is correct. Tested in Task 9.
5. **Rapid double click / double redemption** — only one operation succeeds; the second gets a clear rejection. Tested in Tasks 6 and 20.

---

### Task 1: Scaffold the app, tooling, and smoke test

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`, `public/favicon.svg`
- Create: `src/main.tsx`, `src/App.tsx`, `src/App.test.tsx`, `src/test/setup.ts`, `src/styles/base.css`

**Interfaces:**
- Produces: a runnable Vite app with `npm run dev`, `npm test`, and `npm run build`; `src/App.tsx` default export renders a placeholder brand.

- [ ] **Step 1: Create the project files**

`package.json`:

```json
{
  "name": "formix-lab",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@fontsource-variable/fraunces": "^5.3.0",
    "@fontsource-variable/manrope": "^5.3.0",
    "qrcode.react": "^4.2.0",
    "react": "^19.3.1",
    "react-dom": "^19.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^8.0.0",
    "@testing-library/react": "^16.3.3",
    "@testing-library/user-event": "^14.6.13",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "@vitejs/plugin-react": "^6.3.0",
    "jsdom": "^31.0.1",
    "typescript": "^7.0.2",
    "vite": "^8.3.8",
    "vitest": "^5.1.1"
  }
}
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "types": ["vite/client", "vitest/globals"]
  },
  "include": ["src", "vite.config.ts"]
}
```

`vite.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: false,
  },
});
```

`index.html` includes `lang="es"`, the viewport meta with `viewport-fit=cover`, `theme-color` `#FBF7F2`, the favicon, and `<div id="root"></div>` plus `<script type="module" src="/src/main.tsx"></script>`.

`.gitignore` contains `node_modules`, `dist`, `.vite`, `coverage`, and `*.local`.

`src/main.tsx` imports the Fontsource CSS, `./styles/base.css`, and renders `<App />` inside `React.StrictMode`.

`src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.location.hash = '';
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
```

`src/App.tsx` initially renders `<main><h1>FORMIX LAB</h1></main>`.
`src/styles/base.css` contains a minimal reset, `body { margin: 0; font-family: system-ui, sans-serif; }`, and `#root { min-height: 100vh; }`.
`public/favicon.svg` is a simple cream rounded square with a pink `F` or soap silhouette.

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: `node_modules` created and `package-lock.json` generated.

- [ ] **Step 3: Write the failing smoke test**

`src/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the FORMIX LAB brand', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /formix lab/i })).toBeInTheDocument();
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npm test -- src/App.test.tsx`
Expected: FAIL because the placeholder heading is not yet present in the exact accessible form required (or because `App` is not yet imported correctly).

- [ ] **Step 5: Implement the minimal App**

Render `<main><h1>FORMIX LAB</h1></main>`. Keep `App` as the provider-ready shell; later tasks will replace its body.

- [ ] **Step 6: Verify test and build**

Run: `npm test -- src/App.test.tsx`
Expected: PASS.
Run: `npm run build`
Expected: build completes with `dist/`.

- [ ] **Step 7: Initialize git and commit**

```bash
git init
git add .
git commit -m "chore: scaffold FORMIX LAB prototype"
```

---

### Task 2: Domain types, constants, and catalog

**Files:**
- Create: `src/domain/types.ts`, `src/domain/constants.ts`, `src/data/catalog.ts`, `src/domain/catalog.ts`
- Test: `src/domain/catalog.test.ts`

**Interfaces:**
- Produces: all shared types; `BASE_CATALOG`; `applyCatalogOverrides(base, overrides): CatalogItem[]`; `visibleItems(catalog, type): CatalogItem[]`; `itemById(catalog, id): CatalogItem | undefined`; `itemName(catalog, id): string`; `isVisible(catalog, id): boolean`.

- [ ] **Step 1: Write the failing catalog tests**

`src/domain/catalog.test.ts` asserts:

```ts
import { BASE_CATALOG } from '../data/catalog';
import { applyCatalogOverrides, visibleItems, itemName, isVisible } from './catalog';

test('base catalog has 8 shapes, 6 colors and 6 scents with unique ids', () => {
  expect(BASE_CATALOG.filter((i) => i.type === 'shape')).toHaveLength(8);
  expect(BASE_CATALOG.filter((i) => i.type === 'color')).toHaveLength(6);
  expect(BASE_CATALOG.filter((i) => i.type === 'scent')).toHaveLength(6);
  expect(new Set(BASE_CATALOG.map((i) => i.id)).size).toBe(20);
});

test('overrides change status without mutating the base', () => {
  const original = BASE_CATALOG[0].status;
  const next = applyCatalogOverrides(BASE_CATALOG, { [BASE_CATALOG[0].id]: 'inactive' });
  expect(next[0].status).toBe('inactive');
  expect(BASE_CATALOG[0].status).toBe(original);
});

test('visibleItems excludes inactive items, keeps proposed, and sorts by sortOrder', () => {
  const catalog = applyCatalogOverrides(BASE_CATALOG, { 'shape-corazon': 'inactive' });
  const shapes = visibleItems(catalog, 'shape');
  expect(shapes.some((i) => i.id === 'shape-corazon')).toBe(false);
  expect(shapes.some((i) => i.status === 'proposed')).toBe(true);
  expect(shapes.map((i) => i.sortOrder)).toEqual([...shapes.map((i) => i.sortOrder)].sort((a, b) => a - b));
});

test('itemName resolves inactive historical items and falls back to an em dash', () => {
  expect(itemName(BASE_CATALOG, 'shape-patita')).toBe('Patita');
  expect(itemName(BASE_CATALOG, 'missing')).toBe('—');
  const catalog = applyCatalogOverrides(BASE_CATALOG, { 'shape-patita': 'inactive' });
  expect(itemName(catalog, 'shape-patita')).toBe('Patita');
  expect(isVisible(catalog, 'shape-patita')).toBe(false);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/domain/catalog.test.ts`
Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement types and constants**

`src/domain/types.ts` defines:

```ts
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
```

`src/domain/constants.ts` defines `CONSENT_VERSION = '2026-11-demo-v1'`, `CODE_PREFIX = 'FX-'`, `CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'`, `OPERATOR_PIN = '2468'`, `ADMIN_PIN = '1357'`, `DEFAULT_OPERATOR = 'Operador'`, `MAX_INITIALS = 12`.

- [ ] **Step 4: Implement the base catalog**

`src/data/catalog.ts` exports `BASE_CATALOG: CatalogItem[]` with `createdAt: '2026-11-18T00:00:00.000Z'`.

Shapes, in order: `shape-patita` “Patita” available; `shape-corazon` “Corazón” available; `shape-esfera` “Esfera” available; `shape-rosa` “Rosa” proposed; `shape-osito` “Osito” proposed; `shape-estrella` “Estrella” proposed; `shape-luna` “Luna” proposed; `shape-concha` “Concha” proposed. Notes are short sensory descriptions.

Colors: `color-rosa` “Rosa” `#E890A8`/`#C96B85` available; `color-malva` “Malva” `#B792D6`/`#8F6BB0` available; `color-azul` “Azul” `#8FB8D9`/`#5F8FB5` available; `color-verde` “Verde” `#9DC3A6`/`#6E9A7A` proposed; `color-naranja` “Naranja” `#F0B07A`/`#C9844E` proposed; `color-marfil` “Marfil” `#F3E9DA`/`#D6C4A8` proposed.

Scents: `scent-fresa` “Fresa” “Frutal · dulce” available; `scent-chocolate` “Chocolate” “Gourmand · cálido” available; `scent-vainilla` “Vainilla” “Dulce · cremoso” available; `scent-coco` “Coco” “Tropical · suave” proposed; `scent-lavanda` “Lavanda” “Floral · herbal” proposed; `scent-naranja` “Naranja” “Cítrico · luminoso” proposed.

- [ ] **Step 5: Implement catalog helpers**

`applyCatalogOverrides` returns a new array with overrides applied by `id`. `visibleItems` filters `status !== 'inactive'`, then sorts by `sortOrder` then `name`. `itemById` finds by id. `itemName` returns the name or `'—'`. `isVisible` returns true only when the item exists and is not inactive.

- [ ] **Step 6: Run tests and commit**

Run: `npm test -- src/domain/catalog.test.ts`
Expected: PASS.
```bash
git add src/domain src/data
git commit -m "feat: add domain types and demo catalog"
```

---

### Task 3: Public participation codes

**Files:**
- Create: `src/domain/code.ts`
- Test: `src/domain/code.test.ts`

**Interfaces:**
- Produces: `normalizeCode(raw): string`; `isValidCode(code): boolean`; `generateCode(existing: Iterable<string>, rng?: () => number): string`.

- [ ] **Step 1: Write the failing tests**

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/domain/code.test.ts`
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the module**

`normalizeCode` uppercases the input, removes every character outside `A–Z` and `2–9`, strips a leading `FX`, and then, when the remaining body is exactly six characters, returns `FX-` plus that body. If the cleaned value is already `FX` plus six valid characters, return it. Otherwise return the cleaned value so `isValidCode` can reject it. This makes `fx ab-c2 34` become `FX-ABC234` and leaves invalid input invalid.

`isValidCode` checks exactly `/^FX-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/`.

`generateCode` builds `CODE_PREFIX` + six picks from `CODE_ALPHABET` using `Math.floor(rng() * CODE_ALPHABET.length)`, retries up to 100 times while the code is in `existing`, and throws `Error('No se pudo generar un código único')` after that.

- [ ] **Step 4: Run tests and commit**

Run: `npm test -- src/domain/code.test.ts`
Expected: PASS.
```bash
git add src/domain/code.ts src/domain/code.test.ts
git commit -m "feat: add unambiguous participation codes"
```

---

### Task 4: Reward ladder rules

**Files:**
- Create: `src/domain/rewards.ts`
- Test: `src/domain/rewards.test.ts`

**Interfaces:**
- Produces: `rewardFor(games): RewardType | null`; `rewardLabel(type): string`; `rewardDescription(type): string`; `canRedeem(session): boolean`.

- [ ] **Step 1: Write the failing tests**

```ts
import { canRedeem, rewardFor, rewardLabel } from './rewards';
import type { GameResult, Session } from './types';

function game(gameType: 'bacteria' | 'aroma', result: 'WIN' | 'LOSE'): GameResult {
  return { gameType, result, validatedAt: '2026-11-22T12:00:00.000Z', operatorInitials: 'AM' };
}

test('maps validated games to the ladder', () => {
  expect(rewardFor({})).toBeNull();
  expect(rewardFor({ bacteria: game('bacteria', 'LOSE') })).toBe('greeting');
  expect(rewardFor({ bacteria: game('bacteria', 'WIN') })).toBe('photo');
  expect(rewardFor({ bacteria: game('bacteria', 'WIN'), aroma: game('aroma', 'LOSE') })).toBe('photo');
  expect(rewardFor({ bacteria: game('bacteria', 'WIN'), aroma: game('aroma', 'WIN') })).toBe('photo_dance');
  expect(rewardFor({ bacteria: game('bacteria', 'LOSE'), aroma: game('aroma', 'LOSE') })).toBe('greeting');
});

test('labels and descriptions are the approved copy', () => {
  expect(rewardLabel('greeting')).toBe('Saludo de la mascota');
  expect(rewardLabel('photo')).toBe('Foto con la mascota');
  expect(rewardLabel('photo_dance')).toBe('Baile + foto con la mascota');
});

test('canRedeem requires an issued, unredeemed reward', () => {
  const base = { reward: null } as unknown as Session;
  expect(canRedeem(base)).toBe(false);
  expect(canRedeem({ ...base, reward: { type: 'photo', issuedAt: 'x', redeemedAt: null, redeemedBy: null } })).toBe(true);
  expect(canRedeem({ ...base, reward: { type: 'photo', issuedAt: 'x', redeemedAt: 'y', redeemedBy: 'AM' } })).toBe(false);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/domain/rewards.test.ts`
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the module**

`rewardFor` counts `WIN` results and total validated games. Zero games → `null`; zero wins → `greeting`; one win → `photo`; two wins → `photo_dance`. Labels and descriptions are exact Spanish copy. `canRedeem` returns `Boolean(session.reward && !session.reward.redeemedAt)`.

- [ ] **Step 4: Run tests and commit**

Run: `npm test -- src/domain/rewards.test.ts`
Expected: PASS.
```bash
git add src/domain/rewards.ts src/domain/rewards.test.ts
git commit -m "feat: add reward ladder rules"
```

---

### Task 5: Session lifecycle repository and test fixtures

**Files:**
- Create: `src/state/repository.ts`, `src/test/fixtures.ts`
- Test: `src/state/repository.test.ts`

**Interfaces:**
- Produces: `RepoError`, `RepoResult<T>`, `createEmptyData(): AppData`, `startSession(data, now?): RepoResult<Session>`, `markFoamDone(data, id): AppData`, `updatePreferences(data, id, patch): RepoResult<Session>`, `completeSession(data, id, now?): RepoResult<Session>`, `findSessionByCode(data, raw): Session | undefined`, plus fixtures `makeSession(overrides?)`, `prefs(overrides?)`, `makeData(sessions?)`, `completedSession(overrides?)`.

Use this result shape everywhere:

```ts
export type RepoError =
  | 'not-found'
  | 'completed'
  | 'incomplete'
  | 'not-completed'
  | 'already-validated'
  | 'already-redeemed'
  | 'no-reward';

export type RepoResult<T> =
  | { ok: true; data: AppData; value: T; notice?: 'reward-locked' }
  | { ok: false; error: RepoError };
```

- [ ] **Step 1: Write the failing lifecycle tests**

`src/state/repository.test.ts` covers:

```ts
function startTestSession(now?: Date) {
  const result = startSession(createEmptyData(), now);
  if (!result.ok) throw new Error('start failed');
  return { data: result.data, session: result.value };
}

test('starts an anonymous session with no code or preferences', () => {
  const result = startSession(createEmptyData(), new Date('2026-11-22T10:00:00.000Z'));
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  const session = result.value;
  expect(session.state).toBe('started');
  expect(session.code).toBeNull();
  expect(session.preferences).toBeNull();
  expect(session.games).toEqual({});
  expect(session.isSeed).toBe(false);
  expect(session.consentVersion).toBe(CONSENT_VERSION);
  expect(session.startedAt).toBe('2026-11-22T10:00:00.000Z');
});

test('marks foam done and saves one selection set at a time', () => {
  const { data, session } = startTestSession();
  const withFoam = markFoamDone(data, session.id);
  const result = updatePreferences(withFoam, session.id, { shapeId: 'shape-patita' });
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.value.foamDone).toBe(true);
  expect(result.value.preferences?.shapeId).toBe('shape-patita');
  expect(result.value.state).toBe('started');
});

test('completes only with all three selections and issues a valid unique code', () => {
  const first = startTestSession();
  const missing = completeSession(first.data, first.session.id);
  expect(missing).toEqual({ ok: false, error: 'incomplete' });

  const withPrefs = updatePreferences(first.data, first.session.id, {
    shapeId: 'shape-patita',
    colorId: 'color-rosa',
    scentId: 'scent-fresa',
  });
  if (!withPrefs.ok) throw new Error('setup failed');
  const done = completeSession(withPrefs.data, first.session.id, new Date('2026-11-22T10:04:00.000Z'));
  expect(done.ok).toBe(true);
  if (!done.ok) return;
  expect(done.value.state).toBe('completed');
  expect(done.value.code).toMatch(/^FX-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  expect(done.value.preferences?.submittedAt).toBe('2026-11-22T10:04:00.000Z');
});

test('rejects preference edits after completion and resolves codes with or without prefix', () => {
  const { data, session } = startTestSession();
  const withPrefs = updatePreferences(data, session.id, {
    shapeId: 'shape-patita',
    colorId: 'color-rosa',
    scentId: 'scent-fresa',
  });
  if (!withPrefs.ok) throw new Error('setup failed');
  const done = completeSession(withPrefs.data, session.id);
  if (!done.ok) throw new Error('setup failed');

  expect(updatePreferences(done.data, session.id, { shapeId: 'shape-corazon' })).toEqual({ ok: false, error: 'completed' });
  expect(findSessionByCode(done.data, done.value.code!.slice(3))?.id).toBe(session.id);
  expect(findSessionByCode(done.data, 'FX-NOPE23')).toBeUndefined();
});
```

Also test `markFoamDone` on a completed session leaves it unchanged.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/state/repository.test.ts`
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Create fixtures**

`src/test/fixtures.ts`:

```ts
export function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-1',
    startedAt: '2026-11-22T10:00:00.000Z',
    completedAt: null,
    state: 'started',
    code: null,
    consentVersion: CONSENT_VERSION,
    foamDone: false,
    preferences: null,
    games: {},
    reward: null,
    isSeed: false,
    ...overrides,
  };
}

export function makeData(sessions: Session[] = []): AppData {
  return { version: 1, sessions, catalogOverrides: {}, seededAt: null };
}

export function prefs(overrides: Partial<Preferences> = {}): Preferences {
  return {
    shapeId: 'shape-patita',
    colorId: 'color-rosa',
    scentId: 'scent-fresa',
    purchaseIntent: false,
    giftIntent: false,
    submittedAt: null,
    ...overrides,
  };
}
```

Add a helper `completedSession(overrides?)` that returns a session with `state: 'completed'`, `completedAt: '2026-11-22T10:04:00.000Z'`, `code: 'FX-ABC234'`, `foamDone: true`, and `preferences: prefs({ submittedAt: '2026-11-22T10:04:00.000Z' })`, with `overrides` applied last.

- [ ] **Step 4: Implement the lifecycle functions**

`createEmptyData` returns `{ version: 1, sessions: [], catalogOverrides: {}, seededAt: null }`.

`startSession` creates an id with `crypto.randomUUID()` (fallback to `session-${Date.now()}-${Math.random()}` only if unavailable), `startedAt: now.toISOString()`, `state: 'started'`, `code: null`, `consentVersion: CONSENT_VERSION`, `foamDone: false`, `preferences: null`, `games: {}`, `reward: null`, `isSeed: false`, appends it, and returns `{ ok: true, data, value: session }`.

`markFoamDone` only changes a matching, non-completed session.

`updatePreferences` merges the patch into existing preferences, defaulting `purchaseIntent` and `giftIntent` to false, preserving `submittedAt`. Return `not-found`/`completed` errors as appropriate.

`completeSession` returns `completed` if the session is already completed; otherwise it requires `shapeId`, `colorId`, and `scentId`; otherwise `incomplete`. It generates a code with `generateCode` over existing codes, sets `state: 'completed'`, `completedAt`, and `preferences.submittedAt`.

`findSessionByCode` normalizes input and compares `session.code`.

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- src/state/repository.test.ts`
Expected: PASS.
```bash
git add src/state/repository.ts src/state/repository.test.ts src/test/fixtures.ts
git commit -m "feat: add session lifecycle repository"
```

---

### Task 6: Operator actions, reward upgrades, and redemption lock

**Files:**
- Modify: `src/state/repository.ts`
- Test: `src/state/repository.test.ts`

**Interfaces:**
- Produces: `validateGame(data, rawCode, gameType, result, initials, now?): RepoResult<Session>`; `redeemReward(data, rawCode, initials, now?): RepoResult<Session>`; internal reward mutation using `rewardFor` and `rewardRank`.

- [ ] **Step 1: Add failing tests**

Add tests for:

- unknown code → `{ ok: false, error: 'not-found' }`.
- an incomplete session (no code) cannot be validated → `not-found` (lookup by code fails).
- first `LOSE` issues `greeting`; first `WIN` issues `photo`.
- a second `WIN` upgrades the same reward to `photo_dance`; `issuedAt` does not change.
- duplicate validation of the same game → `already-validated`, game count unchanged.
- validating a second game after redemption → `ok: true`, `notice: 'reward-locked'`, reward type and `redeemedAt` unchanged.
- redeem with no reward → `no-reward`; successful redeem sets `redeemedAt`/`redeemedBy`; second redeem → `already-redeemed`.
- initials are trimmed; blank initials become `Operador`; values longer than 12 characters are sliced.

Use this helper pattern:

```ts
function completedWithCode() {
  const started = startSession(createEmptyData());
  if (!started.ok) throw new Error('start failed');
  const saved = updatePreferences(started.data, started.value.id, {
    shapeId: 'shape-patita',
    colorId: 'color-rosa',
    scentId: 'scent-fresa',
  });
  if (!saved.ok) throw new Error('setup failed');
  const done = completeSession(saved.data, started.value.id);
  if (!done.ok) throw new Error('setup failed');
  return done;
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/state/repository.test.ts`
Expected: FAIL because `validateGame`/`redeemReward` do not exist.

- [ ] **Step 3: Implement operator actions**

`validateGame`:

1. `findSessionByCode`; if missing → `not-found`.
2. If session already has that game → `already-validated`.
3. Add the game result with `validatedAt: now.toISOString()` and cleaned initials.
4. Compute `nextType = rewardFor(session.games)`.
5. If no existing reward: create `{ type: nextType, issuedAt: now.toISOString(), redeemedAt: null, redeemedBy: null }` (nextType is never null after a game).
6. If an existing reward is unredeemed: set `type` to the higher tier (`rewardRank` order greeting < photo < photo_dance) and keep `issuedAt`.
7. If an existing reward is redeemed: do not touch it; return `notice: 'reward-locked'`.
8. Return the updated session.

`redeemReward`:

1. Find by code; missing → `not-found`.
2. No reward → `no-reward`.
3. Already redeemed → `already-redeemed`.
4. Set `redeemedAt` and cleaned `redeemedBy`; return updated session.

Add `rewardRank` to `src/domain/rewards.ts` if not already present.

- [ ] **Step 4: Run tests and commit**

Run: `npm test -- src/state/repository.test.ts`
Expected: PASS.
```bash
git add src/state/repository.ts src/state/repository.test.ts src/domain/rewards.ts
git commit -m "feat: add game validation and single-use reward redemption"
```

---

### Task 7: Demo seed data

**Files:**
- Create: `src/data/seed.ts`
- Test: `src/data/seed.test.ts`

**Interfaces:**
- Produces: `createSeedSessions(now?: Date): Session[]`; `createSeedData(now?: Date): AppData`.

- [ ] **Step 1: Write the failing tests**

```ts
import { createSeedData } from './seed';

const now = new Date('2026-11-22T18:00:00.000Z');
const data = createSeedData(now);

test('seeds 18 flagged sessions with unique ids and completed codes', () => {
  expect(data.sessions).toHaveLength(18);
  expect(data.sessions.every((s) => s.isSeed)).toBe(true);
  expect(new Set(data.sessions.map((s) => s.id)).size).toBe(18);
  const codes = data.sessions.flatMap((s) => (s.code ? [s.code] : []));
  expect(codes).toHaveLength(14);
  expect(new Set(codes).size).toBe(14);
  expect(codes.every((code) => /^FX-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(code))).toBe(true);
});

test('seeds the agreed distribution for a useful dashboard', () => {
  expect(data.sessions.filter((s) => s.state === 'completed')).toHaveLength(14);
  expect(data.sessions.filter((s) => Object.keys(s.games).length > 0)).toHaveLength(10);
  expect(data.sessions.filter((s) => s.reward)).toHaveLength(10);
  expect(data.sessions.filter((s) => s.reward?.redeemedAt)).toHaveLength(4);
  expect(new Set(data.sessions.flatMap((s) => (s.reward ? [s.reward.type] : [])))).toEqual(
    new Set(['greeting', 'photo', 'photo_dance']),
  );
});

test('completed sessions have preferences and started sessions do not', () => {
  for (const session of data.sessions) {
    if (session.state === 'completed') {
      expect(session.completedAt).toBeTruthy();
      expect(session.code).toBeTruthy();
      expect(session.preferences?.shapeId).toBeTruthy();
      expect(session.preferences?.colorId).toBeTruthy();
      expect(session.preferences?.scentId).toBeTruthy();
    } else {
      expect(session.completedAt).toBeNull();
      expect(session.code).toBeNull();
      expect(session.preferences).toBeNull();
    }
  }
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/data/seed.test.ts`
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the seed data**

Use 18 stable session ids (`seed-session-01` … `seed-session-18`), 18 fixed valid codes, and the base catalog ids. Build 14 completed sessions and 4 started sessions. Use offsets from `now` (between 30 minutes and 47 hours ago). For completed sessions, set `startedAt` 10–14 minutes before `completedAt`, `foamDone: true`, preferences with `submittedAt` equal to `completedAt`, and alternating `purchaseIntent`/`giftIntent`.

Game distribution for the 10 sessions with games:

| Seed | Games | Reward |
|---|---|---|
| 01 | both WIN | photo_dance, redeemed by AM |
| 02 | one WIN | photo |
| 03 | one LOSE | greeting, redeemed by JP |
| 04 | both WIN | photo_dance |
| 05 | both LOSE | greeting |
| 06 | WIN + LOSE | photo, redeemed by AM |
| 07 | one WIN | photo |
| 08 | both WIN | photo_dance, redeemed by JP |
| 09 | one LOSE | greeting |
| 10 | both WIN | photo_dance |

Set `reward.issuedAt` one minute after the last game; set `redeemedAt` five minutes later for the four redeemed rows. Use `operatorInitials` `AM`/`JP`.

`createSeedData` returns `{ version: 1, sessions, catalogOverrides: {}, seededAt: now.toISOString() }`.

- [ ] **Step 4: Run tests and commit**

Run: `npm test -- src/data/seed.test.ts`
Expected: PASS.
```bash
git add src/data/seed.ts src/data/seed.test.ts
git commit -m "feat: add demo sessions for the dashboard"
```

---

### Task 8: Metrics

**Files:**
- Create: `src/domain/metrics.ts`
- Test: `src/domain/metrics.test.ts`

**Interfaces:**
- Produces: `filterByOrigin(sessions, includeDemo): Session[]`; `computeMetrics(sessions, catalog, includeDemo): Metrics`; types `PreferenceStat`, `ComboStat`, `Metrics`.

- [ ] **Step 1: Write the failing tests**

Build four sessions with `makeSession`/`completedSession`: one seed with both wins and a redeemed `photo_dance`; one real with one win and `photo`; one real completed with no games; one real started. Use the same shape/color/scent for the first two to test combinations.

Assert:

```ts
const metrics = computeMetrics(sessions, BASE_CATALOG, true);
expect(metrics).toMatchObject({
  started: 4,
  completed: 3,
  completionRate: 75,
  attended: 2,
  attendanceRate: 67,
  rewardsIssued: 2,
  rewardsRedeemed: 1,
  redemptionRate: 50,
});
expect(metrics.shapes[0]).toMatchObject({ name: 'Patita', count: 2, pct: 67 });
expect(metrics.topCombos[0]).toMatchObject({ shape: 'Patita', color: 'Rosa', scent: 'Fresa', count: 2 });
```

With `includeDemo: false`, assert `started: 3`, `completed: 2`, and no seed data. With zero sessions, assert all counts are zero and arrays are empty. Add a test that an inactive catalog item still resolves its name in historical metrics.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/domain/metrics.test.ts`
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the module**

`filterByOrigin` returns all sessions when `includeDemo` is true, otherwise `!session.isSeed`.

`computeMetrics` filters first. `started` is the filtered length. `completed` is state `completed`. Rates are rounded to the nearest integer with zero denominators returning 0. Preference stats use completed sessions and count non-null IDs, resolving names with `itemName`. Sort by count descending, then name. `attended` counts completed sessions with at least one game. Rewards are counted across filtered sessions. `topCombos` groups completed sessions by `${shapeId}|${colorId}|${scentId}`, resolves names, sorts by count descending then key, and slices to 5.

- [ ] **Step 4: Run tests and commit**

Run: `npm test -- src/domain/metrics.test.ts`
Expected: PASS.
```bash
git add src/domain/metrics.ts src/domain/metrics.test.ts
git commit -m "feat: add dashboard metrics"
```

---

### Task 9: CSV exports

**Files:**
- Create: `src/domain/csv.ts`, `src/lib/download.ts`
- Test: `src/domain/csv.test.ts`

**Interfaces:**
- Produces: `csvEscape(value): string`; `toCsv(headers, rows): string`; `sessionsCsv(sessions, catalog, includeDemo): string`; `preferencesCsv(...)`; `gamesCsv(...)`; `rewardsCsv(...)`; `csvFilename(kind, includeDemo, now?): string`; `downloadText(filename, text, mime?)`; `downloadCsv(filename, text)`.

- [ ] **Step 1: Write the failing tests**

```ts
test('escapes RFC 4180 fields and prefixes a BOM', () => {
  expect(csvEscape('a,b')).toBe('"a,b"');
  expect(csvEscape('q"z')).toBe('"q""z"');
  expect(csvEscape('line\nbreak')).toBe('"line\nbreak"');
  expect(toCsv(['a', 'b'], [['x,y', 'q"z']])).toBe('\uFEFFa,b\r\n"x,y","q""z"');
});

test('real sessions exclude seeds and demo sessions add origen', () => {
  const real = sessionsCsv(allSessions, BASE_CATALOG, false);
  expect(real).not.toContain('origen');
  expect(real).not.toContain('FX-SEED22');

  const demo = sessionsCsv(allSessions, BASE_CATALOG, true);
  expect(demo).toContain('origen');
  const rows = demo.split('\r\n');
  expect(rows.some((row) => row.startsWith('FX-SEED22') && row.endsWith(',demo'))).toBe(true);
  expect(rows.some((row) => row.startsWith('FX-R3ALM2') && row.endsWith(',real'))).toBe(true);
});

test('filename includes date and demo suffix', () => {
  const now = new Date('2026-11-22T18:00:00.000Z');
  expect(csvFilename('sesiones', false, now)).toBe('formix-sesiones-2026-11-22.csv');
  expect(csvFilename('sesiones', true, now)).toBe('formix-sesiones-2026-11-22-demo.csv');
});
```

Add tests for the exact headers of all four files, preference names/ids, game result values `GANO`/`NO_GANO`, operator initials, and reward redemption fields.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/domain/csv.test.ts`
Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement the exports**

`toCsv` prefixes `\uFEFF`, escapes each cell, joins cells with `,`, and rows with `\r\n`.

Headers:

- Sessions: `codigo,iniciada_en,completada_en,estado,molde,color,aroma,intencion_compra,intencion_regalo,juegos_validados,premio,premio_canjeado_en` and, only when `includeDemo`, append `origen`.
- Preferences: `codigo,molde_id,molde,color_id,color,aroma_id,aroma,intencion_compra,intencion_regalo,enviada_en`.
- Games: `codigo,juego,resultado,validado_en,operador`.
- Rewards: `codigo,premio,emitido_en,canjeado_en,canjeado_por`.

Result values are `GANO` and `NO_GANO`. Reward values use `rewardLabel`. `juegos_validados` is the count of game results. Files include only sessions with codes. `csvFilename` uses the local date in `YYYY-MM-DD` and appends `-demo`.

`downloadText` creates a Blob, an object URL, a temporary anchor with `download`, clicks it, and revokes the URL. `downloadCsv` calls it with `text/csv;charset=utf-8`.

- [ ] **Step 4: Run tests and commit**

Run: `npm test -- src/domain/csv.test.ts`
Expected: PASS.
```bash
git add src/domain/csv.ts src/domain/csv.test.ts src/lib/download.ts
git commit -m "feat: add CSV exports"
```

---

### Task 10: Storage and flow guards

**Files:**
- Create: `src/state/storage.ts`, `src/domain/flow.ts`
- Test: `src/state/storage.test.ts`, `src/domain/flow.test.ts`

**Interfaces:**
- Produces: `STORAGE_KEYS`; `readData(): AppData | null`; `loadData(now?): AppData`; `saveData(data)`; `loadCurrentSessionId()`; `saveCurrentSessionId(id)`; `loadSoundEnabled()`; `saveSoundEnabled(enabled)`; `loadStaff()`; `saveStaff(staff)`; `clearAllStorage()`.
- Produces: `FlowStep`; `resumePath(session, catalog): string`; `canAccessStep(session, step, catalog): boolean`.

- [ ] **Step 1: Write the failing storage tests**

Use a fake clock where needed. Assert:

- empty storage → `loadData` returns 18 seeded sessions and writes the key.
- saved data round-trips.
- malformed JSON or `version !== 1` → reseeds.
- current session id and sound preference round-trip; sound defaults to true.
- staff uses `sessionStorage` and round-trips.
- `clearAllStorage` removes all keys.

- [ ] **Step 2: Write the failing flow tests**

```ts
test('resumePath follows the furthest valid step', () => {
  expect(resumePath(null, BASE_CATALOG)).toBe('/');
  expect(resumePath(makeSession(), BASE_CATALOG)).toBe('/crear/espuma');
  expect(resumePath(makeSession({ foamDone: true }), BASE_CATALOG)).toBe('/crear/molde');
  expect(resumePath(makeSession({ foamDone: true, preferences: prefs({ shapeId: 'shape-patita', colorId: '', scentId: '' }) }), BASE_CATALOG)).toBe('/crear/color');
  expect(resumePath(completedSession(), BASE_CATALOG)).toBe('/mision');
});

test('an inactive selection is treated as missing and sent back to its step', () => {
  const session = makeSession({ foamDone: true, preferences: prefs({ shapeId: 'shape-patita', colorId: 'color-rosa' }) });
  const catalog = applyCatalogOverrides(BASE_CATALOG, { 'color-rosa': 'inactive' });
  expect(resumePath(session, catalog)).toBe('/crear/color');
  expect(canAccessStep(session, 'scent', catalog)).toBe(false);
});

test('creation steps are locked after completion', () => {
  const session = completedSession();
  expect(canAccessStep(session, 'shape', BASE_CATALOG)).toBe(false);
  expect(canAccessStep(session, 'mission', BASE_CATALOG)).toBe(true);
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test -- src/state/storage.test.ts src/domain/flow.test.ts`
Expected: FAIL because the modules do not exist.

- [ ] **Step 4: Implement storage**

`STORAGE_KEYS` = `data: 'formix.data.v1'`, `currentSession: 'formix.currentSession.v1'`, `sound: 'formix.sound.v1'`, `staff: 'formix.staff.v1'`.

`readData` parses and validates `version === 1` and array sessions; returns null on any failure. `loadData` returns `readData() ?? createSeedData()` and saves when seeding. Wrap storage access in try/catch so private mode does not crash; writes become no-ops.

`loadSoundEnabled` defaults to true. Staff load/save uses `sessionStorage`. `clearAllStorage` removes both storages’ FORMIX keys.

- [ ] **Step 5: Implement flow guards**

`FlowStep = 'welcome' | 'foam' | 'shape' | 'color' | 'scent' | 'creation' | 'mission' | 'reward' | 'thanks'`.

`resumePath`:

```text
no session → '/'
completed → '/mision'
!foamDone → '/crear/espuma'
shape missing or invisible → '/crear/molde'
color missing or invisible → '/crear/color'
scent missing or invisible → '/crear/aroma'
otherwise → '/crear/creacion'
```

`canAccessStep` returns true for `welcome`; for `foam` requires a session that is not completed; each selection step requires all prior visible selections; `mission`, `reward`, `thanks` require a completed session.

- [ ] **Step 6: Run tests and commit**

Run: `npm test -- src/state/storage.test.ts src/domain/flow.test.ts`
Expected: PASS.
```bash
git add src/state/storage.ts src/state/storage.test.ts src/domain/flow.ts src/domain/flow.test.ts
git commit -m "feat: add local storage and flow guards"
```

---

### Task 11: Provider, router, and app shell

**Files:**
- Create: `src/state/FormixProvider.tsx`, `src/state/useHashRoute.ts`, `src/state/useOnline.ts`, `src/test/render.tsx`
- Modify: `src/App.tsx`, `src/App.test.tsx`
- Test: `src/state/FormixProvider.test.tsx`

**Interfaces:**
- Produces: `FormixProvider({ children, initialData?, initialCurrentSessionId?, initialStaff? })`; `useFormix()` with `data`, `catalog`, `currentSession`, `soundEnabled`, `staff`, `isOnline`, `startNewSession`, `resumeSession`, `markFoamDone`, `setPreference`, `completeCreation`, `validateGame`, `redeemReward`, `setCatalogStatus`, `resetDemo`, `prepareFair`, `clearSessions`, `login`, `logout`, `setSoundEnabled`.
- Produces: `useHashRoute(): string`; `navigate(path, { replace? })`; `useOnline(): boolean`; `renderWithFormix(ui, options?)`.

- [ ] **Step 1: Write the failing provider tests**

Render a probe component inside `FormixProvider` with a fixture. Assert:

- `startNewSession` creates a session, stores its id in `localStorage`, and exposes it as `currentSession`.
- `setPreference` updates the current session.
- `completeCreation` completes it and returns a code.
- `validateGame` and `redeemReward` update data and reject a second redemption.
- `login('operator', '2468', 'am')` succeeds and stores initials `AM`; wrong PIN fails; `login('admin','1357','')` uses default initials.
- `prepareFair` removes seeds but keeps real sessions; `resetDemo` restores seeds while keeping real sessions; `clearSessions` empties sessions.
- Cross-tab: dispatch a `StorageEvent` for the data key and assert the provider refreshes.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/state/FormixProvider.test.tsx`
Expected: FAIL because the provider does not exist.

- [ ] **Step 3: Implement the router and online hook**

`useHashRoute` uses `useSyncExternalStore` over `hashchange` plus a custom `formix:navigate` event. Normalize to a leading slash, remove trailing slashes, and default to `/`.

`navigate(path, { replace })` uses `history.replaceState` for replace and `window.location.hash` otherwise, then dispatches `new Event('formix:navigate')`.

`useOnline` initializes from `navigator.onLine` and listens to `online`/`offline`.

- [ ] **Step 4: Implement the provider**

Use `useState` initializers for data, current session id, sound, and staff. Persist data in an effect. Derive `catalog = applyCatalogOverrides(BASE_CATALOG, data.catalogOverrides)`.

`currentSession` is the session matching `currentSessionId`, or null. All repo actions set data on success. `login` compares the PIN constant for the role, cleans initials, and stores the staff session. `logout` clears it. `setSoundEnabled` persists. `resetDemo` keeps real sessions and adds a fresh seed set. `prepareFair` filters out seeds. `clearSessions` sets sessions to `[]` and `seededAt` to null. Add a storage-event listener for the data and current-session keys.

- [ ] **Step 5: Implement the app shell and test harness**

`src/App.tsx` wraps `<FormixProvider><AppShell/></FormixProvider>`.

`AppShell`:

- renders `<OfflineBanner>` (temporarily a placeholder `<div>` until Task 13) and a top-level `<BubbleField>` placeholder until Task 12;
- reads the route and renders a temporary `RoutePlaceholder` for every visitor route and staff route so the shell can be tested now;
- uses `VisitorRoute` guards with `resumePath`/`canAccessStep` for `/crear/*`, `/mision`, `/premio`, `/gracias`;
- routes `/equipo`, `/operador`, `/admin`, `/admin/sesiones`, `/admin/catalogo`, `/admin/difusion` to placeholders;
- renders a not-found page with a link to `/`.

`renderWithFormix` wraps a UI tree in `FormixProvider` with optional fixture data, current session id, and staff.

Add an App test: write a fixture with a partially filled session to `localStorage` using `saveData` and `saveCurrentSessionId`, set `window.location.hash = '#/crear/color'`, render `<App />`, and assert the app redirects to `#/crear/molde` (or the correct resume path) and does not crash. Also replace the Task 1 smoke assertion with `expect(screen.getByRole('link', { name: /formix lab/i })).toBeInTheDocument()` once the shared `Brand` is used.

- [ ] **Step 6: Run tests and build**

Run: `npm test -- src/state/FormixProvider.test.tsx src/App.test.tsx`
Expected: PASS.
Run: `npm run build`
Expected: PASS.
```bash
git add src/state src/test/render.tsx src/App.tsx src/App.test.tsx
git commit -m "feat: add provider, hash router and route guards"
```

---

### Task 12: Design foundation and core components

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/app.css`, `src/styles/visitor.css`, `src/styles/staff.css`
- Create: `src/components/Brand.tsx`, `Button.tsx`, `BubbleField.tsx`, `Progress.tsx`, `StatusChip.tsx`, `VisitorLayout.tsx`, `StaffLayout.tsx`
- Test: `src/components/components.test.tsx`

**Interfaces:**
- Produces: `Brand` (a link to `#/` with accessible name “FORMIX LAB”); `Button` with `variant: 'primary' | 'secondary' | 'ghost'`, `size: 'md' | 'lg'`, `full?`; `BubbleField({ density? })`; `Progress({ step })`; `StatusChip({ status })`; `VisitorLayout({ children, headerAction?, aside? })`; `StaffLayout({ children, title })`.

- [ ] **Step 1: Write the failing component tests**

Assert:

- `Brand` is a link with accessible name “FORMIX LAB”.
- `Button` renders its label, forwards `disabled`, and has the requested variant class.
- `Progress` shows “Paso 2 de 5” and an accessible progress bar with value 2, max 5.
- `StatusChip` renders “Disponible”, “Concepto”, and “Inactivo” for the three statuses.
- `BubbleField` is `aria-hidden` and contains at least 8 bubbles.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/components/components.test.tsx`
Expected: FAIL because the components do not exist.

- [ ] **Step 3: Add design tokens and base styles**

`tokens.css` defines:

```css
:root {
  --cream: #FBF7F2;
  --surface: #FFFDFB;
  --surface-2: #F7EEE9;
  --ink: #2E1B2A;
  --ink-soft: #6F5A68;
  --plum: #4A2450;
  --berry: #B8325B;
  --rose: #D96C8A;
  --rose-soft: #F3D9DF;
  --lavender: #E9DFF2;
  --sage: #7E9B86;
  --line: #EADDE3;
  --amber: #B7791F;
  --amber-soft: #FBF0DD;
  --success: #3E7A5E;
  --danger: #A63D3D;
  --radius-sm: 12px;
  --radius-md: 20px;
  --radius-lg: 28px;
  --shadow-sm: 0 1px 2px rgba(46, 27, 42, .05), 0 8px 24px rgba(46, 27, 42, .05);
  --shadow-lg: 0 24px 60px rgba(46, 27, 42, .12);
  --font-display: 'Fraunces Variable', Georgia, serif;
  --font-ui: 'Manrope Variable', system-ui, sans-serif;
  --maxw: 560px;
}
```

Use a warm radial-gradient background, cream surfaces, plum text, serif display, uppercase micro-labels, 52px primary buttons, 24px cards, and no neon or heavy gradients. Add a subtle grain layer with an inline SVG data URL only if it stays under 2KB. Add `@media (prefers-reduced-motion: reduce)` to disable animation and smooth scrolling.

Load the styles by making `src/styles/base.css` begin with `@import './tokens.css';` and follow with `@import './app.css'; @import './visitor.css'; @import './staff.css';` before any rules, or import the four files in that order from `main.tsx`. Keep one loading path only.

`visitor.css` makes the stage a centered 560px column on mobile and a two-column editorial layout at ≥1024px; the aside is hidden below 1024px. `staff.css` uses a full-width max-1240px shell with a lighter header.

- [ ] **Step 4: Implement the components**

`Brand` renders a link to `#/` with `aria-label="FORMIX LAB"`, “FORMIX” in display type and a small “LAB” chip. `Button` uses a native button with class names. `Progress` uses `<div role="progressbar" aria-valuemin={1} aria-valuemax={5} aria-valuenow={step} aria-label={`Paso ${step} de 5`}>` plus visible text and a filled bar. `StatusChip` maps statuses to labels and classes. `BubbleField` generates 10–14 spans with deterministic positions and sizes; `aria-hidden="true"`. `VisitorLayout` renders the aside, header (Brand + optional `headerAction`), main, and footer with a discreet “Equipo FORMIX” link to `#/equipo`. `StaffLayout` renders a compact header and children.

Update `AppShell` to render `VisitorLayout` for visitor routes and `StaffLayout` for staff routes, passing a default editorial aside. Pages render their content and their own `Progress` bar where the flow requires it. Keep the route placeholders inside the layout until their tasks replace them.

- [ ] **Step 5: Run tests and build**

Run: `npm test -- src/components/components.test.tsx`
Expected: PASS.
Run: `npm run build`
Expected: PASS.
```bash
git add src/styles src/components
git commit -m "feat: add editorial design foundation"
```

---

### Task 13: Modal, privacy dialog, offline banner, and sound

**Files:**
- Create: `src/components/Modal.tsx`, `PrivacyDialog.tsx`, `OfflineBanner.tsx`, `SoundToggle.tsx`
- Create: `src/lib/audio.ts`, `src/state/useSound.ts`
- Modify: `src/App.tsx`, `src/components/VisitorLayout.tsx`, `src/styles/app.css`
- Test: `src/components/overlays.test.tsx`

**Interfaces:**
- Produces: `Modal({ open, onClose, title, children })`; `PrivacyDialog({ open, onClose })`; `OfflineBanner()`; `SoundToggle()`; `useSound(): { play(kind) }`; sound kinds `jingle | pop | success | foam`.

- [ ] **Step 1: Polyfill `<dialog>` in the test setup**

Add to `src/test/setup.ts`:

```ts
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new Event('close')); };
}
```

- [ ] **Step 2: Write the failing overlay tests**

Assert:

- `Modal` renders its title and children when open, calls `onClose` on the close button, and renders nothing when closed.
- `PrivacyDialog` contains “No solicitamos nombre, teléfono, correo ni DNI”, the consent version, and a close button.
- `OfflineBanner` is absent when online. Set `Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })`, dispatch `window.dispatchEvent(new Event('offline'))`, assert the notice appears, then set it back to true and dispatch `online`.
- `SoundToggle` starts pressed when sound is enabled, toggles `aria-pressed`, and persists through the provider.

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test -- src/components/overlays.test.tsx`
Expected: FAIL because the components do not exist.

- [ ] **Step 4: Implement the overlays**

`Modal` uses a native `<dialog>` with a backdrop click handler, Escape handling via the native dialog, and a visible close button labelled “Cerrar”. `PrivacyDialog` uses the approved copy from the design doc and shows `CONSENT_VERSION`.

`OfflineBanner` renders a fixed top notice: “Sin conexión. Tus avances se guardan en este dispositivo; no se sincronizan con el puesto.” Use `role="status"`.

`SoundToggle` is a 44px icon button with `aria-label` “Silenciar” / “Activar sonido” and `aria-pressed`. Use the provider’s `soundEnabled` and `setSoundEnabled`; play a short confirmation when enabling.

- [ ] **Step 5: Implement audio**

`src/lib/audio.ts` lazily creates a single `AudioContext` and exports `playSound(kind, enabled)`. Return early when disabled. Use sine/triangle oscillators with short gain envelopes: a four-note jingle, a bubble pop, a success arpeggio, and a filtered noise burst for foam. No external files. Resume a suspended context on the first user gesture.

`useSound` reads `soundEnabled` from context and returns `{ play: (kind) => playSound(kind, soundEnabled) }`.

- [ ] **Step 6: Wire overlays into the shell**

Replace the placeholder offline banner in `AppShell` with `OfflineBanner`. Pass `SoundToggle` into `VisitorLayout` via its `headerAction` prop. Keep it out of the staff header unless a shared control is easy.

- [ ] **Step 7: Run tests and build**

Run: `npm test -- src/components/overlays.test.tsx`
Expected: PASS.
Run: `npm run build`
Expected: PASS.
```bash
git add src/components src/lib/audio.ts src/state/useSound.ts src/App.tsx src/components/VisitorLayout.tsx src/styles/app.css
git commit -m "feat: add privacy, offline and sound controls"
```

---

### Task 14: Soap and mascot illustrations

**Files:**
- Create: `src/components/Soap.tsx`, `src/components/Mascot.tsx`
- Create: `src/data/colors.ts`
- Test: `src/components/illustrations.test.tsx`

**Interfaces:**
- Produces: `Soap({ shapeId, colorId, size?: number, className? })`; `Mascot({ mood?: 'hello' | 'wink' | 'celebrate' | 'think', size?: number })`; `COLOR_VALUES: Record<string, { base: string; dark: string; light: string }>`.

- [ ] **Step 1: Write the failing tests**

Assert:

- `Soap` renders an accessible image labelled `Jabón con molde Patita en color Rosa`.
- Changing `shapeId`/`colorId` changes the label.
- An unknown color falls back to a neutral stone tone without crashing.
- `Mascot` renders an accessible image with the label “Burbuja, la mascota de FORMIX LAB” and each mood renders.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/components/illustrations.test.tsx`
Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement color values**

Map the six catalog color ids to base/dark/light values from the catalog. Add a neutral fallback `{ base: '#D8C7C0', dark: '#A98F86', light: '#F3E9E4' }`.

- [ ] **Step 4: Implement `Soap`**

Use a 200×200 SVG with `role="img"` and an `aria-label` that resolves the shape and color names from `BASE_CATALOG` (fall back to “un jabón”). Use `useId` for unique gradient ids. Draw one of eight silhouettes: paw (pad + four toes), heart, sphere, rose (layered petals), bear (head, ears, snout), star (rounded joins), moon (crescent), shell (fan with ridges). Fill with a linear gradient from `light` to `base` to `dark`, add a soft white specular highlight and a small debossed “F” mark in the center. Apply a CSS drop shadow. No black outlines.

- [ ] **Step 5: Implement `Mascot`**

Use a 240×260 SVG with soft rose gradients, a rounded soap body, two small arms, a smiling face, blush, and lab goggles resting on top. No thick cartoon outlines. Moods change the eyes/mouth/arms: hello waves, wink closes one eye, celebrate raises both arms, think adds a small bubble. Add 2–3 small decorative bubbles.

- [ ] **Step 6: Run tests and build**

Run: `npm test -- src/components/illustrations.test.tsx`
Expected: PASS.
Run: `npm run build`
Expected: PASS.
```bash
git add src/components/Soap.tsx src/components/Mascot.tsx src/data/colors.ts src/components/illustrations.test.tsx
git commit -m "feat: add soap and mascot illustrations"
```

---

### Task 15: Welcome, privacy, and resume states

**Files:**
- Create: `src/pages/WelcomePage.tsx`
- Modify: `src/App.tsx`, `src/styles/visitor.css`
- Test: `src/pages/WelcomePage.test.tsx`

**Interfaces:**
- Consumes: `useFormix`, `useSound`, `PrivacyDialog`, `Mascot`, `Button`. The global `VisitorLayout` is rendered by `AppShell`, not by this page.
- Produces: `/` screen with fresh, in-progress, and completed states.

- [ ] **Step 1: Write the failing tests**

Render `WelcomePage` with fixtures and a router-aware harness:

- Fresh data: heading “Tu jabón. Tu fórmula.”, text “Sin registro”, CTA “Entrar al laboratorio”. Clicking creates a session and sets `window.location.hash` to `#/crear/espuma`.
- In-progress session: CTA “Continuar mi fórmula” navigates to the correct resume path; secondary “Empezar de nuevo” creates a new session.
- Completed session: CTA “Ver mi misión” navigates to `#/mision`; secondary “Crear otra” starts a new session.
- Clicking “Aviso de privacidad” opens the dialog with “No solicitamos nombre, teléfono, correo ni DNI”.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/pages/WelcomePage.test.tsx`
Expected: FAIL because the page does not exist.

- [ ] **Step 3: Implement the page**

Use the approved copy. Structure: eyebrow “FORMIX LAB · Feria 2026”, display headline, one-sentence lede, mascot card, three fact chips, primary CTA, and privacy link. The global `VisitorLayout` provides the header, sound control, desktop aside, and the “Equipo FORMIX” footer link; keep the main CTA above the fold on a 375×667 viewport.

Wire the CTAs to the provider actions and `navigate`. On completion, play the jingle only after the click. Use `aria-live` for state changes.

- [ ] **Step 4: Wire the route in `App.tsx`**

Replace the welcome placeholder with `WelcomePage` at `/`. Keep the route guard behavior for the other routes.

- [ ] **Step 5: Run tests and build**

Run: `npm test -- src/pages/WelcomePage.test.tsx`
Expected: PASS.
Run: `npm run build`
Expected: PASS.
```bash
git add src/pages/WelcomePage.tsx src/pages/WelcomePage.test.tsx src/App.tsx src/styles/visitor.css
git commit -m "feat: add welcome and privacy experience"
```

---

### Task 16: Foam challenge and mold selection

**Files:**
- Create: `src/pages/FoamPage.tsx`, `src/pages/ShapePage.tsx`
- Modify: `src/App.tsx`, `src/styles/visitor.css`
- Test: `src/pages/foam-shape.test.tsx`

**Interfaces:**
- Consumes: `useFormix`, `useSound`, `Progress`, `Soap`, `StatusChip`, `Button`.
- Produces: `/crear/espuma` and `/crear/molde`.

- [ ] **Step 1: Write the failing tests**

Foam:

- Renders “Desafío de espuma” and “Paso 1 de 5”.
- The fallback button “Toca aquí para llevarla” completes the foam step and shows “Los moldes están listos”. Mock `src/lib/audio.ts` and assert `playSound` is not called when sound is disabled.
- After completion, “Ver los moldes” navigates to `#/crear/molde`.
- A session with `foamDone: true` opens directly in the completed state.

Shape:

- Renders only visible shapes; an inactive shape is absent; a proposed shape shows “Concepto”.
- “Continuar” is disabled until a shape is selected.
- Selecting a shape calls `setPreference` and marks the card `aria-pressed`.
- Continuing navigates to `#/crear/color`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/pages/foam-shape.test.tsx`
Expected: FAIL because the pages do not exist.

- [ ] **Step 3: Implement the foam page**

If `foamDone`, show the revealed state and CTA. Otherwise render a soap button, a drop-zone dish with an accessible label “Jabonera”, and a visible fallback button. Use pointer events for drag; on pointer up, check the dish bounding rect and complete when inside. Keyboard Enter/Space and the fallback both complete. On completion: `markFoamDone()`, `play('foam')`, show a short foam burst animation, and reveal the CTA. Respect reduced motion.

- [ ] **Step 4: Implement the shape page**

Use `visibleItems(catalog, 'shape')`. Render a two-column grid of cards with a `Soap` preview, name, notes, and `StatusChip` when proposed. Each card is a button with `aria-pressed`. CTA is disabled until `preferences?.shapeId`. On continue, `play('pop')` and navigate to color.

- [ ] **Step 5: Wire routes**

Replace the placeholders for `/crear/espuma` and `/crear/molde` in `App.tsx`.

- [ ] **Step 6: Run tests and build**

Run: `npm test -- src/pages/foam-shape.test.tsx`
Expected: PASS.
Run: `npm run build`
Expected: PASS.
```bash
git add src/pages/FoamPage.tsx src/pages/ShapePage.tsx src/pages/foam-shape.test.tsx src/App.tsx src/styles/visitor.css
git commit -m "feat: add foam challenge and mold selection"
```

---

### Task 17: Color and scent selection

**Files:**
- Create: `src/pages/ColorPage.tsx`, `src/pages/ScentPage.tsx`
- Modify: `src/App.tsx`, `src/styles/visitor.css`
- Test: `src/pages/color-scent.test.tsx`

**Interfaces:**
- Consumes: provider, `Soap`, `ScentIcon`, `StatusChip`, `Progress`, `Button`.
- Produces: `/crear/color` and `/crear/aroma`; `ScentIcon({ name, size? })` in `src/components/ScentIcon.tsx`.

- [ ] **Step 1: Write the failing tests**

Color:

- Shows “Paso 3 de 5” and the selected shape preview.
- Renders six visible color buttons with accessible names; inactive colors are absent.
- Selecting a color sets `aria-pressed` and changes the preview label to include the color name.
- “Continuar” is disabled until a color is selected; clicking navigates to `#/crear/aroma`.

Scent:

- Shows “Paso 4 de 5”, four to six scents, proposed chips, and the safety note.
- Selecting a scent marks it and enables continue; clicking navigates to `#/crear/creacion`.
- An inactive scent is absent.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/pages/color-scent.test.tsx`
Expected: FAIL because the pages do not exist.

- [ ] **Step 3: Implement `ScentIcon`**

Create simple line icons for strawberry, cacao, vanilla, coconut, lavender, and orange using currentColor. Give each SVG `aria-hidden="true"` and a 32px default size. No emoji.

- [ ] **Step 4: Implement the color page**

Render a large `Soap` with the selected shape and current color (or the first visible color for preview). Render a 3-column grid of round swatches with a glossy inner highlight, the color name below, and `aria-pressed`. Use the swatch values. On continue, navigate to aroma.

- [ ] **Step 5: Implement the scent page**

Render cards with `ScentIcon`, name, notes, and `StatusChip` for proposed. Add the safety note: “No ingerir. Si tienes sensibilidad a las fragancias, participa con precaución.” Use single selection and the same continue pattern.

- [ ] **Step 6: Wire routes**

Replace the placeholders for `/crear/color` and `/crear/aroma` in `App.tsx`.

- [ ] **Step 7: Run tests and build**

Run: `npm test -- src/pages/color-scent.test.tsx`
Expected: PASS.
Run: `npm run build`
Expected: PASS.
```bash
git add src/pages/ColorPage.tsx src/pages/ScentPage.tsx src/pages/color-scent.test.tsx src/components/ScentIcon.tsx src/App.tsx src/styles/visitor.css
git commit -m "feat: add color and scent selection"
```

---

### Task 18: Creation summary and save

**Files:**
- Create: `src/pages/CreationPage.tsx`
- Modify: `src/App.tsx`, `src/styles/visitor.css`
- Test: `src/pages/CreationPage.test.tsx`

**Interfaces:**
- Consumes: provider, `Soap`, `Button`, `Progress`, `PrivacyDialog`, `useSound`.
- Produces: `/crear/creacion`; on success, session completed and navigation to `#/mision`.

- [ ] **Step 1: Write the failing tests**

- Shows “Paso 5 de 5”, the large soap, and the names of the selected mold, color, and scent.
- Shows the exact note “Es una preferencia, no un pedido ni una reserva.”
- Toggles “Me interesaría comprarlo” and “Sería para regalo” persist via `setPreference`.
- Clicking “Guardar mi creación” completes the session, shows the code (or navigates), and sets the hash to `#/mision`.
- Clicking “Guardar” twice does not create two sessions or two codes.
- A completed session cannot be edited: add an effect in `CreationPage` that redirects to `#/mision` when `currentSession.state === 'completed'`, and assert the form is not rendered.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/pages/CreationPage.test.tsx`
Expected: FAIL because the page does not exist.

- [ ] **Step 3: Implement the page**

Render the soap, a summary list with edit links back to each step, two checkbox chips, the note, and the save CTA. Disable the CTA while saving. On success, `play('success')` and navigate to mission. On error, show a clear message and keep the user on the page. Add a privacy link.

- [ ] **Step 4: Wire the route and guard**

Replace the `/crear/creacion` placeholder. Ensure the existing route guard sends completed sessions to mission.

- [ ] **Step 5: Run tests and build**

Run: `npm test -- src/pages/CreationPage.test.tsx`
Expected: PASS.
Run: `npm run build`
Expected: PASS.
```bash
git add src/pages/CreationPage.tsx src/pages/CreationPage.test.tsx src/App.tsx src/styles/visitor.css
git commit -m "feat: add creation summary and save"
```

---

### Task 19: Mission, reward, and closing screens

**Files:**
- Create: `src/pages/MissionPage.tsx`, `src/pages/RewardPage.tsx`, `src/pages/ThanksPage.tsx`
- Modify: `src/App.tsx`, `src/styles/visitor.css`
- Test: `src/pages/mission-reward.test.tsx`

**Interfaces:**
- Consumes: provider, `rewardFor`, `rewardLabel`, `rewardDescription`, `Mascot`, `Soap`, `Button`.
- Produces: `/mision`, `/premio`, `/gracias`.

- [ ] **Step 1: Write the failing tests**

Mission:

- Shows the code prominently and a copy button; copying writes to the clipboard (mock `navigator.clipboard`).
- Shows both challenge cards with “Pendiente de validación” when no results exist.
- Shows “Superado” / “No superado” for validated results.
- Shows the reward ladder and “Los resultados solo puede registrarlos el equipo FORMIX.”
- When a reward exists, “Ver mi premio” navigates to `#/premio`.

Reward:

- No reward → “Aún no validado” and a link back to mission.
- `greeting`/`photo`/`photo_dance` → the approved label and description, plus “Muéstralo al equipo FORMIX”.
- Redeemed → “Entregado” with initials and date/time, and no redeem button.
- When the second challenge is validated after redemption, the page still shows the locked reward and a note that the prize was already delivered. Compute `Object.values(games).some(g => g.validatedAt > reward.redeemedAt)` and render “El premio ya fue entregado; el resultado quedó registrado, pero no se puede mejorar.”

Thanks:

- Shows a short closing message and the combination summary.
- “Volver a empezar” starts a new session and navigates to `#/crear/espuma`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/pages/mission-reward.test.tsx`
Expected: FAIL because the pages do not exist.

- [ ] **Step 3: Implement mission**

Render the code in a monospace card with a copy button and a fallback message if the clipboard is unavailable. Render two challenge cards (bacteria, aroma) with status badges. Render the three-tier reward ladder. Add `aria-live="polite"` to the status region so cross-tab validation updates are announced. CTA to reward when a reward exists; otherwise an explanatory note.

- [ ] **Step 4: Implement reward**

Derive the reward from `currentSession.reward`. Show pending, unlocked, or redeemed states. Use `Mascot` for the unlocked state and a gift/camera/music icon per tier. Include the upgrade warning only when the reward is unredeemed: “Puedes completar los dos retos antes de reclamar para subir de nivel.” Redeemed state shows the operator initials and local date/time. CTA “Terminar” navigates to thanks.

- [ ] **Step 5: Implement thanks**

Show the closing copy, the soap, the three selections, and the CTAs. The primary starts a new session; the secondary returns home. Do not show personal data.

- [ ] **Step 6: Wire routes**

Replace the `/mision`, `/premio`, and `/gracias` placeholders.

- [ ] **Step 7: Run tests and build**

Run: `npm test -- src/pages/mission-reward.test.tsx`
Expected: PASS.
Run: `npm run build`
Expected: PASS.
```bash
git add src/pages/MissionPage.tsx src/pages/RewardPage.tsx src/pages/ThanksPage.tsx src/pages/mission-reward.test.tsx src/App.tsx src/styles/visitor.css
git commit -m "feat: add mission, reward and closing screens"
```

---

### Task 20: Staff login and operator console

**Files:**
- Create: `src/pages/StaffLoginPage.tsx`, `src/pages/OperatorPage.tsx`
- Modify: `src/App.tsx`, `src/styles/staff.css`
- Test: `src/pages/staff-operator.test.tsx`

**Interfaces:**
- Consumes: provider, `Soap`, `Button`, `Modal`.
- Produces: `/equipo`, `/operador`; operator search, game validation, reward redemption, recent sessions.

- [ ] **Step 1: Write the failing tests**

Login:

- Shows role buttons “Operador” and “Administrador”, the PIN field, optional initials, and the demo hint “Demo: Operador 2468 · Administrador 1357”.
- Wrong PIN → “PIN incorrecto.” and no staff session.
- `2468` logs in as operator and navigates to `#/operador`; `1357` logs in as admin and navigates to `#/admin`.
- Initials are optional; blank uses “Operador”.

Operator:

- Unknown code → “No encontramos ese código.”
- Known code → shows the combination, game controls, and reward state.
- Clicking “Ganó” opens a confirmation; confirming records the result; the controls become disabled and the reward appears.
- A second game upgrades the reward from greeting/photo to photo/photo_dance.
- “Marcar premio como entregado” opens a confirmation; confirming sets redeemed; the second attempt is rejected with “Este premio ya fue entregado.”
- Validating a second game after redemption shows “El premio ya fue entregado; el resultado quedó registrado, pero no se puede mejorar.”
- Rapid double-click on redeem results in only one success.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/pages/staff-operator.test.tsx`
Expected: FAIL because the pages do not exist.

- [ ] **Step 3: Implement the login page**

Use a segmented role control, numeric PIN input, optional initials (max 12), a submit button, and the demo hint. On success, navigate by role. If already logged in, show the active session and a logout button. Add the demo-security note.

- [ ] **Step 4: Implement the operator page**

Header: “Validación en puesto”, active initials, and a logout action. Search form with code input and button. After a successful lookup, show a session card with the soap, combination names, code, origin badge, and games.

For each game: pending shows “Ganó” / “No ganó”; confirmed shows the result, initials, and time with disabled controls. Confirmation modal copy: “¿Registrar [juego] como [resultado]? Esta acción no se puede deshacer.” On success, play a soft confirmation, refresh the selected session, and show any `reward-locked` notice. Reward card shows issued/redeemed state and the redeem button only when allowed. Recent sessions list shows the last 8 completed sessions with code, time, and reward status.

Add the note: “La validación se guarda en este navegador. Para probar el ciclo completo, abre el recorrido del visitante en otra pestaña del mismo equipo.”

- [ ] **Step 5: Wire routes and guards**

Replace `/equipo` and `/operador` placeholders. `/operador` requires a logged-in operator or admin; otherwise redirect to `/equipo`. Add admin redirect behavior for `/admin` in the next task.

- [ ] **Step 6: Run tests and build**

Run: `npm test -- src/pages/staff-operator.test.tsx`
Expected: PASS.
Run: `npm run build`
Expected: PASS.
```bash
git add src/pages/StaffLoginPage.tsx src/pages/OperatorPage.tsx src/pages/staff-operator.test.tsx src/App.tsx src/styles/staff.css
git commit -m "feat: add staff login and operator console"
```

---

### Task 21: Admin dashboard, sessions, and exports

**Files:**
- Create: `src/pages/AdminPage.tsx`
- Create: `src/admin/AdminNav.tsx`, `AdminSummary.tsx`, `AdminSessions.tsx`, `ExportPanel.tsx`, `StatCard.tsx`, `PreferenceBars.tsx`, `TopCombos.tsx`
- Modify: `src/App.tsx`, `src/styles/staff.css`
- Test: `src/pages/admin.test.tsx`

**Interfaces:**
- Consumes: provider, `computeMetrics`, CSV builders, `downloadCsv`, `useHashRoute`.
- Produces: `/admin`, `/admin/sesiones` (plus placeholders for catalog/share until Task 22).

- [ ] **Step 1: Write the failing tests**

- `/admin` requires admin staff; an unauthenticated visit redirects to `#/equipo`.
- With seed data, shows KPI values and “Incluir datos de ejemplo” checked by default when there are no real sessions.
- Unchecking demo changes the KPI counts to real-only.
- Preference sections show “Moldes”, “Colores”, “Aromas”, and “Combinaciones más elegidas”.
- The methodological note about convenience sampling is present.
- `/admin/sesiones` lists codes, combinations, origin badges, and rewards; search filters by code.
- The export panel has four CSV buttons and an “Incluir datos de ejemplo” checkbox; clicking a button triggers a download with the expected filename (mock `URL.createObjectURL` and anchor click).

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/pages/admin.test.tsx`
Expected: FAIL because the pages do not exist.

- [ ] **Step 3: Implement the admin shell and summary**

`AdminPage` reads the route and renders `AdminNav` plus the correct section. It requires an admin staff session; App handles the redirect. Hold `includeDemo` state in `AdminPage` and pass it to summary and sessions. Default to `!sessions.some(s => !s.isSeed)`.

`AdminSummary` computes metrics, renders six `StatCard`s, three `PreferenceBars` sections, `TopCombos`, and the methodological note. Use accessible bars with visible counts and percentages. Show the “Datos de demostración” badge only when `includeDemo` is true and at least one seed remains.

`AdminSessions` renders a responsive table with code, date, combination, games, reward, and origin. Include a search input. Keep the demo filter shared.

`ExportPanel` has its own checkbox defaulting to false. It builds the four CSVs and calls `downloadCsv` with `csvFilename`. File names must include `-demo` when checked. Show a note that real exports exclude demo rows.

- [ ] **Step 4: Wire routes and admin guard**

Replace `/admin` and `/admin/sesiones`. If no admin staff, redirect to `/equipo`. Lazy-load `AdminPage` with `React.lazy` and a simple loader fallback. Keep `/admin/catalogo` and `/admin/difusion` placeholders until Task 22.

- [ ] **Step 5: Run tests and build**

Run: `npm test -- src/pages/admin.test.tsx`
Expected: PASS.
Run: `npm run build`
Expected: PASS.
```bash
git add src/pages/AdminPage.tsx src/admin src/pages/admin.test.tsx src/App.tsx src/styles/staff.css
git commit -m "feat: add admin dashboard, sessions and CSV export"
```

---

### Task 22: Admin catalog, QR, and fair preparation

**Files:**
- Create: `src/admin/AdminCatalog.tsx`, `AdminShare.tsx`, `QrCard.tsx`, `FairPrep.tsx`
- Modify: `src/pages/AdminPage.tsx`, `src/styles/staff.css`
- Test: `src/pages/admin-ops.test.tsx`

**Interfaces:**
- Consumes: provider, `QRCodeSVG`, `downloadText`, `Modal`.
- Produces: `/admin/catalogo` and `/admin/difusion`; catalog status edits; QR download; fair-prep actions.

- [ ] **Step 1: Write the failing tests**

Catalog:

- Lists all 20 items grouped by Moldes, Colores, Aromas.
- Each row has a status select with the three approved labels.
- Changing `shape-corazon` to “Inactivo” updates the catalog and removes it from `visibleItems`; historical sessions still resolve the name.
- Changing a proposed item to “Disponible” works.
- A note says changes affect new selections only.

Share:

- Renders a QR for `window.location.origin + window.location.pathname`.
- Shows “Escanea para abrir FORMIX LAB”.
- On localhost, shows the warning that the QR only works on this device.
- “Copiar enlace” writes the URL to the clipboard.
- “Descargar QR” triggers an SVG download.

Fair prep:

- “Preparar feria” opens a confirmation and removes only seed sessions; real sessions remain.
- “Restablecer demo” restores the 18 seeds and preserves real sessions.
- “Borrar todas las sesiones” requires a second confirmation and empties sessions.
- After “Preparar feria”, the dashboard no longer shows the demo badge when there are no seeds.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/pages/admin-ops.test.tsx`
Expected: FAIL because the pages do not exist.

- [ ] **Step 3: Implement catalog management**

Group items by type using `visibleItems`-style ordering but include inactive. Each row shows name, notes, current status, and a `<select>` with “Disponible”, “Concepto”, “Inactivo”. On change, call `setCatalogStatus`. Show a small explanation and a count of available/proposed/inactive per group.

- [ ] **Step 4: Implement QR and sharing**

`QrCard` uses `QRCodeSVG` with the public URL, `size={220}`, `level="M"`, and a cream background. Wrap it in a printable white card. Add copy and download buttons. Download the SVG by serializing the rendered `<svg>` via a ref (or querying the wrapper) and calling `downloadText(filename, svg, 'image/svg+xml')`.

Detect localhost/127.0.0.1/`::1` and show the warning.

- [ ] **Step 5: Implement fair preparation**

`FairPrep` renders three actions with distinct confirmations:

1. “Preparar feria” — “Se quitarán las 18 sesiones de ejemplo. Las sesiones reales se conservan.”
2. “Restablecer demo” — restores seeds.
3. “Borrar todas las sesiones” — danger, requires typing `BORRAR` or a second confirm.

After each action, show a confirmation message and refresh metrics.

- [ ] **Step 6: Wire routes**

Replace the `/admin/catalogo` and `/admin/difusion` placeholders in `AdminPage`.

- [ ] **Step 7: Run tests and build**

Run: `npm test -- src/pages/admin-ops.test.tsx`
Expected: PASS.
Run: `npm run build`
Expected: PASS.
```bash
git add src/admin src/pages/AdminPage.tsx src/pages/admin-ops.test.tsx src/styles/staff.css
git commit -m "feat: add catalog management, QR and fair prep"
```

---

### Task 23: Documentation and final verification

**Files:**
- Create: `README.md`, `docs/GUIA-FORMIX.md`, `docs/PRODUCCION.md`
- Modify: `docs/superpowers/specs/2026-11-22-formix-lab-prototype-design.md` only if implementation revealed an inconsistency (keep it in sync).

**Interfaces:**
- Produces: runnable instructions for FORMIX, a non-technical fair guide, and a production handoff.

- [ ] **Step 1: Write `README.md`**

Include:

- What the prototype is and is not.
- Requirements: Node 22+ (project developed on Node 26), npm.
- `npm install`, `npm run dev`, `npm test`, `npm run build`, `npm run preview`.
- Demo PINs and routes.
- How to test the full cycle in two tabs of the same browser.
- How to test on a phone on the same Wi-Fi (`npm run dev -- --host`, open the LAN URL).
- How to deploy `dist/` to Netlify, Vercel, or GitHub Pages.
- Data keys and how to reset.
- Limitations: same browser only, no real security, first load requires network, demo catalog.
- Where to replace the catalog (`src/data/catalog.ts`), visuals (`Soap`, `Mascot`), and copy.
- Link to the spec and the other docs.

- [ ] **Step 2: Write `docs/GUIA-FORMIX.md`**

Write for a non-technical FORMIX teammate:

- What you need to install and the exact commands.
- A step-by-step demo script for the visitor and the operator (with PINs).
- How to export CSV and what each file contains.
- How to prepare the fair (remove demo data, test a real cycle, print the QR).
- What FORMIX must provide before production: real catalog with available/proposed status, photos, logo, mascot approval, jingle, hosting/domain, backend account, privacy review, responsible person, event date/connectivity.
- A fair-day checklist.

- [ ] **Step 3: Write `docs/PRODUCCION.md`**

Document the path from prototype to production without implementing it:

- Supabase/PostgreSQL tables mapped from the spec: `catalog_items`, `sessions`, `preferences`, `game_results`, `rewards`, `operators`, optional `sales`.
- RLS and role model; operator/admin auth; hashed codes.
- Atomic redemption via a conditional update (`redeemed_at is null`) and unique constraints.
- Server-side validation of every game result; rate limiting; HTTPS; secrets only on the server.
- CSV generated server-side; retention and privacy.
- Multi-device sync; PWA/service worker decision for unreliable connectivity.
- Migration path from `localStorage` repository to API.
- QA checklist and the full acceptance cycle.

- [ ] **Step 4: Run the full automated verification**

Run: `npm test`
Expected: all tests pass.
Run: `npm run build`
Expected: success.
Run: `npm run preview`
Expected: preview server starts; open the URL and check the console for errors.

- [ ] **Step 5: Manual browser verification (use the in-app browser tools)**

At 375px wide and desktop width:

1. Welcome loads; start a session.
2. Foam drag and tap fallback both work; mold grid reveals.
3. Select mold, color, scent; preview updates.
4. Save creation; code appears; copy works.
5. In a second tab, log in as operator with `2468`; search the code; validate one game; reward appears.
6. Validate the second game; reward upgrades.
7. Redeem; visitor tab updates; second redeem is rejected.
8. Log in as admin with `1357`; dashboard shows metrics; export all four CSVs.
9. Deactivate a scent; it disappears from the flow; historical session still resolves.
10. Prepare fair; seeds are removed; reset demo restores them.
11. Toggle sound, reduced motion, and offline banner.
12. Check console for errors and fix any.

- [ ] **Step 6: Commit**

```bash
git add README.md docs/GUIA-FORMIX.md docs/PRODUCCION.md
git commit -m "docs: add runbook and production handoff"
```

---

## Self-Review

This plan was checked against the design doc:

- **Intent, goals, non-goals:** Tasks 1–23 implement the prototype, with docs covering what remains for production.
- **Visual direction:** Tasks 12–14 fix the palette, typography, editorial layout, SVG soap, and mascot; Tasks 15–22 apply it.
- **Flow:** Tasks 15–19 cover welcome through closing; Task 20 covers staff; Tasks 21–22 cover admin.
- **Rules:** Tasks 3–6 cover codes, rewards, immutability, upgrade/lock, and redemption; Task 10 covers guards and deactivation.
- **Data and CSV:** Tasks 5–9 cover the model, seeds, metrics, and four exports.
- **Accessibility:** Tasks 12–19 require tap/keyboard alternatives, ARIA state, reduced motion, and audio toggle.
- **Review Focus:** each of the five risks has a test in an owning task (10/11, 2/10/22, 6/20, 9, 6/20).

Known implementation choices left to the builder: exact CSS values beyond the tokens, SVG curves for the eight soap shapes, the seed combinations beyond the required distribution, and the precise wording of secondary microcopy that does not conflict with the approved copy.
