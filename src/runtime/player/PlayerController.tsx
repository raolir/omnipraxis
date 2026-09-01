import { PerspectiveCamera } from '@react-three/drei';
import { CapsuleCollider, RigidBody, useBeforePhysicsStep, useRapier } from '@react-three/rapier';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

import { inputStore } from '../input/InputStore';

import type { PlayerOrientation } from './PlayerContext';
import type { RapierCollider, RapierRigidBody } from '@react-three/rapier';
import type { ReactNode } from 'react';

const DEFAULT_MOVE_SPEED = 4;
const DEFAULT_RUN_SPEED = 7;
const DEFAULT_TURN_SPEED = 2.5;
const DEFAULT_EYE_HEIGHT = 1.7;
const PLAYER_RADIUS = 0.3;
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
  runSpeed?: number;
  turnSpeed?: number;
  eyeHeight?: number;
  spawnRequest?: PlayerSpawnRequest | null;
  onSpawnApplied?: () => void;
  onOrientationChange?: (orientation: PlayerOrientation) => void;
  heldItem?: ReactNode;
  physicsTimeStep: number;
};

type PlayerSpawnRequest = {
  position: readonly [number, number, number];
  yaw: number;
  pitch: number;
};

export const PlayerController = ({
  enabled = true,
  moveSpeed = DEFAULT_MOVE_SPEED,
  runSpeed = DEFAULT_RUN_SPEED,
  turnSpeed = DEFAULT_TURN_SPEED,
  eyeHeight = DEFAULT_EYE_HEIGHT,
  spawnRequest = null,
  onSpawnApplied,
  onOrientationChange,
  heldItem,
  physicsTimeStep,
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
    onOrientationChange?.({ yaw: yawRef.current, pitch: pitchRef.current });
    rigidBody.setTranslation(translation, true);
    rigidBody.setNextKinematicTranslation(translation);
    onSpawnApplied?.();
  }, [onOrientationChange, onSpawnApplied, spawnRequest]);

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

  useBeforePhysicsStep(() => {
    if (!enabled) {
      inputStore.resetPositionDelta();
      inputStore.resetOrientationDelta();

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

    const orientationInput = inputStore.orientation;

    yawRef.current +=
      orientationInput.delta.y + orientationInput.velocity.y * turnSpeed * physicsTimeStep;
    pitchRef.current = THREE.MathUtils.clamp(
      pitchRef.current +
        orientationInput.delta.x +
        orientationInput.velocity.x * turnSpeed * physicsTimeStep,
      MIN_PITCH,
      MAX_PITCH,
    );

    yawNode.rotation.y = yawRef.current;
    pitchNode.rotation.x = pitchRef.current;
    onOrientationChange?.({ yaw: yawRef.current, pitch: pitchRef.current });
    inputStore.resetOrientationDelta();

    const horizontalMovement = horizontalMovementRef.current;
    const positionInput = inputStore.position;
    const movementSpeed = inputStore.run ? runSpeed : moveSpeed;

    horizontalMovement.set(positionInput.velocity.x, 0, positionInput.velocity.z);

    if (horizontalMovement.lengthSq() > 1) {
      horizontalMovement.normalize();
    }

    horizontalMovement
      .multiplyScalar(movementSpeed * physicsTimeStep)
      .add(positionInput.delta)
      .applyQuaternion(yawNode.quaternion);

    if (groundedRef.current) {
      verticalVelocityRef.current = 0;
    } else {
      verticalVelocityRef.current += GRAVITY * physicsTimeStep;
    }

    const desiredMovement = desiredMovementRef.current;

    desiredMovement.set(
      horizontalMovement.x,
      horizontalMovement.y + verticalVelocityRef.current * physicsTimeStep,
      horizontalMovement.z,
    );

    characterController.computeColliderMovement(collider, desiredMovement);
    inputStore.resetPositionDelta();

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
  });

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
