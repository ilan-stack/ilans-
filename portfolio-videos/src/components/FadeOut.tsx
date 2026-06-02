import React from 'react';
import {useCurrentFrame, interpolate} from 'remotion';

export const FadeOut: React.FC<{
  segmentDuration: number;
  fadeFrames?: number;
}> = ({segmentDuration, fadeFrames = 12}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [segmentDuration - fadeFrames, segmentDuration],
    [0, 1],
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
        backgroundColor: '#0a0a0a',
        opacity,
        pointerEvents: 'none',
      }}
    />
  );
};
