import { useOnline } from '../state/useOnline';

export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div className="offline-banner" role="status">
      Sin conexión. Tus avances se guardan en este dispositivo; no se sincronizan con el puesto.
    </div>
  );
}
