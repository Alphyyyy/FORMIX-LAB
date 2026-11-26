import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Soap } from '../components/Soap';
import { itemName } from '../domain/catalog';
import { rewardLabel } from '../domain/rewards';
import { useFormix } from '../state/FormixProvider';
import { navigate } from '../state/useHashRoute';
import { useSound } from '../state/useSound';
import type { GameResultValue, GameType, Session } from '../domain/types';

const GAMES: Record<GameType, string> = {
  bacteria: 'Derriba las bacterias',
  aroma: 'Adivina el aroma',
};

type Confirmation =
  | { kind: 'game'; gameType: GameType; result: GameResultValue }
  | { kind: 'redeem' };

function formatDate(value: string): string {
  return new Date(value).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
}

function resultLabel(result: GameResultValue | undefined): string {
  if (!result) return 'Pendiente';
  return result === 'WIN' ? 'Superado' : 'No superado';
}

export function OperatorPage() {
  const {
    catalog,
    staff,
    logout,
    validateGame,
    redeemReward,
    findSessionByCode,
    allSessions,
    refreshAllSessions,
  } = useFormix();
  const { play } = useSound();
  const [query, setQuery] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [message, setMessage] = useState('');
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  useEffect(() => {
    void refreshAllSessions();
  }, [refreshAllSessions]);

  const recent = useMemo(
    () =>
      allSessions
        .filter((item) => item.state === 'completed' && item.code)
        .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
        .slice(0, 8),
    [allSessions],
  );

  const search = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = await findSessionByCode(query);
    if (!found) {
      setSession(null);
      setMessage('No encontramos ese código.');
      return;
    }
    setSession(found);
    setQuery(found.code ?? query);
    setMessage('');
  };

  const openResults = (found: Session) => {
    setSession(found);
    setQuery(found.code ?? '');
    setMessage('');
  };

  const confirmGame = (gameType: GameType, result: GameResultValue) => {
    setConfirmation({ kind: 'game', gameType, result });
  };

  const handleConfirm = async () => {
    if (!confirmation) return;
    if (confirmation.kind === 'game') {
      if (!session?.code) return;
      const outcome = await validateGame(
        session.code,
        confirmation.gameType,
        confirmation.result,
        staff?.initials ?? 'Operador',
      );
      if (!outcome.ok) {
        setMessage(
          outcome.error === 'already-validated'
            ? 'Este reto ya fue registrado.'
            : outcome.error === 'remote'
              ? 'No se pudo conectar con el servidor.'
              : 'No se pudo registrar el resultado.',
        );
      } else if (outcome.notice === 'reward-locked') {
        setSession(outcome.value);
        setMessage(
          'El premio ya fue entregado; el resultado quedó registrado, pero no se puede mejorar.',
        );
        play('pop');
      } else {
        setSession(outcome.value);
        setMessage('Resultado registrado.');
        play('success');
      }
    } else if (session?.code) {
      const outcome = await redeemReward(session.code, staff?.initials ?? 'Operador');
      if (!outcome.ok) {
        setMessage(
          outcome.error === 'already-redeemed'
            ? 'Este premio ya fue entregado.'
            : outcome.error === 'remote'
              ? 'No se pudo conectar con el servidor.'
              : 'No se pudo entregar el premio.',
        );
      } else {
        setSession(outcome.value);
        setMessage('Premio entregado.');
        play('success');
      }
    }
    setConfirmation(null);
  };

  const confirmCopy = confirmation
    ? confirmation.kind === 'game'
      ? `¿Registrar ${GAMES[confirmation.gameType]} como ${
          confirmation.result === 'WIN' ? 'ganado' : 'no ganado'
        }? Esta acción no se puede deshacer.`
      : '¿Marcar el premio como entregado? Esta acción no se puede deshacer.'
    : '';

  return (
    <section className="operator-page">
      <header className="operator-head">
        <div>
          <p className="eyebrow">Equipo FORMIX</p>
          <h1 className="flow-title">Validación en puesto</h1>
          <p className="flow-lede">Registra los retos y entrega el premio con el código del visitante.</p>
        </div>
        <div className="operator-id">
          <span>{staff?.initials ?? 'Operador'}</span>
          <span>{staff?.role === 'admin' ? 'Administrador' : 'Operador'}</span>
          <button
            type="button"
            className="link-button"
            onClick={() => {
              logout();
              navigate('/equipo');
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <form className="operator-search" onSubmit={search}>
        <label className="field field--grow">
          <span>Código de participación</span>
          <input
            type="text"
            autoComplete="off"
            placeholder="FX-XXXXXX"
            value={query}
            onChange={(event) => setQuery(event.target.value.toUpperCase())}
          />
        </label>
        <Button type="submit">Buscar</Button>
      </form>

      <p className="operator-feedback" role="status" aria-live="polite">
        {message}
      </p>

      {session ? (
        <div className="operator-grid">
          <article className="operator-session staff-card">
            <div className="operator-session__top">
              <div>
                <span className="operator-session__code">{session.code}</span>
                <span className={`origin-badge origin-badge--${session.isSeed ? 'demo' : 'real'}`}>
                  {session.isSeed ? 'Demo' : 'Real'}
                </span>
              </div>
              <span className="form-note">{formatDate(session.completedAt ?? session.startedAt)}</span>
            </div>

            <div className="operator-combo">
              <Soap
                shapeId={session.preferences?.shapeId ?? ''}
                colorId={session.preferences?.colorId ?? ''}
                size={92}
              />
              <dl>
                <div>
                  <dt>Molde</dt>
                  <dd>{itemName(catalog, session.preferences?.shapeId)}</dd>
                </div>
                <div>
                  <dt>Color</dt>
                  <dd>{itemName(catalog, session.preferences?.colorId)}</dd>
                </div>
                <div>
                  <dt>Aroma</dt>
                  <dd>{itemName(catalog, session.preferences?.scentId)}</dd>
                </div>
              </dl>
            </div>

            <div className="operator-games">
              {(Object.keys(GAMES) as GameType[]).map((type) => {
                const result = session.games[type];
                return (
                  <div className="operator-game" key={type}>
                    <div>
                      <strong>{GAMES[type]}</strong>
                      <span className={`operator-status operator-status--${result?.result.toLowerCase() ?? 'pending'}`}>
                        {resultLabel(result?.result)}
                      </span>
                    </div>
                    {result ? (
                      <span className="form-note">
                        {result.operatorInitials} · {formatDate(result.validatedAt)}
                      </span>
                    ) : (
                      <div className="operator-game__actions">
                        <Button
                          variant="secondary"
                          aria-label={`Ganó en ${GAMES[type]}`}
                          onClick={() => confirmGame(type, 'WIN')}
                        >
                          Ganó
                        </Button>
                        <Button
                          variant="ghost"
                          aria-label={`No ganó en ${GAMES[type]}`}
                          onClick={() => confirmGame(type, 'LOSE')}
                        >
                          No ganó
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </article>

          <aside className="operator-reward staff-card">
            <p className="eyebrow">Premio</p>
            {session.reward ? (
              <>
                <h2>{rewardLabel(session.reward.type)}</h2>
                {session.reward.redeemedAt ? (
                  <>
                    <p className="reward-meta">
                      Entregado por {session.reward.redeemedBy} ·{' '}
                      {formatDate(session.reward.redeemedAt)}
                    </p>
                    <p className="form-note">Este premio ya fue entregado.</p>
                  </>
                ) : (
                  <Button full onClick={() => setConfirmation({ kind: 'redeem' })}>
                    Marcar premio como entregado
                  </Button>
                )}
              </>
            ) : (
              <p className="form-note">Se emite al validar el primer reto.</p>
            )}
          </aside>
        </div>
      ) : null}

      <section className="recent-sessions">
        <p className="eyebrow">Últimas sesiones</p>
        {recent.length ? (
          <div className="recent-list">
            {recent.map((item) => (
              <button
                key={item.id}
                type="button"
                className="recent-item"
                onClick={() => openResults(item)}
              >
                <span className="recent-item__code">{item.code}</span>
                <span>{formatDate(item.completedAt ?? item.startedAt)}</span>
                <span>{item.reward ? rewardLabel(item.reward.type) : 'Sin premio'}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="form-note">Todavía no hay sesiones completadas.</p>
        )}
      </section>

      <p className="form-note operator-note">
        La validación se guarda en este navegador. Para probar el ciclo completo, abre el recorrido
        del visitante en otra pestaña del mismo equipo.
      </p>

      <Modal
        open={confirmation !== null}
        title="Confirmar acción"
        onClose={() => setConfirmation(null)}
      >
        <p className="form-note" style={{ fontSize: 13 }}>
          {confirmCopy}
        </p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setConfirmation(null)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            {confirmation?.kind === 'redeem' ? 'Sí, entregar' : 'Sí, registrar'}
          </Button>
        </div>
      </Modal>
    </section>
  );
}
