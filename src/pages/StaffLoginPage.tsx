import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../components/Button';
import { useFormix } from '../state/FormixProvider';
import { navigate } from '../state/useHashRoute';
import type { StaffRole } from '../domain/types';

export function StaffLoginPage() {
  const { staff, login, logout } = useFormix();
  const [role, setRole] = useState<StaffRole>('operator');
  const [pin, setPin] = useState('');
  const [initials, setInitials] = useState('');
  const [error, setError] = useState('');

  const goToPanel = () => {
    if (staff?.role === 'admin') navigate('/admin');
    else navigate('/operador');
  };

  if (staff) {
    return (
      <section className="staff-login">
        <div className="staff-card staff-card--pad">
          <p className="eyebrow">Sesión activa</p>
          <h1 className="flow-title">Hola, {staff.initials}</h1>
          <p className="flow-lede">
            Estás dentro como {staff.role === 'admin' ? 'administrador' : 'operador'}.
          </p>
          <div className="staff-actions">
            <Button full onClick={goToPanel}>
              Ir al panel
            </Button>
            <Button variant="secondary" full onClick={logout}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!login(role, pin, initials)) {
      setError('PIN incorrecto.');
      return;
    }
    navigate(role === 'admin' ? '/admin' : '/operador');
  };

  return (
    <section className="staff-login">
      <div className="staff-card staff-card--pad">
        <p className="eyebrow">Acceso del equipo</p>
        <h1 className="flow-title">Validación en puesto</h1>
        <p className="flow-lede">
          Entra con tu PIN para registrar retos y entregar premios.
        </p>

        <form className="staff-form" onSubmit={submit}>
          <div className="segmented" role="group" aria-label="Rol">
            <button
              type="button"
              className={role === 'operator' ? 'is-active' : ''}
              aria-pressed={role === 'operator'}
              onClick={() => setRole('operator')}
            >
              Operador
            </button>
            <button
              type="button"
              className={role === 'admin' ? 'is-active' : ''}
              aria-pressed={role === 'admin'}
              onClick={() => setRole('admin')}
            >
              Administrador
            </button>
          </div>

          <label className="field">
            <span>PIN</span>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))}
              required
            />
          </label>

          <label className="field">
            <span>Iniciales (opcional)</span>
            <input
              type="text"
              maxLength={12}
              autoComplete="off"
              placeholder="Ej. AM"
              value={initials}
              onChange={(event) => setInitials(event.target.value)}
            />
          </label>

          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" size="lg" full>
            Entrar
          </Button>
        </form>

        <p className="staff-hint">Demo: Operador 2468 · Administrador 1357</p>
        <p className="form-note">
          Acceso de demostración. En producción se sustituye por autenticación real con roles y
          servidor.
        </p>
      </div>
    </section>
  );
}
