import { extend } from '@react-three/fiber';
import { SplatMesh as SplatMeshImpl } from '@sparkjsdev/spark';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import type { SplatMeshOptions } from '@sparkjsdev/spark';

const SplatMesh = extend(SplatMeshImpl);

type Vector3Tuple = readonly [number, number, number];
type NumberRange = readonly [number, number];
type ColorRange = readonly [string, string];

type ParticleEmitterProps = {
  particleCount: number;
  spawnRadius: Vector3Tuple;
  velocity: Vector3Tuple;
  turbulence?: number;
  lifetime: number;
  baseScale: Vector3Tuple;
  scaleGrowth?: number;
  opacity: NumberRange;
  colors: ColorRange;
  emitting?: boolean;
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
};

const splatQuaternion = new THREE.Quaternion();

const seededRandom = (seed: number) => {
  const value = Math.sin(seed) * 43758.5453;

  return value - Math.floor(value);
};

const signedRandom = (seed: number) => seededRandom(seed) * 2 - 1;

const wrap01 = (value: number) => value - Math.floor(value);

export const ParticleEmitter = ({
  particleCount,
  spawnRadius,
  velocity,
  turbulence = 0,
  lifetime,
  baseScale,
  scaleGrowth = 0,
  opacity,
  colors,
  emitting = true,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: ParticleEmitterProps) => {
  const emittingRef = useRef(emitting);
  const stopTimeRef = useRef<number | null>(emitting ? null : 0);

  useEffect(() => {
    emittingRef.current = emitting;

    if (emitting) {
      stopTimeRef.current = null;
    }
  }, [emitting]);

  const splatMeshArgs = useMemo<[SplatMeshOptions]>(() => {
    const colorStart = new THREE.Color(colors[0]);
    const colorEnd = new THREE.Color(colors[1]);
    const center = new THREE.Vector3();
    const scales = new THREE.Vector3();
    const color = new THREE.Color();

    const updateParticle = (index: number, time: number, stopTime: number | null) => {
      const seed = index * 12.9898;
      const phaseOffset = seededRandom(seed);
      const phaseAtTime = time / lifetime + phaseOffset;
      const phase =
        stopTime === null
          ? wrap01(phaseAtTime)
          : wrap01(stopTime / lifetime + phaseOffset) + (time - stopTime) / lifetime;
      const clampedPhase = Math.min(phase, 1);
      const fade = 1 - phase;
      const colorMix =
        (Math.sin(clampedPhase * Math.PI * 2 + seededRandom(seed + 1) * Math.PI * 2) + 1) / 2;
      const radiusFade = Math.pow(Math.max(0, fade), 0.35);
      const turbulencePhase = time * 2 + seed;

      center.set(
        signedRandom(seed + 2) * spawnRadius[0] * radiusFade +
          velocity[0] * clampedPhase * lifetime +
          Math.sin(turbulencePhase) * turbulence * clampedPhase,
        signedRandom(seed + 3) * spawnRadius[1] * radiusFade +
          velocity[1] * clampedPhase * lifetime,
        signedRandom(seed + 4) * spawnRadius[2] * radiusFade +
          velocity[2] * clampedPhase * lifetime +
          Math.cos(turbulencePhase * 0.83) * turbulence * clampedPhase,
      );

      scales.set(
        baseScale[0] * (1 + scaleGrowth * clampedPhase),
        baseScale[1] * (1 + scaleGrowth * clampedPhase),
        baseScale[2] * (1 + scaleGrowth * clampedPhase),
      );

      color.copy(colorStart).lerp(colorEnd, colorMix);

      return {
        center,
        scales,
        opacity: phase >= 1 ? 0 : THREE.MathUtils.lerp(opacity[1], opacity[0], fade),
        color,
      };
    };

    return [
      {
        maxSplats: particleCount,
        constructSplats: (splats) => {
          for (let index = 0; index < particleCount; index += 1) {
            const particle = updateParticle(index, 0, null);

            splats.pushSplat(
              particle.center,
              particle.scales,
              splatQuaternion,
              particle.opacity,
              particle.color,
            );
          }
        },
        onFrame: ({ mesh, time }) => {
          if (!mesh.packedSplats) {
            return;
          }

          if (emittingRef.current) {
            stopTimeRef.current = null;
          } else {
            stopTimeRef.current ??= time;
          }

          for (let index = 0; index < particleCount; index += 1) {
            const particle = updateParticle(index, time, stopTimeRef.current);

            mesh.packedSplats.setSplat(
              index,
              particle.center,
              particle.scales,
              splatQuaternion,
              particle.opacity,
              particle.color,
            );
          }

          mesh.packedSplats.needsUpdate = true;
          mesh.needsUpdate = true;
        },
      },
    ];
  }, [
    baseScale,
    colors,
    lifetime,
    opacity,
    particleCount,
    scaleGrowth,
    spawnRadius,
    turbulence,
    velocity,
  ]);

  return <SplatMesh args={splatMeshArgs} position={position} rotation={rotation} />;
};
