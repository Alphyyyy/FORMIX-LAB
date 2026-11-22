import type { ItemStatus } from '../domain/types';

const LABELS: Record<ItemStatus, string> = {
  available: 'Disponible',
  proposed: 'Concepto',
  inactive: 'Inactivo',
};

export function StatusChip({ status }: { status: ItemStatus }) {
  return <span className={`status-chip status-chip--${status}`}>{LABELS[status]}</span>;
}
