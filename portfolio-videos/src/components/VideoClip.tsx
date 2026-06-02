import React from 'react';
import {AbsoluteFill, Video, useCurrentFrame, interpolate} from 'remotion';

export const VideoClip: React.FC<{
  src: string;
  startFrom: number;
  playbackRate?: number;
  segmentDuration: number;
  zoomFrom?: number;
  zoomTo?: number;
  originX?: string;
  originY?: string;
  fit?: 'cover' | 'contain';
}> = ({
  src,
  startFrom,
  playbackRate = 1,
  segmentDuration,
  zoomFrom = 1,
  zoomTo = 1,
  originX = '50%',
  originY = '50%',
  fit = 'cover',
}) => {
  const frame = useCurrentFrame();

  const zoom = interpolate(frame, [0, segmentDuration], [zoomFrom, zoomTo], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${zoom})`,
          transformOrigin: `${originX} ${originY}`,
        }}
      >
        <Video
          src={src}
          startFrom={startFrom}
          playbackRate={playbackRate}
          style={{width: '100%', height: '100%', objectFit: fit}}
          muted
        />
      </div>
    </AbsoluteFill>
  );
};
