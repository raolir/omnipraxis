import { extend } from '@react-three/fiber';
import { SplatMesh as SplatMeshImpl } from '@sparkjsdev/spark';
import { useEffect, useMemo, useRef } from 'react';

import type { SplatMeshOptions } from '@sparkjsdev/spark';

const SplatMesh = extend(SplatMeshImpl);

type SplatModelProps = {
  url: string;
  paged?: boolean;
  onInitialized?: () => void;
};

export const SplatModel = ({ url, paged = false, onInitialized }: SplatModelProps) => {
  const splatMeshRef = useRef<SplatMeshImpl | null>(null);
  const initializedRef = useRef(false);

  const splatMeshArgs = useMemo<[SplatMeshOptions]>(() => [{ url, paged }], [paged, url]);

  useEffect(() => {
    let cancelled = false;

    const waitForSplat = async () => {
      const splatMesh = splatMeshRef.current;

      if (!splatMesh) {
        return;
      }

      await splatMesh.initialized;

      if (!cancelled && !initializedRef.current) {
        initializedRef.current = true;
        onInitialized?.();
      }
    };

    void waitForSplat();

    return () => {
      cancelled = true;
    };
  }, [onInitialized, splatMeshArgs]);

  return <SplatMesh ref={splatMeshRef} args={splatMeshArgs} />;
};
