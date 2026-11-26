import { useEffect } from 'react';
import { Button } from '../components/Button';
import { Mascot } from '../components/Mascot';
import { rewardDescription, rewardLabel } from '../domain/rewards';
import { useFormix } from '../state/FormixProvider';
import { navigate } from '../state/useHashRoute';
import type { RewardType } from '../domain/types';

function RewardIcon({ type }: { type: RewardType }) {
  if (type === 'photo') {
    return (
      <svg viewBox="0 0 40 40" width="36" height="36" aria-hidden="true" fill="none">
        <rect x="6" y="11" width="28" height="20" rx="4" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="20" cy="21" r="6" stroke="currentColor" strokeWidth="1.7" />
        <path d="M14 11l2-4h8l2 4" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === 'photo_dance') {
    return (
      <svg viewBox="0 0 40 40" width="36" height="36" aria-hidden="true" fill="none">
        <path d="M15 8v16.5a5 5 0 1 1-3-4.6V8h15v12.5a5 5 0 1 1-3-4.6V8" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M15 12h12" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 40 40" width="36" height="36" aria-hidden="true" fill="none">
      <path d="M20 17c-5-4-9 0-6 4l6 6 6-6c3-4-1-8-6-4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12 28h16M12 32h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
}

export function RewardPage() {
  const { currentSession, refreshCurrentSession, isCloud } = useFormix();
  const reward = currentSession?.reward;
  const games = currentSession?.games ?? {};

  useEffect(() => {
    if (!isCloud) return;
    void refreshCurrentSession();
    const timer = window.setInterval(() => {
      void refreshCurrentSession();
    }, 3000);
    return () => window.clearInterval(timer);
  }, [isCloud, refreshCurrentSession]);

  if (!reward) {
    return (
      <section className="flow-page reward-page">
        <header className="flow-head">
          <p className="eyebrow">Tu premio</p>
          <h1 className="flow-title">Aún no validado</h1>
          <p className="flow-lede">
            El equipo FORMIX todavía no ha registrado tus retos. Vuelve a la misión para mostrar tu
            código.
          </p>
        </header>
        <div className="reward-hero reward-hero--pending">
          <Mascot mood="think" size={180} />
          <p>Tu código sigue activo. Los retos se validan en el puesto.</p>
        </div>
        <a className="btn btn--primary btn--md btn--full" href="#/mision">
          Volver a la misión
        </a>
      </section>
    );
  }

  const redeemed = Boolean(reward.redeemedAt);
  const lateUpgrade = Object.values(games).some(
    (game) => game && reward.redeemedAt && game.validatedAt > reward.redeemedAt,
  );

  return (
    <section className="flow-page reward-page">
      <header className="flow-head">
        <p className="eyebrow">Tu premio</p>
        <h1 className="flow-title">{redeemed ? 'Premio entregado' : 'Premio desbloqueado'}</h1>
        <p className="flow-lede">
          {redeemed
            ? 'Este premio ya fue canjeado. Gracias por participar.'
            : 'Muéstralo al equipo FORMIX para recibirlo en el puesto.'}
        </p>
      </header>

      <div className={`reward-hero${redeemed ? ' reward-hero--redeemed' : ''}`}>
        <span className="reward-hero__icon">
          <RewardIcon type={reward.type} />
        </span>
        <div>
          <h2>{rewardLabel(reward.type)}</h2>
          <p>{rewardDescription(reward.type)}</p>
        </div>
        {redeemed ? <span className="reward-badge">Entregado</span> : null}
        {!redeemed ? <Mascot mood="celebrate" size={150} /> : null}
      </div>

      {redeemed ? (
        <p className="reward-meta">
          Entregado por <strong>{reward.redeemedBy}</strong>
          {reward.redeemedAt ? ` · ${formatDate(reward.redeemedAt)}` : ''}
        </p>
      ) : (
        <p className="reward-instruction">Muéstralo al equipo FORMIX</p>
      )}

      {!redeemed ? (
        <p className="form-note" style={{ textAlign: 'center' }}>
          Puedes completar los dos retos antes de reclamar para subir de nivel.
        </p>
      ) : null}

      {lateUpgrade ? (
        <p className="reward-late" role="status">
          El premio ya fue entregado; el resultado quedó registrado, pero no se puede mejorar.
        </p>
      ) : null}

      <Button size="lg" full onClick={() => navigate('/gracias')}>
        Terminar
      </Button>
    </section>
  );
}
