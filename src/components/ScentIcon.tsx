interface ScentIconProps {
  name: string;
  size?: number;
}

function normalize(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function ScentIcon({ name, size = 32 }: ScentIconProps) {
  const key = normalize(name);
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 32 32',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  if (key.includes('fresa')) {
    return (
      <svg {...common}>
        <path d="M16 28c-6-4-9-9-7-13 1.5-3 5-3 7-1 2-2 5.5-2 7 1 2 4-1 9-7 13Z" />
        <path d="M16 14V8m0 0-4 3m4-3 4 3M12 9l2 3m6-3-2 3" />
        <path d="M12 18h.01M16 20h.01M20 18h.01M14 23h.01M18 23h.01" strokeWidth="2.4" />
      </svg>
    );
  }
  if (key.includes('chocolate')) {
    return (
      <svg {...common}>
        <path d="M10 27c-3-5-2-14 2-19 4-4 9-3 11 2 2 6-2 14-7 17-2 1-4 1-6 0Z" />
        <path d="M13 9c2 5 6 7 10 7M12 15c2 4 5 6 8 7M11 21c2 3 4 4 6 4" />
      </svg>
    );
  }
  if (key.includes('vainilla')) {
    return (
      <svg {...common}>
        <path d="M16 27V13" />
        <path d="M16 20c-4 0-6-2-6-5 4 0 6 2 6 5Zm0-4c4 0 6-2 6-5-4 0-6 2-6 5Z" />
        <path d="M16 10c-4 0-6-2-6-5 4 0 6 2 6 5Zm0-3c4 0 6-2 6-5-4 0-6 2-6 5Z" />
      </svg>
    );
  }
  if (key.includes('coco')) {
    return (
      <svg {...common}>
        <path d="M6 17a10 10 0 0 1 20 0c0 5-4 9-10 9S6 22 6 17Z" />
        <path d="M9 14c3-3 11-3 14 0M10 20c3 2 9 2 12 0" />
        <circle cx="16" cy="17" r="2.4" />
      </svg>
    );
  }
  if (key.includes('lavanda')) {
    return (
      <svg {...common}>
        <path d="M16 28V10" />
        <path d="M16 23c-4 0-6-2-6-5 4 0 6 2 6 5Zm0-5c4 0 6-2 6-5-4 0-6 2-6 5Z" />
        <circle cx="16" cy="7" r="2.2" />
        <circle cx="12" cy="10" r="1.8" />
        <circle cx="20" cy="10" r="1.8" />
      </svg>
    );
  }
  if (key.includes('naranja')) {
    return (
      <svg {...common}>
        <circle cx="16" cy="17" r="10" />
        <path d="M16 7v20M6 17h20M9 10l14 14M23 10 9 24" />
        <path d="M16 7c0-2 2-4 4-4" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M16 5c4 6 7 9 7 13a7 7 0 0 1-14 0c0-4 3-7 7-13Z" />
    </svg>
  );
}
