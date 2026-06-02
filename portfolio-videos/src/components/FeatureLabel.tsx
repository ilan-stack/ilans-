import React from 'react';
import {useCurrentFrame, spring, interpolate, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont();

export const FeatureLabel: React.FC<{
  text: string;
  position?: 'left' | 'right';
  delay?: number;
}> = ({text, position = 'right', delay = 0}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const slideIn = spring({
    frame: frame - delay,
    fps,
    config: {damping: 18, stiffness: 80},
  });

  const translateX =
    position === 'right'
      ? interpolate(slideIn, [0, 1], [80, 0])
      : interpolate(slideIn, [0, 1], [-80, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        [position]: 24,
        bottom: 36,
        transform: `translateX(${translateX}px)`,
        opacity: slideIn,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 18px',
        borderRadius: 8,
        backgroundColor: 'rgba(10, 10, 10, 0.8)',
        backdropFilter: 'blur(12px)',
        borderLeft: position === 'left' ? '3px solid #7c5cfc' : 'none',
        borderRight: position === 'right' ? '3px solid #7c5cfc' : 'none',
      }}
    >
      <span
        style={{
          fontFamily,
          fontSize: 14,
          fontWeight: 600,
          color: '#ffffff',
          letterSpacing: 0.5,
        }}
      >
        {text}
      </span>
    </div>
  );
};
