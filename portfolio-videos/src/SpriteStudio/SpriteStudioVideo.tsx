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

const SRC = staticFile('spritestudio-preview.mp4');

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

export const SpriteStudioVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: '#0a0a0a'}}>
      {/* Title Card — 0 to 1.5s */}
      <Sequence from={0} durationInFrames={45}>
        <TitleCard
          title="Sprite Studio"
          subtitle="AI-Powered Sprite Tools"
          durationInFrames={45}
        />
        <Particles />
        <EdgeGlow segmentDuration={45} />
      </Sequence>

      {/* Import sprites — 1.5 to 4.5s */}
      <Sequence from={45} durationInFrames={90}>
        <ScreenShake delay={0}>
          <VideoClip
            src={SRC}
            startFrom={0}
            playbackRate={1.3}
            segmentDuration={90}
            fit="contain"
            zoomFrom={1.05}
            zoomTo={1.12}
            originX="40%"
            originY="50%"
          />
        </ScreenShake>
        <Vignette />
        <ScanLines opacity={0.04} />
        <GlitchFlash delay={0} />
        <ChromaticAberration delay={0} intensity={5} />
        <LightSweep delay={20} duration={30} />
        <FilmGrain />
        <Particles />
        <EdgeGlow segmentDuration={90} />
        <FeatureLabel text="Sprite Import" position="right" delay={15} />
      </Sequence>

      {/* Chroma key — 4.5 to 8s */}
      <Sequence from={135} durationInFrames={105}>
        <ScreenShake delay={0}>
          <VideoClip
            src={SRC}
            startFrom={300}
            playbackRate={1.5}
            segmentDuration={105}
            fit="contain"
            zoomFrom={1.08}
            zoomTo={1.15}
            originX="60%"
            originY="50%"
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
        <FeatureLabel text="AI Chroma Key" position="left" delay={12} />
      </Sequence>

      {/* Clean result — 8 to 10s */}
      <Sequence from={240} durationInFrames={60}>
        <ScreenShake delay={0}>
          <VideoClip
            src={SRC}
            startFrom={600}
            playbackRate={1.3}
            segmentDuration={60}
            fit="contain"
            zoomFrom={1.1}
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
        <FadeOut segmentDuration={60} fadeFrames={15} />
      </Sequence>
    </AbsoluteFill>
  );
};
