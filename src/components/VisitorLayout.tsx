import type { ReactNode } from 'react';
import { Brand } from './Brand';
import { BubbleField } from './BubbleField';

interface VisitorLayoutProps {
  children: ReactNode;
  headerAction?: ReactNode;
  aside?: ReactNode;
}

function DefaultAside() {
  return (
    <div className="aside-editorial">
      <div>
        <div className="aside-editorial__mark" aria-hidden="true">
          F
        </div>
        <p className="aside-editorial__title">Cosmética de autor, hecha para jugar.</p>
        <p className="aside-editorial__copy" style={{ marginTop: 18 }}>
          Un laboratorio breve para descubrir qué forma, color y aroma te gustaría encontrar en tu
          jabón. Sin registro, sin compras, sin prisa.
        </p>
      </div>
      <ul className="aside-editorial__facts">
        <li>Feria emprendedora · 2026</li>
        <li>Investigación anónima de preferencias</li>
        <li>Hecho por FORMIX</li>
      </ul>
    </div>
  );
}

export function VisitorLayout({ children, headerAction, aside }: VisitorLayoutProps) {
  return (
    <div className="visitor-shell">
      <aside className="visitor-aside">{aside ?? <DefaultAside />}</aside>
      <div className="visitor-stage">
        <BubbleField />
        <header className="visitor-header">
          <Brand />
          {headerAction}
        </header>
        <main className="visitor-main">{children}</main>
        <footer className="visitor-footer">
          <span>FORMIX LAB · Feria 2026</span>
          <a href="#/equipo">Equipo FORMIX</a>
        </footer>
      </div>
    </div>
  );
}
