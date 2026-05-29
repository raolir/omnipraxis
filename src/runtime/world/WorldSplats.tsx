import { useThree } from '@react-three/fiber';
import { useMemo } from 'react';

import { SparkRenderer, SplatMesh } from '../spark-r3f';

import type { SparkRendererOptions, SplatMeshOptions } from '@sparkjsdev/spark';

const WORLD_SPLATS_URL = `${import.meta.env.BASE_URL}world_red.spz`;

export const WorldSplats = () => {
  const renderer = useThree((state) => state.gl);

  const sparkRendererArgs = useMemo<SparkRendererOptions>(() => ({ renderer }), [renderer]);

  const splatMeshArgs = useMemo<SplatMeshOptions>(() => ({ url: WORLD_SPLATS_URL }), []);

  return (
    <SparkRenderer args={[sparkRendererArgs]}>
      <SplatMesh args={[splatMeshArgs]} />
    </SparkRenderer>
  );
};
