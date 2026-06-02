import React from 'react';
import {useCurrentFrame, interpolate} from 'remotion';

// Animated light streak that sweeps across the frame
export const LightSweep: React.FC<{
  delay?: number;
  duration?: number;
}> = ({delay = 10, duration = 25}) => {
  const frame = useCurrentFrame();
  const f = frame - delay;

  const position = interpolate(f, [0, duration], [-30, 130], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const opacity = interpolate(f, [0, duration * 0.3, duration * 0.7, duration], [0, 0.25, 0.25, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  if (f < 0 || f > duration) return null;

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
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          bottom: '-20%',
          width: '15%',
          left: `${position}%`,
          background:
            'linear-gradient(90deg, transparent, rgba(124,92,252,0.3), rgba(255,255,255,0.15), rgba(124,92,252,0.3), transparent)',
          transform: 'skewX(-15deg)',
          opacity,
          filter: 'blur(8px)',
        }}
      />
    </div>
  );
};
