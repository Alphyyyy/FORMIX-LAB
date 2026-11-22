import { BASE_CATALOG } from '../data/catalog';
import { applyCatalogOverrides } from './catalog';
import { canAccessStep, resumePath } from './flow';
import { completedSession, makeSession, prefs } from '../test/fixtures';

test('resumePath follows the furthest valid step', () => {
  expect(resumePath(null, BASE_CATALOG)).toBe('/');
  expect(resumePath(makeSession(), BASE_CATALOG)).toBe('/crear/espuma');
  expect(resumePath(makeSession({ foamDone: true }), BASE_CATALOG)).toBe('/crear/molde');
  expect(
    resumePath(
      makeSession({
        foamDone: true,
        preferences: prefs({ shapeId: 'shape-patita', colorId: '', scentId: '' }),
      }),
      BASE_CATALOG,
    ),
  ).toBe('/crear/color');
  expect(resumePath(completedSession(), BASE_CATALOG)).toBe('/mision');
});

test('an inactive selection is treated as missing and sent back to its step', () => {
  const session = makeSession({
    foamDone: true,
    preferences: prefs({ shapeId: 'shape-patita', colorId: 'color-rosa' }),
  });
  const catalog = applyCatalogOverrides(BASE_CATALOG, { 'color-rosa': 'inactive' });
  expect(resumePath(session, catalog)).toBe('/crear/color');
  expect(canAccessStep(session, 'scent', catalog)).toBe(false);
});

test('creation steps are locked after completion', () => {
  const session = completedSession();
  expect(canAccessStep(session, 'shape', BASE_CATALOG)).toBe(false);
  expect(canAccessStep(session, 'mission', BASE_CATALOG)).toBe(true);
});

test('allows the expected steps for a fresh session', () => {
  const session = makeSession();
  expect(canAccessStep(session, 'welcome', BASE_CATALOG)).toBe(true);
  expect(canAccessStep(session, 'foam', BASE_CATALOG)).toBe(true);
  expect(canAccessStep(session, 'shape', BASE_CATALOG)).toBe(false);
  expect(canAccessStep(null, 'mission', BASE_CATALOG)).toBe(false);
  expect(canAccessStep(completedSession(), 'thanks', BASE_CATALOG)).toBe(true);
});
