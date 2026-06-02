import { PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CapsuleCollider, RigidBody, useRapier } from '@react-three/rapier';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

import { inputStore } from '../input/InputStore';

import type { RapierCollider, RapierRigidBody } from '@react-three/rapier';
import type { ReactNode } from 'react';

const DEFAULT_MOVE_SPEED = 4;
const DEFAULT_EYE_HEIGHT = 1.7;
const PLAYER_RADIUS = 0.35;
const PLAYER_HEIGHT = 1.8;
const CHARACTER_OFFSET = 0.01;
const GRAVITY = -9.81;
const MIN_PITCH = -Math.PI / 2 + 0.01;
const MAX_PITCH = Math.PI / 2 - 0.01;
const CAPSULE_HALF_HEIGHT = (PLAYER_HEIGHT - PLAYER_RADIUS * 2) / 2;
const CARRIED_ITEM_POSITION: [number, number, number] = [0.2, -0.1, -0.3];
const CARRIED_ITEM_ROTATION: [number, number, number] = [0, 0, 0];

type PlayerControllerProps = {
  enabled?: boolean;
  moveSpeed?: number;
  eyeHeight?: number;
  spawnRequest?: PlayerSpawnRequest | null;
  onSpawnApplied?: () => void;
  heldItem?: ReactNode;
};

type PlayerSpawnRequest = {
  position: readonly [number, number, number];
  yaw: number;
  pitch: number;
};

export const PlayerController = ({
  enabled = true,
  moveSpeed = DEFAULT_MOVE_SPEED,
  eyeHeight = DEFAULT_EYE_HEIGHT,
  spawnRequest = null,
  onSpawnApplied,
  heldItem,
}: PlayerControllerProps) => {
  const { world } = useRapier();

  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const colliderRef = useRef<RapierCollider>(null);
  const yawNodeRef = useRef<THREE.Group>(null);
  const pitchNodeRef = useRef<THREE.Group>(null);
  const characterControllerRef = useRef<ReturnType<typeof world.createCharacterController> | null>(
    null,
  );

  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const verticalVelocityRef = useRef(0);
  const groundedRef = useRef(false);
  const horizontalMovementRef = useRef(new THREE.Vector3());
  const desiredMovementRef = useRef(new THREE.Vector3());
  const nextTranslationRef = useRef(new THREE.Vector3());
  const appliedSpawnRequestRef = useRef<PlayerSpawnRequest | null>(null);

  useEffect(() => {
    if (!spawnRequest) {
      appliedSpawnRequestRef.current = null;

      return;
    }

    if (appliedSpawnRequestRef.current === spawnRequest) {
      return;
    }

    const rigidBody = rigidBodyRef.current;
    const yawNode = yawNodeRef.current;
    const pitchNode = pitchNodeRef.current;

    if (!rigidBody || !yawNode || !pitchNode) {
      return;
    }

    const { position, yaw, pitch } = spawnRequest;
    const translation = { x: position[0], y: position[1], z: position[2] };

    appliedSpawnRequestRef.current = spawnRequest;
    yawRef.current = yaw;
    pitchRef.current = THREE.MathUtils.clamp(pitch, MIN_PITCH, MAX_PITCH);
    verticalVelocityRef.current = 0;
    groundedRef.current = false;

    yawNode.rotation.y = yawRef.current;
    pitchNode.rotation.x = pitchRef.current;
    rigidBody.setTranslation(translation, true);
    rigidBody.setNextKinematicTranslation(translation);
    onSpawnApplied?.();
  }, [onSpawnApplied, spawnRequest]);

  useEffect(() => {
    const characterController = world.createCharacterController(CHARACTER_OFFSET);

    characterController.setSlideEnabled(true);
    characterController.enableAutostep(0.35, 0.2, false);
    characterController.enableSnapToGround(0.35);
    characterController.setMaxSlopeClimbAngle(Math.PI / 4);
    characterController.setMinSlopeSlideAngle(Math.PI / 4);

    characterControllerRef.current = characterController;

    return () => {
      characterControllerRef.current = null;
      world.removeCharacterController(characterController);
    };
  }, [world]);

  useFrame((_, delta) => {
    if (!enabled) {
      inputStore.resetFrameDeltas();

      return;
    }

    const rigidBody = rigidBodyRef.current;
    const collider = colliderRef.current;
    const characterController = characterControllerRef.current;
    const yawNode = yawNodeRef.current;
    const pitchNode = pitchNodeRef.current;

    if (!rigidBody || !collider || !characterController || !yawNode || !pitchNode) {
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

    const horizontalMovement = horizontalMovementRef.current;

    horizontalMovement.set(inputStore.moveX, 0, inputStore.moveZ);

    if (horizontalMovement.lengthSq() > 1) {
      horizontalMovement.normalize();
    }

    horizontalMovement.applyQuaternion(yawNode.quaternion).multiplyScalar(moveSpeed * delta);

    if (groundedRef.current) {
      verticalVelocityRef.current = 0;
    } else {
      verticalVelocityRef.current += GRAVITY * delta;
    }

    const desiredMovement = desiredMovementRef.current;

    desiredMovement.set(
      horizontalMovement.x,
      verticalVelocityRef.current * delta,
      horizontalMovement.z,
    );

    characterController.computeColliderMovement(collider, desiredMovement);

    const computedMovement = characterController.computedMovement();
    const translation = rigidBody.translation();
    const nextTranslation = nextTranslationRef.current;

    nextTranslation.set(
      translation.x + computedMovement.x,
      translation.y + computedMovement.y,
      translation.z + computedMovement.z,
    );

    rigidBody.setNextKinematicTranslation(nextTranslation);

    groundedRef.current = characterController.computedGrounded();

    if (groundedRef.current && verticalVelocityRef.current < 0) {
      verticalVelocityRef.current = 0;
    }

    inputStore.resetFrameDeltas();
  }, -1);

  return (
    <RigidBody ref={rigidBodyRef} type="kinematicPosition" colliders={false} lockRotations>
      <CapsuleCollider
        ref={colliderRef}
        args={[CAPSULE_HALF_HEIGHT, PLAYER_RADIUS]}
        position={[0, PLAYER_HEIGHT / 2, 0]}
      />
      <group ref={yawNodeRef} position={[0, eyeHeight, 0]}>
        {heldItem ? (
          <group position={CARRIED_ITEM_POSITION} rotation={CARRIED_ITEM_ROTATION}>
            {heldItem}
          </group>
        ) : null}
        <group ref={pitchNodeRef}>
          <PerspectiveCamera makeDefault />
        </group>
      </group>
    </RigidBody>
  );
};
