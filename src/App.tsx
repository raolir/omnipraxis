import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Suspense } from 'react';

import { ConvaiRuntime } from './runtime/convai/ConvaiRuntime';
import { InputRuntime } from './runtime/input/InputRuntime';
import { PlayerRuntime } from './runtime/player/PlayerRuntime';
import { SparkRuntime } from './runtime/spark/SparkRuntime';
import { UIRuntime } from './runtime/ui/UIRuntime';

import type { ComponentType } from 'react';

const PHYSICS_TIME_STEP = 0.01;

type AppProps = {
  Scene: ComponentType;
};

const App = ({ Scene }: AppProps) => (
  <Canvas gl={{ alpha: false, antialias: false }}>
    <SparkRuntime />
    <InputRuntime />
    <ConvaiRuntime />

    <UIRuntime>
      <Suspense fallback={null}>
        <Physics timeStep={PHYSICS_TIME_STEP}>
          <PlayerRuntime physicsTimeStep={PHYSICS_TIME_STEP}>
            <Scene />
          </PlayerRuntime>
        </Physics>
      </Suspense>
    </UIRuntime>
  </Canvas>
);

export default App;
