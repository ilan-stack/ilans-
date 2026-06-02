import React from 'react';
import {useCurrentFrame, interpolate, spring, useVideoConfig, AbsoluteFill} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont();

export const TitleCard: React.FC<{
  title: string;
  subtitle: string;
  durationInFrames: number;
}> = ({title, subtitle, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const titleLetters = title.split('');

  // Accent bar slides in
  const barProgress = spring({
    frame: frame - 5,
    fps,
    config: {damping: 20, stiffness: 100},
  });

  // Subtitle fades in
  const subtitleOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Fade out near the end
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 12, durationInFrames],
    [1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadeOut,
      }}
    >
      {/* Accent bar */}
      <div
        style={{
          width: barProgress * 120,
          height: 3,
          backgroundColor: '#7c5cfc',
          marginBottom: 20,
          borderRadius: 2,
        }}
      />

      {/* Title with letter stagger */}
      <div
        style={{
          display: 'flex',
          fontFamily,
          fontSize: 52,
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: -1,
        }}
      >
        {titleLetters.map((letter, i) => {
          const p = spring({
            frame: frame - i * 2,
            fps,
            config: {damping: 15, stiffness: 120},
          });
          return (
            <span
              key={i}
              style={{
                opacity: p,
                transform: `translateY(${(1 - p) * 20}px)`,
                display: 'inline-block',
                whiteSpace: letter === ' ' ? 'pre' : undefined,
              }}
            >
              {letter}
            </span>
          );
        })}
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontFamily,
          fontSize: 16,
          fontWeight: 500,
          color: '#7c5cfc',
          opacity: subtitleOpacity,
          marginTop: 14,
          letterSpacing: 3,
          textTransform: 'uppercase',
        }}
      >
        {subtitle}
      </div>
    </AbsoluteFill>
  );
};
