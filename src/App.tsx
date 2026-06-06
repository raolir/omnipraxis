import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Suspense } from 'react';

import { ConvaiRuntime } from './runtime/convai/ConvaiRuntime';
import { InputRuntime } from './runtime/input/InputRuntime';
import { PlayerRuntime } from './runtime/player/PlayerRuntime';
import { SparkRuntime } from './runtime/spark/SparkRuntime';
import { CircuitBreakerScene } from './scenes/CircuitBreakerScene';

const PHYSICS_TIME_STEP = 0.01;

const App = () => (
  <Canvas gl={{ antialias: false }}>
    <SparkRuntime />
    <InputRuntime />
    <ConvaiRuntime />

    <Suspense fallback={null}>
      <Physics timeStep={PHYSICS_TIME_STEP}>
        <PlayerRuntime physicsTimeStep={PHYSICS_TIME_STEP}>
          <CircuitBreakerScene />
        </PlayerRuntime>
      </Physics>
    </Suspense>
  </Canvas>
);

export default App;
