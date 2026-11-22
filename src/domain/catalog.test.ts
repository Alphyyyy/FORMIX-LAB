import { BASE_CATALOG } from '../data/catalog';
import { applyCatalogOverrides, isVisible, itemName, visibleItems } from './catalog';

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
