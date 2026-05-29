import { extend } from '@react-three/fiber';
import { SparkRenderer as SparkRendererImpl, SplatMesh as SplatMeshImpl } from '@sparkjsdev/spark';

export const SparkRenderer = extend(SparkRendererImpl);
export const SplatMesh = extend(SplatMeshImpl);

export { SparkRendererImpl, SplatMeshImpl };
