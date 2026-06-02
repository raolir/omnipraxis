import { Clone, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { useCallback, useEffect, useId, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { usePlayer } from '../player/PlayerContext';

import type { ThreeEvent } from '@react-three/fiber';
import type { RapierRigidBody } from '@react-three/rapier';

type Vector3Tuple = [number, number, number];
type GltfModelPhysicality = 'fixed' | 'dynamic' | null;
type GltfModelColliders = 'trimesh' | 'hull';

type GltfModelProps = {
  url: string;
  visible?: boolean;
  physicality?: GltfModelPhysicality;
  colliders?: GltfModelColliders;
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: number | Vector3Tuple;
  interaction?: (() => void) | null;
};

const INTERACTION_HIGHLIGHT_COLOR = '#7de7ff';
const INTERACTION_BOUNDS_PADDING = 1.02;
const INTERACTION_HIGHLIGHT_OPACITY = 0.5;

export const GltfModel = ({
  url,
  visible = true,
  physicality = null,
  colliders = 'trimesh',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  interaction = null,
}: GltfModelProps) => {
  const { scene } = useGLTF(url);
  const { interactionTargetId, setInteractionTarget, clearInteractionTarget } = usePlayer();

  const interactionId = useId();
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const interactionTransformRef = useRef<THREE.Group>(null);

  const interactionBounds = useMemo(() => {
    scene.updateWorldMatrix(true, true);

    const bounds = new THREE.Box3().setFromObject(scene);

    if (bounds.isEmpty()) {
      return null;
    }

    const center = new THREE.Vector3();
    const size = new THREE.Vector3();

    bounds.getCenter(center);
    bounds.getSize(size).multiplyScalar(INTERACTION_BOUNDS_PADDING);

    return { center, size };
  }, [scene]);

  const isInteractionTarget = interactionTargetId === interactionId;
  const hasInteractionProxy = interactionBounds && (visible || interaction);

  useEffect(() => {
    if (!interaction) {
      clearInteractionTarget(interactionId);
    }
  }, [clearInteractionTarget, interaction, interactionId]);

  useEffect(() => {
    return () => {
      clearInteractionTarget(interactionId);
    };
  }, [clearInteractionTarget, interactionId]);

  useEffect(() => {
    if (isInteractionTarget && interaction) {
      setInteractionTarget(interactionId, interaction);
    }
  }, [interaction, interactionId, isInteractionTarget, setInteractionTarget]);

  useFrame(() => {
    if (physicality !== 'dynamic') {
      return;
    }

    const rigidBody = rigidBodyRef.current;
    const interactionTransform = interactionTransformRef.current;

    if (!rigidBody || !interactionTransform) {
      return;
    }

    const translation = rigidBody.translation();
    const rotation = rigidBody.rotation();

    interactionTransform.position.set(translation.x, translation.y, translation.z);
    interactionTransform.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
  });

  const handlePointerOver = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();

      if (!interaction) {
        return;
      }

      setInteractionTarget(interactionId, interaction);
    },
    [interaction, interactionId, setInteractionTarget],
  );

  const handlePointerOut = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      clearInteractionTarget(interactionId);
    },
    [clearInteractionTarget, interactionId],
  );

  const interactionProxy = hasInteractionProxy ? (
    <group onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
      <mesh position={interactionBounds.center} scale={interactionBounds.size}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {isInteractionTarget ? (
        <mesh
          position={interactionBounds.center}
          scale={interactionBounds.size}
          raycast={() => undefined}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial
            color={INTERACTION_HIGHLIGHT_COLOR}
            transparent
            opacity={INTERACTION_HIGHLIGHT_OPACITY}
            depthWrite={false}
          />
        </mesh>
      ) : null}
    </group>
  ) : null;

  if (!physicality) {
    return (
      <group position={position} rotation={rotation} scale={scale}>
        <Clone object={scene} visible={visible} />
        {interactionProxy}
      </group>
    );
  }

  return (
    <>
      <RigidBody
        ref={rigidBodyRef}
        type={physicality}
        colliders={colliders}
        includeInvisible
        position={position}
        rotation={rotation}
        scale={scale}
      >
        <Clone object={scene} visible={visible} />
      </RigidBody>

      {interactionProxy ? (
        <group ref={interactionTransformRef} position={position} rotation={rotation} scale={scale}>
          {interactionProxy}
        </group>
      ) : null}
    </>
  );
};
