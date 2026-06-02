import React from 'react';

// Subtle CRT-style scan lines overlay
export const ScanLines: React.FC<{opacity?: number}> = ({opacity = 0.06}) => (
  <div
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background:
        'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
      opacity,
      pointerEvents: 'none',
    }}
  />
);
