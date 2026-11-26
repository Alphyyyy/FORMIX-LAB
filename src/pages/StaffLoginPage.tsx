import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../components/Button';
import { useFormix } from '../state/FormixProvider';
import { navigate } from '../state/useHashRoute';
import type { StaffRole } from '../domain/types';

export function StaffLoginPage() {
  const { staff, staffLoading, isCloud, login, loginWithPassword, logout } = useFormix();
  const [role, setRole] = useState<StaffRole>('operator');
  const [pin, setPin] = useState('');
  const [initials, setInitials] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const goToPanel = () => {
    if (staff?.role === 'admin') navigate('/admin');
    else navigate('/operador');
  };

  if (staffLoading) {
    return (
      <section className="staff-login">
        <div className="staff-card staff-card--pad">
          <p className="eyebrow">Acceso del equipo</p>
          <p className="flow-lede">Comprobando la sesión del equipo…</p>
        </div>
      </section>
    );
  }

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

  const submitLocal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!login(role, pin, initials)) {
      setError('PIN incorrecto.');
      return;
    }
    navigate(role === 'admin' ? '/admin' : '/operador');
  };

  const submitCloud = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const session = await loginWithPassword(email.trim(), password);
    if (!session) {
      setError('Correo o contraseña incorrectos, o la cuenta no tiene rol de equipo.');
      setBusy(false);
      return;
    }
    navigate(session.role === 'admin' ? '/admin' : '/operador');
  };

  if (isCloud) {
    return (
      <section className="staff-login">
        <div className="staff-card staff-card--pad">
          <p className="eyebrow">Acceso del equipo</p>
          <h1 className="flow-title">Validación en puesto</h1>
          <p className="flow-lede">
            Entra con tu cuenta de FORMIX para registrar retos y entregar premios.
          </p>

          <form className="staff-form" onSubmit={submitCloud}>
            <label className="field">
              <span>Correo del equipo</span>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Contraseña</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            {error ? (
              <p className="form-error" role="alert">
                {error}
              </p>
            ) : null}

            <Button type="submit" size="lg" full disabled={busy}>
              {busy ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>

          <p className="form-note">
            Acceso reservado al equipo FORMIX. La sesión se guarda en este dispositivo.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="staff-login">
      <div className="staff-card staff-card--pad">
        <p className="eyebrow">Acceso del equipo</p>
        <h1 className="flow-title">Validación en puesto</h1>
        <p className="flow-lede">
          Entra con tu PIN para registrar retos y entregar premios.
        </p>

        <form className="staff-form" onSubmit={submitLocal}>
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

        <p className="form-note">
          El PIN te lo entrega la persona responsable de FORMIX.
        </p>
        <p className="form-note">
          Acceso reservado al equipo. En producción se sustituye por autenticación real con roles y
          servidor.
        </p>
      </div>
    </section>
  );
}
