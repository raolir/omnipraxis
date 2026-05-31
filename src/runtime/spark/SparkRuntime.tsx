import { extend, useThree } from '@react-three/fiber';
import { SparkRenderer as SparkRendererImpl } from '@sparkjsdev/spark';
import { useMemo } from 'react';

import type { SparkRendererOptions } from '@sparkjsdev/spark';

const SparkRenderer = extend(SparkRendererImpl);

export const SparkRuntime = () => {
  const renderer = useThree((state) => state.gl);
  const sparkRendererArgs = useMemo<SparkRendererOptions>(() => ({ renderer }), [renderer]);

  return <SparkRenderer args={[sparkRendererArgs]} />;
};
