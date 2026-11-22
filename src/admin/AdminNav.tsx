import { useHashRoute } from '../state/useHashRoute';

const TABS = [
  { path: '/admin', label: 'Resumen' },
  { path: '/admin/sesiones', label: 'Sesiones' },
  { path: '/admin/catalogo', label: 'Catálogo' },
  { path: '/admin/difusion', label: 'Difusión' },
];

export function AdminNav() {
  const route = useHashRoute();
  return (
    <nav className="admin-nav" aria-label="Secciones del panel">
      {TABS.map((tab) => (
        <a
          key={tab.path}
          href={`#${tab.path}`}
          className={route === tab.path ? 'is-active' : ''}
          aria-current={route === tab.path ? 'page' : undefined}
        >
          {tab.label}
        </a>
      ))}
    </nav>
  );
}
