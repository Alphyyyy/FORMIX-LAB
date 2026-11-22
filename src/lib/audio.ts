export type SoundKind = 'jingle' | 'pop' | 'success' | 'foam';

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext;
  if (!Ctor) return null;
  if (!context) context = new Ctor();
  if (context.state === 'suspended') void context.resume();
  return context;
}

function tone(
  audio: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.06,
): void {
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function playJingle(audio: AudioContext): void {
  const start = audio.currentTime + 0.02;
  [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
    tone(audio, frequency, start + index * 0.16, 0.34, 'triangle', 0.045);
  });
}

function playPop(audio: AudioContext): void {
  const start = audio.currentTime + 0.01;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(660, start);
  oscillator.frequency.exponentialRampToValueAtTime(1180, start + 0.12);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.045, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + 0.2);
}

function playSuccess(audio: AudioContext): void {
  const start = audio.currentTime + 0.02;
  [659.25, 783.99, 987.77, 1318.51].forEach((frequency, index) => {
    tone(audio, frequency, start + index * 0.11, 0.28, 'sine', 0.05);
  });
}

function playFoam(audio: AudioContext): void {
  const duration = 0.35;
  const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * duration), audio.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < channel.length; index += 1) {
    channel[index] = (Math.random() * 2 - 1) * (1 - index / channel.length);
  }
  const source = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1400, audio.currentTime);
  gain.gain.setValueAtTime(0.05, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
  source.buffer = buffer;
  source.connect(filter).connect(gain).connect(audio.destination);
  source.start();
}

export function playSound(kind: SoundKind, enabled: boolean): void {
  if (!enabled) return;
  const audio = getContext();
  if (!audio) return;
  if (kind === 'jingle') playJingle(audio);
  if (kind === 'pop') playPop(audio);
  if (kind === 'success') playSuccess(audio);
  if (kind === 'foam') playFoam(audio);
}
