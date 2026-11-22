import { useId } from 'react';
import { BASE_CATALOG } from '../data/catalog';
import { COLOR_VALUES, NEUTRAL_COLOR } from '../data/colors';
import { itemName } from '../domain/catalog';

interface SoapProps {
  shapeId: string;
  colorId: string;
  size?: number;
  className?: string;
}

function Shape({ shapeId }: { shapeId: string }) {
  if (shapeId === 'shape-patita') {
    return (
      <g>
        <ellipse cx="100" cy="114" rx="38" ry="32" />
        <circle cx="67" cy="74" r="14" />
        <circle cx="87" cy="61" r="14" />
        <circle cx="113" cy="61" r="14" />
        <circle cx="133" cy="74" r="14" />
        <ellipse cx="100" cy="112" rx="22" ry="18" fill="rgba(255,255,255,.14)" />
      </g>
    );
  }
  if (shapeId === 'shape-corazon') {
    return (
      <path d="M100 162C58 133 38 105 51 82c11-19 35-20 49-2 14-18 38-17 49 2 13 23-7 51-49 80Z" />
    );
  }
  if (shapeId === 'shape-esfera') {
    return <circle cx="100" cy="102" r="58" />;
  }
  if (shapeId === 'shape-rosa') {
    return (
      <g>
        <ellipse cx="100" cy="100" rx="58" ry="54" />
        <ellipse cx="100" cy="100" rx="45" ry="41" fill="rgba(255,255,255,.1)" />
        <ellipse cx="100" cy="100" rx="31" ry="28" fill="rgba(255,255,255,.1)" />
        <path
          d="M100 82c15 0 26 10 26 22s-11 22-26 22-25-10-25-22 10-22 25-22Zm0 9c-9 0-16 6-16 13s7 13 16 13 16-6 16-13-7-13-16-13Zm0 9c-4 0-7 2-7 4s3 4 7 4 7-2 7-4-3-4-7-4Z"
          fill="rgba(255,255,255,.24)"
        />
      </g>
    );
  }
  if (shapeId === 'shape-osito') {
    return (
      <g>
        <circle cx="66" cy="68" r="19" />
        <circle cx="134" cy="68" r="19" />
        <circle cx="100" cy="106" r="48" />
        <ellipse cx="100" cy="120" rx="19" ry="15" fill="rgba(255,255,255,.2)" />
        <ellipse cx="100" cy="113" rx="6" ry="4" fill="rgba(46,27,42,.16)" />
      </g>
    );
  }
  if (shapeId === 'shape-estrella') {
    return (
      <path
        d="m100 42 17 36 39 5-28 27 7 39-35-19-35 19 7-39-28-27 39-5 17-36Z"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinejoin="round"
      />
    );
  }
  if (shapeId === 'shape-luna') {
    return <path d="M125 41a64 64 0 1 0 0 123 52 52 0 1 1 0-123Z" />;
  }
  if (shapeId === 'shape-concha') {
    return (
      <g>
        <path d="M100 160C52 140 37 92 60 59c19-26 61-26 80 0 23 33 8 81-40 101Z" />
        {[0, 1, 2, 3, 4].map((index) => (
          <path
            key={index}
            d={`M100 152 L${72 + index * 14} ${72 + Math.abs(2 - index) * 9}`}
            stroke="rgba(255,255,255,.28)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        ))}
      </g>
    );
  }
  return <circle cx="100" cy="100" r="52" />;
}

export function Soap({ shapeId, colorId, size = 160, className = '' }: SoapProps) {
  const rawId = useId();
  const gradientId = `soap-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const color = COLOR_VALUES[colorId] ?? NEUTRAL_COLOR;
  const shapeName = itemName(BASE_CATALOG, shapeId);
  const colorName = itemName(BASE_CATALOG, colorId);
  const label =
    shapeName === '—'
      ? `Jabón de color ${colorName === '—' ? 'neutro' : colorName}`
      : `Jabón con molde ${shapeName} en color ${colorName === '—' ? 'neutro' : colorName}`;

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className={`soap-art ${className}`.trim()}
      style={{ filter: 'drop-shadow(0 16px 22px rgba(74, 36, 80, 0.16))', color: color.base }}
    >
      <defs>
        <linearGradient id={gradientId} x1="18%" y1="8%" x2="85%" y2="92%">
          <stop offset="0%" stopColor={color.light} />
          <stop offset="52%" stopColor={color.base} />
          <stop offset="100%" stopColor={color.dark} />
        </linearGradient>
      </defs>
      <g fill={`url(#${gradientId})`}>
        <Shape shapeId={shapeId} />
      </g>
      <ellipse
        cx="74"
        cy="63"
        rx="26"
        ry="11"
        fill="rgba(255,255,255,.34)"
        transform="rotate(-24 74 63)"
      />
      <text
        x="100"
        y="120"
        textAnchor="middle"
        fontFamily="Fraunces Variable, Georgia, serif"
        fontSize="30"
        fontWeight="600"
        fill="rgba(255,255,255,.34)"
      >
        F
      </text>
    </svg>
  );
}
