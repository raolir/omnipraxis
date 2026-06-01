import { useGLTF } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';

import { usePlayer } from '../runtime/player/PlayerContext';
import { SplatModel } from '../runtime/spark/SplatModel';

const SCENE_ASSET_URL = `${import.meta.env.BASE_URL}scenes/circuit-breaker/`;
const SCENE_COLLIDERS_URL = `${SCENE_ASSET_URL}colliders.glb`;
const SCENE_SPLATS_URL = `${SCENE_ASSET_URL}splats-lod.rad`;

const PLAYER_SPAWN_POSITION = [0, 0, 0] as const;

export const CircuitBreakerScene = () => {
  const { spawn } = usePlayer();
  const { scene: sceneColliders } = useGLTF(SCENE_COLLIDERS_URL);

  return (
    <group>
      <color attach="background" args={['#202025']} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[-10, 10, 5]} />

      <SplatModel url={SCENE_SPLATS_URL} paged onInitialized={() => spawn(PLAYER_SPAWN_POSITION)} />

      <RigidBody type="fixed" colliders="trimesh" includeInvisible>
        <primitive object={sceneColliders} visible={false} />
      </RigidBody>
    </group>
  );
};

useGLTF.preload(SCENE_COLLIDERS_URL);
