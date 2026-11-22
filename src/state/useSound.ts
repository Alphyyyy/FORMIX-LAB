import { playSound } from '../lib/audio';
import type { SoundKind } from '../lib/audio';
import { useFormix } from './FormixProvider';

export function useSound(): { play: (kind: SoundKind) => void } {
  const { soundEnabled } = useFormix();
  return { play: (kind: SoundKind) => playSound(kind, soundEnabled) };
}
