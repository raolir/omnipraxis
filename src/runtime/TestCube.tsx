import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

import { inputStore } from './input/InputStore';

const MOVE_SPEED = 2;

export const TestCube = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    meshRef.current.position.x += inputStore.moveX * MOVE_SPEED * delta;

    meshRef.current.position.z += inputStore.moveZ * MOVE_SPEED * delta;

    meshRef.current.rotation.y += inputStore.deltaYaw;
    meshRef.current.rotation.x += inputStore.deltaPitch;

    inputStore.resetFrameDeltas();
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry />
      <meshStandardMaterial color="blue" />
    </mesh>
  );
};
