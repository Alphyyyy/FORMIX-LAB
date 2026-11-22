import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Button } from '../components/Button';
import { Progress } from '../components/Progress';
import { Soap } from '../components/Soap';
import { useFormix } from '../state/FormixProvider';
import { navigate } from '../state/useHashRoute';
import { useSound } from '../state/useSound';

export function FoamPage() {
  const { currentSession, markFoamDone } = useFormix();
  const { play } = useSound();
  const dishRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [revealed, setRevealed] = useState(Boolean(currentSession?.foamDone));

  const done = Boolean(currentSession?.foamDone) || revealed;

  const complete = () => {
    if (done) return;
    markFoamDone();
    setRevealed(true);
    play('foam');
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    startRef.current = { x: event.clientX, y: event.clientY };
    setDragging(true);
    setOffset({ x: 0, y: 0 });
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!startRef.current) return;
    setOffset({
      x: event.clientX - startRef.current.x,
      y: event.clientY - startRef.current.y,
    });
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!startRef.current) return;
    const rect = dishRef.current?.getBoundingClientRect();
    if (
      rect &&
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    ) {
      complete();
    }
    startRef.current = null;
    setDragging(false);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <section className="flow-page foam-page">
      <Progress step={1} />
      <header className="flow-head">
        <p className="eyebrow">Paso 1 · Espuma</p>
        <h1 className="flow-title">Desafío de espuma</h1>
        <p className="flow-lede">Arrastra la pastilla hasta la jabonera para revelar los moldes.</p>
      </header>

      {done ? (
        <div className="foam-complete" aria-live="polite">
          <div className="foam-complete__bubbles" aria-hidden="true">
            {Array.from({ length: 9 }).map((_, index) => (
              <span key={index} />
            ))}
          </div>
          <Soap shapeId="shape-patita" colorId="color-rosa" size={118} />
          <h2>Los moldes están listos</h2>
          <p>La espuma se disolvió y dejó ver las formas disponibles.</p>
          <Button size="lg" full onClick={() => navigate('/crear/molde')}>
            Ver los moldes
          </Button>
        </div>
      ) : (
        <>
          <div className="foam-stage">
            <button
              type="button"
              className={`foam-soap${dragging ? ' is-dragging' : ''}`}
              aria-label="Pastilla de jabón: arrástrala a la jabonera o usa el botón de abajo"
              style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  complete();
                }
              }}
            >
              <Soap shapeId="shape-patita" colorId="color-rosa" size={104} />
            </button>
            <div className="foam-guide" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="foam-dish" ref={dishRef} aria-label="Jabonera" role="group">
              <span className="foam-dish__water" aria-hidden="true" />
              <span className="foam-dish__rim" aria-hidden="true" />
            </div>
          </div>
          <Button variant="secondary" full onClick={complete}>
            Toca aquí para llevarla
          </Button>
          <p className="form-note" style={{ textAlign: 'center' }}>
            También puedes tocar la pastilla y usar Enter o Espacio.
          </p>
        </>
      )}
    </section>
  );
}
