import { isVisible } from './catalog';
import type { CatalogItem, Session } from './types';

export type FlowStep =
  | 'welcome'
  | 'foam'
  | 'shape'
  | 'color'
  | 'scent'
  | 'creation'
  | 'mission'
  | 'reward'
  | 'thanks';

function shapeSelected(session: Session, catalog: CatalogItem[]): boolean {
  return isVisible(catalog, session.preferences?.shapeId);
}

function colorSelected(session: Session, catalog: CatalogItem[]): boolean {
  return isVisible(catalog, session.preferences?.colorId);
}

function scentSelected(session: Session, catalog: CatalogItem[]): boolean {
  return isVisible(catalog, session.preferences?.scentId);
}

export function resumePath(session: Session | null, catalog: CatalogItem[]): string {
  if (!session) return '/';
  if (session.state === 'completed') return '/mision';
  if (!session.foamDone) return '/crear/espuma';
  if (!shapeSelected(session, catalog)) return '/crear/molde';
  if (!colorSelected(session, catalog)) return '/crear/color';
  if (!scentSelected(session, catalog)) return '/crear/aroma';
  return '/crear/creacion';
}

export function canAccessStep(
  session: Session | null,
  step: FlowStep,
  catalog: CatalogItem[],
): boolean {
  if (step === 'welcome') return true;
  if (step === 'mission' || step === 'reward' || step === 'thanks') {
    return session?.state === 'completed';
  }
  if (!session || session.state === 'completed') return false;
  if (step === 'foam') return true;
  if (!session.foamDone) return false;
  if (step === 'shape') return true;
  if (!shapeSelected(session, catalog)) return false;
  if (step === 'color') return true;
  if (!colorSelected(session, catalog)) return false;
  if (step === 'scent') return true;
  if (!scentSelected(session, catalog)) return false;
  return step === 'creation';
}
