import type { CSSProperties } from 'react';

interface BubbleFieldProps {
  density?: 'low' | 'medium';
}

const BUBBLES = [
  { x: 4, size: 26, delay: 0, duration: 19, opacity: 0.5 },
  { x: 12, size: 44, delay: 4, duration: 24, opacity: 0.35 },
  { x: 22, size: 18, delay: 9, duration: 17, opacity: 0.45 },
  { x: 31, size: 60, delay: 2, duration: 28, opacity: 0.24 },
  { x: 42, size: 30, delay: 12, duration: 21, opacity: 0.4 },
  { x: 51, size: 22, delay: 6, duration: 18, opacity: 0.5 },
  { x: 60, size: 52, delay: 14, duration: 27, opacity: 0.28 },
  { x: 69, size: 34, delay: 3, duration: 22, opacity: 0.4 },
  { x: 78, size: 20, delay: 10, duration: 16, opacity: 0.5 },
  { x: 86, size: 48, delay: 1, duration: 25, opacity: 0.3 },
  { x: 93, size: 28, delay: 8, duration: 20, opacity: 0.45 },
  { x: 97, size: 16, delay: 15, duration: 15, opacity: 0.55 },
];

export function BubbleField({ density = 'medium' }: BubbleFieldProps) {
  const bubbles = density === 'low' ? BUBBLES.slice(0, 8) : BUBBLES;
  return (
    <div className="bubble-field" aria-hidden="true">
      {bubbles.map((bubble, index) => (
        <span
          key={index}
          className="bubble"
          style={
            {
              '--bubble-x': `${bubble.x}%`,
              '--bubble-size': `${bubble.size}px`,
              '--bubble-delay': `${bubble.delay}s`,
              '--bubble-duration': `${bubble.duration}s`,
              '--bubble-opacity': bubble.opacity,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
