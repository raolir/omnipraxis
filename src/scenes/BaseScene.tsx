import { GltfModel } from '../runtime/assets/GltfModel';
import { usePlayer } from '../runtime/player/PlayerContext';
import { SplatModel } from '../runtime/spark/SplatModel';

const SCENE_SPLATS_URL = `${import.meta.env.BASE_URL}scenes/base/splats.spz`;
const SCENE_COLLIDERS_URL = `${import.meta.env.BASE_URL}scenes/base/colliders.glb`;
const PLAYER_SPAWN_POSITION = [0, 0, 0] as const;

export const BaseScene = () => {
  const { spawn } = usePlayer();

  return (
    <group>
      <SplatModel url={SCENE_SPLATS_URL} onInitialized={() => spawn(PLAYER_SPAWN_POSITION)} />
      <GltfModel url={SCENE_COLLIDERS_URL} opacity={0} physicality="fixed" />
    </group>
  );
};
