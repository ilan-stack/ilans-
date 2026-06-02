import React from 'react';
import {useCurrentFrame, interpolate} from 'remotion';

// Pulsing purple glow around edges
export const EdgeGlow: React.FC<{
  segmentDuration: number;
}> = ({segmentDuration}) => {
  const frame = useCurrentFrame();

  // Gentle pulse
  const pulse = Math.sin(frame * 0.08) * 0.3 + 0.7;

  // Fade in at start
  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Fade out at end
  const fadeOut = interpolate(
    frame,
    [segmentDuration - 10, segmentDuration],
    [1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        opacity: fadeIn * fadeOut * pulse * 0.5,
        boxShadow: 'inset 0 0 60px 10px rgba(124,92,252,0.25)',
        borderRadius: 2,
      }}
    />
  );
};
