import React from 'react';
import { WavyBackground as OriginalWavyBackground } from './WavyBackground';

export const StaticWavyBackground: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => {
  return (
    <OriginalWavyBackground
      className="fixed inset-0 z-0"
      containerClassName="fixed inset-0"
      colors={['#38bdf8', '#818cf8', '#c084fc', '#e879f9', '#22d3ee']}
      waveWidth={100}
      backgroundFill="#000"
      blur={10}
      speed="slow"
      waveOpacity={0.5}
    >
      {children}
    </OriginalWavyBackground>
  );
}, () => true);