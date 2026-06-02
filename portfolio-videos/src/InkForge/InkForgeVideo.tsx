import React from 'react';
import {AbsoluteFill, Sequence, staticFile} from 'remotion';
import {TitleCard} from '../components/TitleCard';
import {VideoClip} from '../components/VideoClip';
import {FeatureLabel} from '../components/FeatureLabel';
import {FadeOut} from '../components/FadeOut';
import {ScanLines} from '../components/ScanLines';
import {GlitchFlash} from '../components/GlitchFlash';
import {LightSweep} from '../components/LightSweep';
import {Particles} from '../components/Particles';
import {ChromaticAberration} from '../components/ChromaticAberration';
import {FilmGrain} from '../components/FilmGrain';
import {EdgeGlow} from '../components/EdgeGlow';
import {ScreenShake} from '../components/ScreenShake';

const SRC = staticFile('inkforge-preview.mp4');

const Vignette: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)',
      pointerEvents: 'none',
    }}
  />
);

export const InkForgeVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: '#0a0a0a'}}>
      {/* Title Card — 0 to 1.5s */}
      <Sequence from={0} durationInFrames={45}>
        <TitleCard
          title="InkForge"
          subtitle="Native macOS Drawing App"
          durationInFrames={45}
        />
        <Particles />
        <EdgeGlow segmentDuration={45} />
      </Sequence>

      {/* Drawing phase — 1.5 to 5s */}
      <Sequence from={45} durationInFrames={105}>
        <ScreenShake delay={0}>
          <VideoClip
            src={SRC}
            startFrom={60}
            playbackRate={1.7}
            segmentDuration={105}
            zoomFrom={1.2}
            zoomTo={1.35}
            originX="40%"
            originY="45%"
          />
        </ScreenShake>
        <Vignette />
        <ScanLines opacity={0.04} />
        <GlitchFlash delay={0} />
        <ChromaticAberration delay={0} intensity={5} />
        <LightSweep delay={20} duration={30} />
        <FilmGrain />
        <Particles />
        <EdgeGlow segmentDuration={105} />
        <FeatureLabel text="Freehand Drawing" position="right" delay={12} />
      </Sequence>

      {/* AI style transfer — 5 to 8.5s */}
      <Sequence from={150} durationInFrames={105}>
        <ScreenShake delay={0}>
          <VideoClip
            src={SRC}
            startFrom={420}
            playbackRate={2}
            segmentDuration={105}
            zoomFrom={1.25}
            zoomTo={1.4}
            originX="65%"
            originY="40%"
          />
        </ScreenShake>
        <Vignette />
        <ScanLines opacity={0.04} />
        <GlitchFlash delay={0} />
        <ChromaticAberration delay={0} intensity={4} />
        <LightSweep delay={25} duration={30} />
        <FilmGrain />
        <Particles />
        <EdgeGlow segmentDuration={105} />
        <FeatureLabel text="AI Style Transfer" position="left" delay={10} />
      </Sequence>

      {/* Result reveal — 8.5 to 10s */}
      <Sequence from={255} durationInFrames={45}>
        <ScreenShake delay={0}>
          <VideoClip
            src={SRC}
            startFrom={630}
            playbackRate={2}
            segmentDuration={45}
            zoomFrom={1.15}
            zoomTo={1.0}
            originX="50%"
            originY="50%"
          />
        </ScreenShake>
        <Vignette />
        <ScanLines opacity={0.04} />
        <GlitchFlash delay={0} />
        <ChromaticAberration delay={0} intensity={3} />
        <FilmGrain />
        <Particles />
        <FadeOut segmentDuration={45} fadeFrames={15} />
      </Sequence>
    </AbsoluteFill>
  );
};
