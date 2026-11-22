import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { OfflineBanner } from './components/OfflineBanner';
import { SoundToggle } from './components/SoundToggle';
import { StaffLayout } from './components/StaffLayout';
import { VisitorLayout } from './components/VisitorLayout';
import { ColorPage } from './pages/ColorPage';
import { CreationPage } from './pages/CreationPage';
import { FoamPage } from './pages/FoamPage';
import { MissionPage } from './pages/MissionPage';
import { OperatorPage } from './pages/OperatorPage';
import { RewardPage } from './pages/RewardPage';
import { ScentPage } from './pages/ScentPage';
import { ShapePage } from './pages/ShapePage';
import { StaffLoginPage } from './pages/StaffLoginPage';
import { ThanksPage } from './pages/ThanksPage';
import { WelcomePage } from './pages/WelcomePage';
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

function VisitorPage({ route }: { route: string }) {
  if (route === '/crear/espuma') return <FoamPage />;
  if (route === '/crear/molde') return <ShapePage />;
  if (route === '/crear/color') return <ColorPage />;
  if (route === '/crear/aroma') return <ScentPage />;
  if (route === '/crear/creacion') return <CreationPage />;
  if (route === '/mision') return <MissionPage />;
  if (route === '/premio') return <RewardPage />;
  if (route === '/gracias') return <ThanksPage />;
  return <RoutePlaceholder path={route} />;
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

function StaffGate({ role, children }: { role: 'operator' | 'admin'; children: ReactNode }) {
  const { staff } = useFormix();
  const allowed =
    Boolean(staff) && (role === 'operator' ? staff?.role === 'operator' || staff?.role === 'admin' : staff?.role === 'admin');

  useEffect(() => {
    if (!allowed) navigate('/equipo', { replace: true });
  }, [allowed]);

  if (!allowed) return <p>Redirigiendo al acceso del equipo…</p>;
  return <>{children}</>;
}

function AppShell() {
  const route = useHashRoute();

  if (STAFF_ROUTES.includes(route)) {
    return (
      <StaffLayout title="Equipo FORMIX">
        {route === '/equipo' ? <StaffLoginPage /> : null}
        {route === '/operador' ? (
          <StaffGate role="operator">
            <OperatorPage />
          </StaffGate>
        ) : null}
        {route.startsWith('/admin') ? <RoutePlaceholder path={route} /> : null}
      </StaffLayout>
    );
  }

  if (route === '/') {
    return (
      <VisitorLayout headerAction={<SoundToggle />}>
        <WelcomePage />
      </VisitorLayout>
    );
  }

  if (VISITOR_STEPS[route]) {
    return (
      <VisitorLayout headerAction={<SoundToggle />}>
        <VisitorRoute step={VISITOR_STEPS[route]}>
          <VisitorPage route={route} />
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
      <OfflineBanner />
      <AppShell />
    </FormixProvider>
  );
}
