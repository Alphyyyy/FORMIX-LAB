import { isCloudMode } from '../lib/supabase';
import { useOnline } from '../state/useOnline';

export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div className="offline-banner" role="status">
      {isCloudMode
        ? 'Sin conexión. No se pueden guardar ni validar datos en la nube hasta recuperar la conexión.'
        : 'Sin conexión. Tus avances se guardan en este dispositivo; no se sincronizan con el puesto.'}
    </div>
  );
}
