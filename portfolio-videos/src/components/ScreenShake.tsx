import React from 'react';
import {useCurrentFrame, interpolate, AbsoluteFill} from 'remotion';

// Brief screen shake on transition
export const ScreenShake: React.FC<{
  delay?: number;
  children: React.ReactNode;
}> = ({delay = 0, children}) => {
  const frame = useCurrentFrame();
  const f = frame - delay;

  const intensity = interpolate(f, [0, 2, 6], [3, 2, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Alternating shake pattern
  const shakeX = f > 0 ? Math.sin(f * 8) * intensity : 0;
  const shakeY = f > 0 ? Math.cos(f * 6) * intensity * 0.5 : 0;

  return (
    <AbsoluteFill
      style={{
        transform: `translate(${shakeX}px, ${shakeY}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
