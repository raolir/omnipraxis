import { useGLTF } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';

const WORLD_COLLIDER_URL = `${import.meta.env.BASE_URL}world_collider.glb`;

export const WorldCollider = () => {
  const { scene } = useGLTF(WORLD_COLLIDER_URL);

  return (
    <RigidBody type="fixed" colliders="trimesh" includeInvisible>
      <primitive object={scene} visible={false} />
    </RigidBody>
  );
};

useGLTF.preload(WORLD_COLLIDER_URL);
