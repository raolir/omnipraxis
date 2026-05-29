import { PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

import { inputStore } from '../input/InputStore';

const DEFAULT_MOVE_SPEED = 4;
const DEFAULT_EYE_HEIGHT = 1.7;
const MIN_PITCH = -Math.PI / 2 + 0.01;
const MAX_PITCH = Math.PI / 2 - 0.01;

type PlayerControllerProps = {
  moveSpeed?: number;
  eyeHeight?: number;
};

export const PlayerController = ({
  moveSpeed = DEFAULT_MOVE_SPEED,
  eyeHeight = DEFAULT_EYE_HEIGHT,
}: PlayerControllerProps) => {
  const playerRootRef = useRef<THREE.Group>(null);
  const yawNodeRef = useRef<THREE.Group>(null);
  const pitchNodeRef = useRef<THREE.Group>(null);

  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const movementRef = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const playerRoot = playerRootRef.current;
    const yawNode = yawNodeRef.current;
    const pitchNode = pitchNodeRef.current;

    if (!playerRoot || !yawNode || !pitchNode) {
      return;
    }

    yawRef.current += inputStore.deltaYaw;
    pitchRef.current = THREE.MathUtils.clamp(
      pitchRef.current + inputStore.deltaPitch,
      MIN_PITCH,
      MAX_PITCH,
    );

    yawNode.rotation.y = yawRef.current;
    pitchNode.rotation.x = pitchRef.current;

    const movement = movementRef.current;

    movement.set(inputStore.moveX, 0, inputStore.moveZ);

    if (movement.lengthSq() > 1) {
      movement.normalize();
    }

    movement.applyQuaternion(yawNode.quaternion);
    playerRoot.position.addScaledVector(movement, moveSpeed * delta);

    inputStore.resetFrameDeltas();
  });

  return (
    <group ref={playerRootRef}>
      <group ref={yawNodeRef} position={[0, eyeHeight, 0]}>
        <group ref={pitchNodeRef}>
          <PerspectiveCamera makeDefault />
        </group>
      </group>
    </group>
  );
};
