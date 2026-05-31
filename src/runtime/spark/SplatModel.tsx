import { extend, useLoader } from '@react-three/fiber';
import { SplatLoader, SplatMesh as SplatMeshImpl } from '@sparkjsdev/spark';
import { forwardRef, useEffect, useMemo, useRef } from 'react';

import type { PackedSplats, SplatMeshOptions } from '@sparkjsdev/spark';

const SplatMesh = extend(SplatMeshImpl);

type SplatModelProps = {
  url: string;
};

type SplatModelsProps = {
  urls: readonly string[];
  onInitialized?: () => void;
};

export const SplatModel = forwardRef<SplatMeshImpl, SplatModelProps>(function SplatModel(
  { url },
  ref,
) {
  const packedSplats = useLoader(SplatLoader, url) as PackedSplats;

  const splatMeshArgs = useMemo<[SplatMeshOptions]>(() => [{ packedSplats }], [packedSplats]);

  return <SplatMesh ref={ref} args={splatMeshArgs} />;
});

export const SplatModels = ({ urls, onInitialized }: SplatModelsProps) => {
  const splatMeshRefs = useRef<Array<SplatMeshImpl | null>>([]);
  const initializedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const waitForSplats = async () => {
      const splatMeshes = splatMeshRefs.current.filter(
        (splatMesh): splatMesh is SplatMeshImpl => splatMesh !== null,
      );

      await Promise.all(splatMeshes.map((splatMesh) => splatMesh.initialized));

      if (!cancelled && !initializedRef.current) {
        initializedRef.current = true;
        onInitialized?.();
      }
    };

    void waitForSplats();

    return () => {
      cancelled = true;
    };
  }, [onInitialized, urls]);

  return urls.map((url, index) => (
    <SplatModel
      key={url}
      ref={(splatMesh) => {
        splatMeshRefs.current[index] = splatMesh;
      }}
      url={url}
    />
  ));
};
