import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Suspense } from 'react';

import { InputRuntime } from './runtime/input/InputRuntime';
import { PlayerRuntime } from './runtime/player/PlayerRuntime';
import { SparkRuntime } from './runtime/spark/SparkRuntime';
import { UIRuntime } from './runtime/ui/UIRuntime';

import type { ReactNode } from 'react';

const PHYSICS_TIME_STEP = 0.01;

type RuntimeAppProps = {
  canvasRuntimes?: ReactNode;
  children: ReactNode;
};

export const RuntimeApp = ({ canvasRuntimes, children }: RuntimeAppProps) => (
  <Canvas gl={{ alpha: false, antialias: false }}>
    <SparkRuntime />
    <InputRuntime />
    {canvasRuntimes}

    <UIRuntime>
      <Suspense fallback={null}>
        <Physics timeStep={PHYSICS_TIME_STEP}>
          <PlayerRuntime physicsTimeStep={PHYSICS_TIME_STEP}>{children}</PlayerRuntime>
        </Physics>
      </Suspense>
    </UIRuntime>
  </Canvas>
);
