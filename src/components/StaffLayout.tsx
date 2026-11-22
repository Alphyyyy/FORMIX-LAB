import type { ReactNode } from 'react';
import { Brand } from './Brand';

export function StaffLayout({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="staff-shell">
      <header className="staff-header">
        <Brand />
        <span className="staff-header__title">{title}</span>
      </header>
      <main className="staff-main">{children}</main>
    </div>
  );
}
