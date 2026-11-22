import { useId } from 'react';

export type MascotMood = 'hello' | 'wink' | 'celebrate' | 'think';

interface MascotProps {
  mood?: MascotMood;
  size?: number;
}

export function Mascot({ mood = 'hello', size = 220 }: MascotProps) {
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
  const bodyId = `mascot-body-${id}`;
  const lensId = `mascot-lens-${id}`;
  const glazeId = `mascot-glaze-${id}`;

  const eyes =
    mood === 'wink' ? (
      <>
        <ellipse cx="97" cy="139" rx="5" ry="6.5" fill="#3B2338" />
        <path d="M137 139q5 5 10 0" stroke="#3B2338" strokeWidth="3" fill="none" strokeLinecap="round" />
      </>
    ) : mood === 'celebrate' ? (
      <>
        <path d="M92 140q5-6 10 0" stroke="#3B2338" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M137 140q5-6 10 0" stroke="#3B2338" strokeWidth="3" fill="none" strokeLinecap="round" />
      </>
    ) : (
      <>
        <ellipse cx="97" cy="139" rx="5" ry="6.5" fill="#3B2338" />
        <ellipse cx="143" cy="139" rx="5" ry="6.5" fill="#3B2338" />
        <circle cx="99" cy="137" r="1.6" fill="#FFF9F4" />
        <circle cx="145" cy="137" r="1.6" fill="#FFF9F4" />
      </>
    );

  const mouth =
    mood === 'celebrate' ? (
      <ellipse cx="120" cy="158" rx="9" ry="7" fill="#7E3350" />
    ) : mood === 'think' ? (
      <circle cx="121" cy="160" r="3" fill="#7E3350" />
    ) : (
      <path d="M109 156q11 10 22 0" stroke="#7E3350" strokeWidth="3" fill="none" strokeLinecap="round" />
    );

  const arms =
    mood === 'celebrate' ? (
      <>
        <path d="M57 146 34 110" stroke={`url(#${bodyId})`} strokeWidth="15" strokeLinecap="round" />
        <path d="M183 146 206 110" stroke={`url(#${bodyId})`} strokeWidth="15" strokeLinecap="round" />
        <circle cx="32" cy="105" r="8" fill="#E890A8" />
        <circle cx="208" cy="105" r="8" fill="#E890A8" />
      </>
    ) : mood === 'think' ? (
      <>
        <path d="M57 150 42 174" stroke={`url(#${bodyId})`} strokeWidth="15" strokeLinecap="round" />
        <path d="M181 148 166 169" stroke={`url(#${bodyId})`} strokeWidth="15" strokeLinecap="round" />
        <circle cx="164" cy="172" r="8" fill="#E890A8" />
      </>
    ) : (
      <>
        <path d="M57 148 34 116" stroke={`url(#${bodyId})`} strokeWidth="15" strokeLinecap="round" />
        <path d="M183 148 199 172" stroke={`url(#${bodyId})`} strokeWidth="15" strokeLinecap="round" />
        <circle cx="32" cy="111" r="8" fill="#E890A8" />
        <circle cx="201" cy="176" r="8" fill="#E890A8" />
      </>
    );

  return (
    <svg
      viewBox="0 0 240 250"
      width={size}
      height={size}
      role="img"
      aria-label="Burbuja, la mascota de FORMIX LAB"
      className="mascot-art"
    >
      <defs>
        <linearGradient id={bodyId} x1="18%" y1="8%" x2="88%" y2="94%">
          <stop offset="0%" stopColor="#F8C4D2" />
          <stop offset="52%" stopColor="#E890A8" />
          <stop offset="100%" stopColor="#C96B85" />
        </linearGradient>
        <linearGradient id={lensId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F7FBFF" stopOpacity=".95" />
          <stop offset="60%" stopColor="#D7E7F4" stopOpacity=".7" />
          <stop offset="100%" stopColor="#AFC8DD" stopOpacity=".55" />
        </linearGradient>
        <radialGradient id={glazeId} cx="32%" cy="24%" r="70%">
          <stop offset="0%" stopColor="#FFFDFB" stopOpacity=".9" />
          <stop offset="45%" stopColor="#FFFDFB" stopOpacity=".2" />
          <stop offset="100%" stopColor="#FFFDFB" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="120" cy="230" rx="64" ry="11" fill="rgba(74,36,80,.12)" />

      <g transform="rotate(-3 120 145)">
        {arms}

        <rect x="48" y="82" width="144" height="118" rx="56" fill={`url(#${bodyId})`} />
        <rect x="58" y="92" width="124" height="98" rx="47" fill={`url(#${glazeId})`} opacity=".55" />
        <path
          d="M74 190c14 11 78 11 92 0"
          stroke="rgba(255,253,251,.5)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />

        {eyes}
        {mouth}
        <circle cx="78" cy="154" r="8" fill="rgba(184,50,91,.2)" />
        <circle cx="162" cy="154" r="8" fill="rgba(184,50,91,.2)" />

        <path
          d="M63 96c4-34 26-52 57-52s53 18 57 52"
          stroke="#4A2450"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          opacity=".7"
        />
        <circle cx="91" cy="76" r="23" fill={`url(#${lensId})`} stroke="#4A2450" strokeWidth="3" />
        <circle cx="149" cy="76" r="23" fill={`url(#${lensId})`} stroke="#4A2450" strokeWidth="3" />
        <path d="M114 76h12" stroke="#4A2450" strokeWidth="3" strokeLinecap="round" />
        <path d="M78 67q6-8 14-9" stroke="#FFFDFB" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".9" />
        <path d="M136 67q6-8 14-9" stroke="#FFFDFB" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".9" />
      </g>

      <circle cx="206" cy="58" r="12" fill="rgba(255,253,251,.55)" stroke="rgba(217,108,138,.35)" />
      <circle cx="185" cy="92" r="7" fill="rgba(255,253,251,.5)" stroke="rgba(217,108,138,.3)" />
      <circle cx="35" cy="66" r="9" fill="rgba(255,253,251,.45)" stroke="rgba(217,108,138,.3)" />

      {mood === 'think' ? (
        <g>
          <circle cx="207" cy="78" r="16" fill="#FFFDFB" stroke="rgba(74,36,80,.18)" />
          <text
            x="207"
            y="84"
            textAnchor="middle"
            fontFamily="Fraunces Variable, Georgia, serif"
            fontSize="18"
            fill="#4A2450"
          >
            ?
          </text>
        </g>
      ) : null}
    </svg>
  );
}
