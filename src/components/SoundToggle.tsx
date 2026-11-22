import { useFormix } from '../state/FormixProvider';
import { useSound } from '../state/useSound';

export function SoundToggle() {
  const { soundEnabled, setSoundEnabled } = useFormix();
  const { play } = useSound();

  const toggle = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) play('pop');
  };

  return (
    <button
      type="button"
      className="icon-button"
      aria-label={soundEnabled ? 'Silenciar' : 'Activar sonido'}
      aria-pressed={soundEnabled}
      onClick={toggle}
    >
      {soundEnabled ? (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            d="M4 9h4l5-4v14l-5-4H4V9Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M16 9.2a4 4 0 0 1 0 5.6M18.6 6.6a7.5 7.5 0 0 1 0 10.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            d="M4 9h4l5-4v14l-5-4H4V9Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="m16 9 5 6M21 9l-5 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
