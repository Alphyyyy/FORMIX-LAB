import type { CatalogItem, ItemStatus, ItemType } from './types';

export function applyCatalogOverrides(
  base: CatalogItem[],
  overrides: Record<string, ItemStatus>,
): CatalogItem[] {
  return base.map((item) => (overrides[item.id] ? { ...item, status: overrides[item.id] } : { ...item }));
}

export function visibleItems(catalog: CatalogItem[], type: ItemType): CatalogItem[] {
  return catalog
    .filter((item) => item.type === type && item.status !== 'inactive')
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'es'));
}

export function itemById(catalog: CatalogItem[], id: string | null | undefined): CatalogItem | undefined {
  if (!id) return undefined;
  return catalog.find((item) => item.id === id);
}

export function itemName(catalog: CatalogItem[], id: string | null | undefined): string {
  return itemById(catalog, id)?.name ?? '—';
}

export function isVisible(catalog: CatalogItem[], id: string | null | undefined): boolean {
  const item = itemById(catalog, id);
  return Boolean(item) && item?.status !== 'inactive';
}
