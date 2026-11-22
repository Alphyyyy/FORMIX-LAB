import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { StaffLayout } from './components/StaffLayout';
import { VisitorLayout } from './components/VisitorLayout';
import { canAccessStep, resumePath } from './domain/flow';
import type { FlowStep } from './domain/flow';
import { FormixProvider, useFormix } from './state/FormixProvider';
import { navigate, useHashRoute } from './state/useHashRoute';

const VISITOR_STEPS: Record<string, FlowStep> = {
  '/crear/espuma': 'foam',
  '/crear/molde': 'shape',
  '/crear/color': 'color',
  '/crear/aroma': 'scent',
  '/crear/creacion': 'creation',
  '/mision': 'mission',
  '/premio': 'reward',
  '/gracias': 'thanks',
};

const STAFF_ROUTES = ['/equipo', '/operador', '/admin', '/admin/sesiones', '/admin/catalogo', '/admin/difusion'];

function RoutePlaceholder({ path }: { path: string }) {
  return (
    <section>
      <h1 className="display">FORMIX LAB</h1>
      <p className="lede">{path}</p>
    </section>
  );
}

function VisitorRoute({ step, children }: { step: FlowStep; children: ReactNode }) {
  const { currentSession, catalog } = useFormix();
  const allowed = canAccessStep(currentSession, step, catalog);
  const target = resumePath(currentSession, catalog);

  useEffect(() => {
    if (!allowed) navigate(target, { replace: true });
  }, [allowed, target]);

  if (!allowed) return <p>Redirigiendo…</p>;
  return <>{children}</>;
}

function AppShell() {
  const route = useHashRoute();

  if (STAFF_ROUTES.includes(route)) {
    return (
      <StaffLayout title="Equipo FORMIX">
        <RoutePlaceholder path={route} />
      </StaffLayout>
    );
  }

  if (route === '/') {
    return (
      <VisitorLayout>
        <RoutePlaceholder path={route} />
      </VisitorLayout>
    );
  }

  if (VISITOR_STEPS[route]) {
    return (
      <VisitorLayout>
        <VisitorRoute step={VISITOR_STEPS[route]}>
          <RoutePlaceholder path={route} />
        </VisitorRoute>
      </VisitorLayout>
    );
  }

  return (
    <main>
      <h1>Página no encontrada</h1>
      <a href="#/">Volver al inicio</a>
    </main>
  );
}

export default function App() {
  return (
    <FormixProvider>
      <div role="status" hidden className="offline-placeholder" />
      <AppShell />
    </FormixProvider>
  );
}
