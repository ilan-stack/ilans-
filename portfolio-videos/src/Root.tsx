import {Composition} from 'remotion';
import {InkForgeVideo} from './InkForge/InkForgeVideo';
import {SpriteStudioVideo} from './SpriteStudio/SpriteStudioVideo';
import {AIStudioVideo} from './AIStudio/AIStudioVideo';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="InkForge"
        component={InkForgeVideo}
        durationInFrames={300}
        fps={30}
        width={960}
        height={540}
      />
      <Composition
        id="SpriteStudio"
        component={SpriteStudioVideo}
        durationInFrames={300}
        fps={30}
        width={960}
        height={540}
      />
      <Composition
        id="AIStudio"
        component={AIStudioVideo}
        durationInFrames={300}
        fps={30}
        width={960}
        height={540}
      />
    </>
  );
};
