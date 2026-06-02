import React from 'react';
import {useCurrentFrame, interpolate, AbsoluteFill} from 'remotion';

// Brief digital glitch + color flash at the start of a segment
export const GlitchFlash: React.FC<{
  color?: string;
  delay?: number;
}> = ({color = '#7c5cfc', delay = 0}) => {
  const frame = useCurrentFrame();
  const f = frame - delay;

  // Quick white flash (2 frames)
  const flash = interpolate(f, [0, 2, 5], [0.6, 0.3, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Color tint (slightly longer)
  const tint = interpolate(f, [1, 4, 8], [0, 0.15, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Horizontal slice displacement (glitch bars)
  const glitchIntensity = interpolate(f, [0, 3, 7], [1, 0.5, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  if (f < 0 || f > 10) return null;

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* White flash */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#ffffff',
          opacity: flash,
        }}
      />
      {/* Color tint */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: color,
          opacity: tint,
          mixBlendMode: 'screen',
        }}
      />
      {/* Glitch bars */}
      {glitchIntensity > 0.1 && (
        <>
          <div
            style={{
              position: 'absolute',
              top: '20%',
              left: 0,
              right: 0,
              height: 3,
              backgroundColor: 'rgba(124,92,252,0.4)',
              transform: `translateX(${glitchIntensity * 30}px)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '55%',
              left: 0,
              right: 0,
              height: 2,
              backgroundColor: 'rgba(124,92,252,0.3)',
              transform: `translateX(${-glitchIntensity * 20}px)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '78%',
              left: 0,
              right: 0,
              height: 4,
              backgroundColor: 'rgba(255,255,255,0.15)',
              transform: `translateX(${glitchIntensity * 15}px)`,
            }}
          />
        </>
      )}
    </AbsoluteFill>
  );
};
