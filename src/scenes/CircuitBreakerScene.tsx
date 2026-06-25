import { useEffect, useState } from 'react';

import { GltfModel } from '../runtime/assets/GltfModel';
import { usePlayer } from '../runtime/player/PlayerContext';
import { ParticleEmitter } from '../runtime/spark/ParticleEmitter';
import { SplatEdit } from '../runtime/spark/SplatEdit';
import { SplatModel } from '../runtime/spark/SplatModel';
import { useUI } from '../runtime/ui/UIContext';

const SCENE_SPLATS_URL = `${import.meta.env.BASE_URL}scenes/circuit-breaker/splats-lod.rad`;
const SCENE_COLLIDERS_URL = `${import.meta.env.BASE_URL}scenes/circuit-breaker/colliders.glb`;
const ELECTRIC_BOX_URL = `${import.meta.env.BASE_URL}assets/electric-box.glb`;
const CIRCUIT_BREAKER_URL = `${import.meta.env.BASE_URL}assets/circuit-breaker.glb`;
const CIRCUIT_BREAKER_SET_URL = `${import.meta.env.BASE_URL}assets/circuit-breaker-set.glb`;

const BOX_URL = `${import.meta.env.BASE_URL}assets/box.glb`;

const PLAYER_SPAWN_POSITION = [0, 0, 0] as const;

type RepairStatus = 'start' | 'overloaded' | 'removed' | 'collected' | 'complete';

const burntBreakerSmokeProps = {
  particleCount: 250,
  spawnRadius: [0.025, 0.02, 0.025],
  velocity: [-0.1, 0.15, -0.05],
  turbulence: 0.2,
  lifetime: 10.0,
  baseScale: [0.018, 0.018, 0.018],
  scaleGrowth: 6.0,
  opacity: [0.2, 0],
  colors: ['#3c3c3c', '#101010'],
  position: [-12.4, 1.76, 4.48],
  rotation: [0.0, 3.4, 0.0],
} as const;

const burntBreakerFlameProps = {
  particleCount: 100,
  spawnRadius: [0.08, 0.04, 0.02],
  velocity: [0.0, 0.0, 0.0],
  turbulence: 0.02,
  lifetime: 1.0,
  baseScale: [0.01, 0.01, 0.01],
  scaleGrowth: 0.6,
  opacity: [0.5, 0.2],
  colors: ['#ff7a1a', '#050505'],
  position: [-12.4, 1.73, 4.48],
  rotation: [0.0, 3.4, 0.0],
} as const;

