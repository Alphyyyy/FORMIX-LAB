import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Soap } from '../components/Soap';
import { rewardDescription, rewardLabel } from '../domain/rewards';
import { useFormix } from '../state/FormixProvider';
import { navigate } from '../state/useHashRoute';
import type { GameType, RewardType } from '../domain/types';

const GAME_LABELS: Record<GameType, { title: string; copy: string }> = {
  bacteria: {
    title: 'Derriba las bacterias',
    copy: 'Seis botellas, dos lanzamientos. Gana con cuatro o más.',
  },
  aroma: {
    title: 'Adivina el aroma',
    copy: 'Tres envases, dos aciertos. Sin contacto con la piel.',
  },
};

const REWARD_TIERS: RewardType[] = ['greeting', 'photo', 'photo_dance'];

function gameStatus(result: 'WIN' | 'LOSE' | undefined): string {
  if (!result) return 'Pendiente de validación';
  return result === 'WIN' ? 'Superado' : 'No superado';
}

function ChallengeIcon({ type }: { type: GameType }) {
  if (type === 'bacteria') {
    return (
      <svg viewBox="0 0 40 40" width="32" height="32" aria-hidden="true" fill="none">
        <circle cx="20" cy="20" r="10" fill="rgba(184,50,91,.12)" stroke="currentColor" strokeWidth="1.6" />
        <path d="M13 15c2-3 5-4 8-3M25 25c-2 3-5 4-8 3M8 12l-3-3M31 12l3-3M9 30l-3 3M31 30l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="17" cy="18" r="1.2" fill="currentColor" />
        <circle cx="23" cy="22" r="1.2" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 40 40" width="32" height="32" aria-hidden="true" fill="none">
      <path d="M20 8c4 4 6 8 6 12 0 5-3 8-6 10-3-2-6-5-6-10 0-4 2-8 6-12Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 22c2 1 4 1 6 0 2 1 4 1 6 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function MissionPage() {
  const { currentSession, refreshCurrentSession, isCloud } = useFormix();
  const [copyMessage, setCopyMessage] = useState('');
  const code = currentSession?.code ?? '—';
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

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyMessage('Código copiado.');
    } catch {
      setCopyMessage('No se pudo copiar. Selecciona el código manualmente.');
    }
  };

  return (
    <section className="flow-page mission-page">
      <header className="flow-head">
        <p className="eyebrow">Misión presencial</p>
        <h1 className="flow-title">Tu fórmula está lista</h1>
        <p className="flow-lede">
          Muéstrale este código al equipo FORMIX para validar tus retos y recibir tu premio.
        </p>
      </header>

      <div className="mission-code">
        <span className="mission-code__label">Tu código de participación</span>
        <code className="mission-code__value">{code}</code>
        <button type="button" className="btn btn--secondary btn--md" onClick={copy}>
          Copiar código
        </button>
        <span className="mission-code__status" role="status" aria-live="polite">
          {copyMessage}
        </span>
      </div>

      <div className="mission-games" aria-live="polite">
        {(Object.keys(GAME_LABELS) as GameType[]).map((type) => (
          <article key={type} className="mission-challenge">
            <span className="mission-challenge__icon">
              <ChallengeIcon type={type} />
            </span>
            <div className="mission-challenge__copy">
              <h2>{GAME_LABELS[type].title}</h2>
              <p>{GAME_LABELS[type].copy}</p>
            </div>
            <span
              className={`mission-status mission-status--${games[type]?.result?.toLowerCase() ?? 'pending'}`}
            >
              {gameStatus(games[type]?.result)}
            </span>
          </article>
        ))}
      </div>

      <div className="reward-ladder">
        <p className="eyebrow">Cómo se desbloquea</p>
        {REWARD_TIERS.map((tier) => (
          <div
            key={tier}
            className={`reward-ladder__item${reward?.type === tier ? ' is-current' : ''}`}
          >
            <span className="reward-ladder__dot" aria-hidden="true" />
            <div>
              <strong>{rewardLabel(tier)}</strong>
              <span>{rewardDescription(tier)}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="form-note" style={{ textAlign: 'center' }}>
        Los resultados solo puede registrarlos el equipo FORMIX.
      </p>

      {reward ? (
        <Button size="lg" full onClick={() => navigate('/premio')}>
          Ver mi premio
        </Button>
      ) : (
        <p className="mission-wait">
          Cuando el equipo valide tu primer reto, aquí aparecerá tu premio.
        </p>
      )}

      <div className="mission-share">
        <Soap
          shapeId={currentSession?.preferences?.shapeId ?? 'shape-patita'}
          colorId={currentSession?.preferences?.colorId ?? 'color-rosa'}
          size={64}
        />
        <span>Tu combinación queda guardada en este dispositivo.</span>
      </div>
    </section>
  );
}
