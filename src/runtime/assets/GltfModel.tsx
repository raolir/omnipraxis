import { Clone, useGLTF } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import { useCallback, useEffect, useId, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';

import { usePlayer } from '../player/PlayerContext';

import type { ThreeEvent } from '@react-three/fiber';

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
  opacity?: number;
  interaction?: (() => void) | null;
  interactionDistance?: number;
  blocksInteractions?: boolean;
};

const DEFAULT_INTERACTION_DISTANCE = 1.5;
const INTERACTION_HIGHLIGHT_COLOR = '#7de7ff';
const INTERACTION_HIGHLIGHT_TINT = 0.25;
const INTERACTION_HIGHLIGHT_EMISSIVE = 0.7;
const INTERACTION_HIGHLIGHT_EMISSIVE_INTENSITY = 0.35;

type ManagedMaterial = {
  material: THREE.Material;
  color: THREE.Color | null;
  depthTest: boolean;
  depthWrite: boolean;
  emissive: THREE.Color | null;
  emissiveIntensity: number | null;
  opacity: number;
  transparent: boolean;
};

type MutableMaterial = THREE.Material & {
  color?: THREE.Color;
  emissive?: THREE.Color;
  emissiveIntensity?: number;
};

const interactionHighlightColor = new THREE.Color(INTERACTION_HIGHLIGHT_COLOR);

const toMaterialArray = (material: THREE.Material | THREE.Material[]) =>
  Array.isArray(material) ? material : [material];

const captureMaterialState = (material: THREE.Material): ManagedMaterial => {
  const mutableMaterial = material as MutableMaterial;

  return {
    material,
    color: mutableMaterial.color?.clone() ?? null,
    depthTest: material.depthTest,
    depthWrite: material.depthWrite,
    emissive: mutableMaterial.emissive?.clone() ?? null,
    emissiveIntensity: mutableMaterial.emissiveIntensity ?? null,
    opacity: material.opacity,
    transparent: material.transparent,
  };
};

const applyMaterialState = (
  managedMaterials: ManagedMaterial[],
  opacity: number,
  isInteractionTarget: boolean,
) => {
  for (const managedMaterial of managedMaterials) {
    const { material } = managedMaterial;
    const mutableMaterial = material as MutableMaterial;

    if (managedMaterial.color && mutableMaterial.color) {
      mutableMaterial.color.copy(managedMaterial.color);
    }

    if (managedMaterial.emissive && mutableMaterial.emissive) {
      mutableMaterial.emissive.copy(managedMaterial.emissive);
    }

    if (managedMaterial.emissiveIntensity !== null) {
      mutableMaterial.emissiveIntensity = managedMaterial.emissiveIntensity;
    }

    material.depthTest = managedMaterial.depthTest;

    if (isInteractionTarget) {
      if (managedMaterial.color && mutableMaterial.color) {
        mutableMaterial.color.lerp(interactionHighlightColor, INTERACTION_HIGHLIGHT_TINT);
      }

      if (mutableMaterial.emissive) {
        mutableMaterial.emissive.lerp(interactionHighlightColor, INTERACTION_HIGHLIGHT_EMISSIVE);
        mutableMaterial.emissiveIntensity = Math.max(
          managedMaterial.emissiveIntensity ?? 0,
          INTERACTION_HIGHLIGHT_EMISSIVE_INTENSITY,
        );
      }

      material.opacity = 1;
      material.transparent = false;
      material.depthWrite = true;
    } else {
      const visualOpacity = managedMaterial.opacity * opacity;

      material.opacity = visualOpacity;
      material.transparent = managedMaterial.transparent || visualOpacity < 1;
      material.depthWrite = visualOpacity >= 1 && managedMaterial.depthWrite;
    }

    material.needsUpdate = true;
  }
};

export const GltfModel = ({
  url,
  visible = true,
  physicality = null,
  colliders = 'trimesh',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  opacity = 1,
  interaction = null,
  interactionDistance = DEFAULT_INTERACTION_DISTANCE,
  blocksInteractions = true,
}: GltfModelProps) => {
  const { scene } = useGLTF(url);
  const {
    interactionTargetId,
    setInteractionTarget,
    clearInteractionTarget,
    clearCurrentInteractionTarget,
  } = usePlayer();

  const interactionId = useId();
  const modelRef = useRef<THREE.Group>(null);
  const managedMaterialsRef = useRef<ManagedMaterial[]>([]);

  const isInteractionTarget = interactionTargetId === interactionId;
  const shouldBlockWithModel = visible && blocksInteractions && !interaction;

  useLayoutEffect(() => {
    const model = modelRef.current;

    if (!model) {
      return;
    }

    const managedMaterials: ManagedMaterial[] = [];

    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) {
        return;
      }

      const sourceMaterials = toMaterialArray(object.material);
      const clonedMaterials = sourceMaterials.map((material) => material.clone());

      object.material = Array.isArray(object.material) ? clonedMaterials : clonedMaterials[0];
      managedMaterials.push(...clonedMaterials.map(captureMaterialState));
    });

    managedMaterialsRef.current = managedMaterials;

    return () => {
      for (const { material } of managedMaterials) {
        material.dispose();
      }

      managedMaterialsRef.current = [];
    };
  }, [scene]);

  useLayoutEffect(() => {
    applyMaterialState(managedMaterialsRef.current, opacity, isInteractionTarget);
  }, [isInteractionTarget, opacity, scene]);

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

  const handlePointerOver = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();

      if (!interaction) {
        return;
      }

      if (event.distance > interactionDistance) {
        clearInteractionTarget(interactionId);

        return;
      }

      setInteractionTarget(interactionId, interaction);
    },
    [clearInteractionTarget, interaction, interactionDistance, interactionId, setInteractionTarget],
  );

  const handlePointerOut = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      clearInteractionTarget(interactionId);
    },
    [clearInteractionTarget, interactionId],
  );

  const handleModelBlock = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      clearCurrentInteractionTarget();
    },
    [clearCurrentInteractionTarget],
  );

  const modelEventHandlers = interaction
    ? {
        onPointerMove: handlePointerOver,
        onPointerOut: handlePointerOut,
        onPointerOver: handlePointerOver,
      }
    : shouldBlockWithModel
      ? {
          onPointerMove: handleModelBlock,
          onPointerOver: handleModelBlock,
        }
      : undefined;

  const model = (
    <group ref={modelRef} {...modelEventHandlers}>
      <Clone object={scene} visible={visible} />
    </group>
  );

  if (!physicality) {
    return (
      <group position={position} rotation={rotation} scale={scale}>
        {model}
      </group>
    );
  }

  return (
    <RigidBody
      type={physicality}
      colliders={colliders}
      includeInvisible
      position={position}
      rotation={rotation}
      scale={scale}
    >
      {model}
    </RigidBody>
  );
};