export const CircuitBreakerScene = () => {
  const { spawn, setHeldItem } = usePlayer();
  const { showScreenFeedback } = useUI();
  const [repairStatus, setRepairStatus] = useState<RepairStatus>('start');

  const powerOutage =
    repairStatus === 'overloaded' || repairStatus === 'removed' || repairStatus === 'collected';

  const showWrongInteractionFeedback = () =>
    showScreenFeedback('rgb(255 0 0 / 0.45)', 'Wrong interaction', 'rgb(255 90 90)', 0.25);

  const showTrainingCompleteFeedback = () =>
    showScreenFeedback('rgb(0 180 80 / 0.35)', 'Training complete', 'rgb(80 255 150)', 1.5);

  useEffect(() => {
    if (repairStatus !== 'collected') {
      setHeldItem(null);

      return;
    }

    setHeldItem(
      <GltfModel
        url={CIRCUIT_BREAKER_URL}
        position={[0.0, 0.0, 0.0]}
        rotation={[0.0, 0.0, 0.0]}
        scale={0.016}
      />,
    );

    return () => {
      setHeldItem(null);
    };
  }, [repairStatus, setHeldItem]);

  return (
    <group>
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.1} />
      {powerOutage ? null : <directionalLight position={[10, 10, -5]} />}
      <SplatModel url={SCENE_SPLATS_URL} paged onInitialized={() => spawn(PLAYER_SPAWN_POSITION)}>
        {powerOutage ? <SplatEdit type="all" color={[0.1, 0.1, 0.1]} /> : null}
      </SplatModel>
      <GltfModel url={SCENE_COLLIDERS_URL} visible={false} physicality="fixed" />
      <ParticleEmitter {...burntBreakerSmokeProps} emitting={repairStatus === 'overloaded'} />
      {repairStatus === 'overloaded' ? <ParticleEmitter {...burntBreakerFlameProps} /> : null}
      <GltfModel
        url={BOX_URL}
        position={[-3.5, 1.87, -0.55]}
        rotation={[0.0, 0.2, 0.0]}
        scale={[0.4, 1.15, 0.75]}
        opacity={0}
        interaction={
          {
            start: { label: 'Turn on', action: () => setRepairStatus('overloaded') },
            overloaded: { label: 'Turn on', action: showWrongInteractionFeedback },
            removed: { label: 'Turn on', action: showWrongInteractionFeedback },
            collected: { label: 'Turn on', action: showWrongInteractionFeedback },
            complete: {
              label: 'Turn on',
              action: () => {
                showTrainingCompleteFeedback();
                setRepairStatus('start');
              },
            },
          }[repairStatus]
        }
      />
      <GltfModel
        url={BOX_URL}
        position={[0.15, 1.0, -1.76]}
        rotation={[0.0, 0.14, 0.0]}
        scale={[0.5, 0.5, 0.2]}
        opacity={0}
        interaction={
          {
            start: { label: 'Turn on', action: () => setRepairStatus('overloaded') },
            overloaded: { label: 'Turn on', action: showWrongInteractionFeedback },
            removed: { label: 'Turn on', action: showWrongInteractionFeedback },
            collected: { label: 'Turn on', action: showWrongInteractionFeedback },
            complete: {
              label: 'Turn on',
              action: () => {
                showTrainingCompleteFeedback();
                setRepairStatus('start');
              },
            },
          }[repairStatus]
        }
      />
      <GltfModel
        url={ELECTRIC_BOX_URL}
        position={[-12.26, 0.05, 4.75]}
        rotation={[0, 1.8, 0]}
        scale={1.9}
      />
      <GltfModel
        url={CIRCUIT_BREAKER_SET_URL}
        position={[-12.25, 1.9, 4.83]}
        rotation={[0.0, 0.2, 0.0]}
        scale={0.015}
      />
      <GltfModel
        url={CIRCUIT_BREAKER_URL}
        position={[-12.24, 1.68, 4.99]}
        rotation={[0.0, 3.4, 0.0]}
        scale={0.016}
        interaction={{ label: 'Remove', action: showWrongInteractionFeedback }}
      />
      <GltfModel
        url={CIRCUIT_BREAKER_URL}
        position={[-12.26, 1.68, 4.92]}
        rotation={[0.0, 3.4, 0.0]}
        scale={0.016}
        interaction={{ label: 'Remove', action: showWrongInteractionFeedback }}
      />
      <GltfModel
        url={CIRCUIT_BREAKER_URL}
        position={[-12.28, 1.68, 4.85]}
        rotation={[0.0, 3.4, 0.0]}
        scale={0.016}
        interaction={{ label: 'Remove', action: showWrongInteractionFeedback }}
      />
      <GltfModel
        url={CIRCUIT_BREAKER_URL}
        position={[-12.4, 1.73, 4.48]}
        rotation={[0.0, 3.4, 0.0]}
        scale={0.016}
        opacity={
          repairStatus == 'start' || repairStatus == 'overloaded' || repairStatus == 'complete'
            ? 1
            : 0
        }
        interaction={
          {
            start: { label: 'Remove', action: showWrongInteractionFeedback },
            overloaded: { label: 'Remove', action: () => setRepairStatus('removed') },
            removed: null,
            collected: { label: 'Install', action: () => setRepairStatus('complete') },
            complete: { label: 'Remove', action: showWrongInteractionFeedback },
          }[repairStatus]
        }
      />
      <GltfModel
        url={CIRCUIT_BREAKER_URL}
        position={[-12.42, 1.73, 4.4]}
        rotation={[0.0, 3.4, 0.0]}
        scale={0.016}
        interaction={{ label: 'Remove', action: showWrongInteractionFeedback }}
      />
      <GltfModel
        url={CIRCUIT_BREAKER_URL}
        position={[-11, 1.4, -13]}
        rotation={[0.0, 0.0, 0.0]}
        scale={0.016}
        visible={repairStatus != 'collected' && repairStatus != 'complete'}
        interaction={
          {
            start: null,
            overloaded: null,
            removed: { label: 'Pick up', action: () => setRepairStatus('collected') },
            collected: null,
            complete: null,
          }[repairStatus]
        }
      />
    </group>
  );
};
