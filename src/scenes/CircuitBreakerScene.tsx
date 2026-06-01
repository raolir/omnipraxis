import { useGLTF } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';

import { usePlayer } from '../runtime/player/PlayerContext';
import { SplatModel } from '../runtime/spark/SplatModel';

const SCENE_ASSET_URL = `${import.meta.env.BASE_URL}scenes/circuit-breaker/`;
const SCENE_COLLIDERS_URL = `${SCENE_ASSET_URL}colliders.glb`;
const SCENE_SPLATS_URL = `${SCENE_ASSET_URL}splats-lod.rad`;
const ELECTRIC_BOX_URL = `${import.meta.env.BASE_URL}assets/electric-box.glb`;

const PLAYER_SPAWN_POSITION = [0, 0, 0] as const;

export const CircuitBreakerScene = () => {
  const { spawn } = usePlayer();
  const { scene: sceneColliders } = useGLTF(SCENE_COLLIDERS_URL);
  const { scene: electricBox } = useGLTF(ELECTRIC_BOX_URL);

  return (
    <group>
      <color attach="background" args={['#202025']} />

      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, -5]} />

      <SplatModel url={SCENE_SPLATS_URL} paged onInitialized={() => spawn(PLAYER_SPAWN_POSITION)} />

      <primitive
        object={electricBox}
        position={[-12.3, 1.55, 4.85]}
        rotation={[0, 1.8, 0]}
        scale={0.4}
      />

      <RigidBody type="fixed" colliders="trimesh" includeInvisible>
        <primitive object={sceneColliders} visible={false} />
      </RigidBody>
    </group>
  );
};

useGLTF.preload(SCENE_COLLIDERS_URL);
useGLTF.preload(ELECTRIC_BOX_URL);
