import { useSyncExternalStore } from 'react';

const NAV_EVENT = 'formix:navigate';

function normalize(path: string): string {
  const trimmed = path.trim();
  if (!trimmed || trimmed === '/') return '/';
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withSlash.length > 1 && withSlash.endsWith('/') ? withSlash.slice(0, -1) : withSlash;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('hashchange', callback);
  window.addEventListener(NAV_EVENT, callback);
  return () => {
    window.removeEventListener('hashchange', callback);
    window.removeEventListener(NAV_EVENT, callback);
  };
}

function getSnapshot(): string {
  return normalize(window.location.hash.slice(1));
}

export function useHashRoute(): string {
  return useSyncExternalStore(subscribe, getSnapshot, () => '/');
}

export function navigate(path: string, options: { replace?: boolean } = {}): void {
  const target = normalize(path);
  if (options.replace) {
    window.history.replaceState(null, '', `#${target}`);
  } else {
    window.location.hash = target;
  }
  window.dispatchEvent(new Event(NAV_EVENT));
}
