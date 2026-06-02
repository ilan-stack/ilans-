import React from 'react';
import {useCurrentFrame, interpolate} from 'remotion';

// Floating dust particles
const PARTICLE_COUNT = 12;

// Deterministic pseudo-random based on seed
const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
};

const particles = Array.from({length: PARTICLE_COUNT}, (_, i) => ({
  x: seededRandom(i * 3 + 1) * 100,
  y: seededRandom(i * 3 + 2) * 100,
  size: 1.5 + seededRandom(i * 3 + 3) * 2.5,
  speed: 0.3 + seededRandom(i * 3 + 4) * 0.7,
  drift: (seededRandom(i * 3 + 5) - 0.5) * 0.5,
  opacity: 0.15 + seededRandom(i * 3 + 6) * 0.25,
}));

export const Particles: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {particles.map((p, i) => {
        const y = (p.y - frame * p.speed * 0.3) % 120;
        const x = p.x + Math.sin(frame * 0.03 + i) * p.drift * 15;
        const fadeIn = interpolate(frame, [0, 15], [0, 1], {
          extrapolateRight: 'clamp',
        });

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: '#7c5cfc',
              opacity: p.opacity * fadeIn,
              filter: 'blur(0.5px)',
            }}
          />
        );
      })}
    </div>
  );
};
