import { extend } from '@react-three/fiber';
import {
  SplatEdit as SplatEditImpl,
  SplatEditRgbaBlendMode,
  SplatEditSdf as SplatEditSdfImpl,
  SplatEditSdfType,
} from '@sparkjsdev/spark';
import { useMemo } from 'react';
import * as THREE from 'three';

import type { SplatEditOptions, SplatEditSdfOptions } from '@sparkjsdev/spark';

type Vector3Tuple = readonly [number, number, number];
type SplatEditSdfTypeName = keyof typeof sdfTypes;
type SplatEditRgbaBlendModeName = keyof typeof rgbaBlendModes;

type SplatEditProps = {
  name?: string;
  rgbaBlendMode?: SplatEditRgbaBlendModeName;
  sdfSmooth?: number;
  softEdge?: number;
  invert?: boolean;
  type?: SplatEditSdfTypeName;
  sdfInvert?: boolean;
  opacity?: number;
  color?: Vector3Tuple | string;
  displace?: Vector3Tuple;
  radius?: number;
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: number | Vector3Tuple;
};

const SparkSplatEdit = extend(SplatEditImpl);
const SparkSplatEditSdf = extend(SplatEditSdfImpl);

const sdfTypes = {
  all: SplatEditSdfType.ALL,
  plane: SplatEditSdfType.PLANE,
  sphere: SplatEditSdfType.SPHERE,
  box: SplatEditSdfType.BOX,
  ellipsoid: SplatEditSdfType.ELLIPSOID,
  cylinder: SplatEditSdfType.CYLINDER,
  capsule: SplatEditSdfType.CAPSULE,
  infiniteCone: SplatEditSdfType.INFINITE_CONE,
} as const;

const rgbaBlendModes = {
  multiply: SplatEditRgbaBlendMode.MULTIPLY,
  setRgb: SplatEditRgbaBlendMode.SET_RGB,
  addRgba: SplatEditRgbaBlendMode.ADD_RGBA,
} as const;

const toColor = (color: Vector3Tuple | string) =>
  typeof color === 'string' ? new THREE.Color(color) : new THREE.Color(...color);

export const SplatEdit = ({
  name,
  rgbaBlendMode = 'multiply',
  sdfSmooth = 0,
  softEdge = 0,
  invert = false,
  type = 'sphere',
  sdfInvert = false,
  opacity = 1,
  color = [1, 1, 1],
  displace = [0, 0, 0],
  radius = 0,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: SplatEditProps) => {
  const editArgs = useMemo<[SplatEditOptions]>(
    () => [
      {
        name,
        rgbaBlendMode: rgbaBlendModes[rgbaBlendMode],
        sdfSmooth,
        softEdge,
        invert,
      },
    ],
    [invert, name, rgbaBlendMode, sdfSmooth, softEdge],
  );

  const sdfArgs = useMemo<[SplatEditSdfOptions]>(
    () => [
      {
        type: sdfTypes[type],
        invert: sdfInvert,
        opacity,
        color: toColor(color),
        displace: new THREE.Vector3(...displace),
        radius,
      },
    ],
    [color, displace, opacity, radius, sdfInvert, type],
  );

  return (
    <SparkSplatEdit args={editArgs}>
      <SparkSplatEditSdf args={sdfArgs} position={position} rotation={rotation} scale={scale} />
    </SparkSplatEdit>
  );
};
