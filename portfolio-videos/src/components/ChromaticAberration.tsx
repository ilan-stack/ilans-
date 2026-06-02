import React from 'react';
import {useCurrentFrame, interpolate} from 'remotion';

// RGB channel split on transitions
export const ChromaticAberration: React.FC<{
  delay?: number;
  intensity?: number;
}> = ({delay = 0, intensity = 4}) => {
  const frame = useCurrentFrame();
  const f = frame - delay;

  const shift = interpolate(f, [0, 3, 8], [intensity, intensity * 0.6, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  if (f < 0 || shift < 0.2) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
      }}
    >
      {/* Red channel offset */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(255,0,0,0.06)',
          transform: `translateX(${shift}px)`,
        }}
      />
      {/* Cyan channel offset */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,255,255,0.06)',
          transform: `translateX(${-shift}px)`,
        }}
      />
    </div>
  );
};
