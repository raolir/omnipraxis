import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Suspense } from 'react';

import { ConvaiRuntime } from './runtime/convai/ConvaiRuntime';
import { InputRuntime } from './runtime/input/InputRuntime';
import { PlayerRuntime } from './runtime/player/PlayerRuntime';
import { SparkRuntime } from './runtime/spark/SparkRuntime';
import { CircuitBreakerScene } from './scenes/CircuitBreakerScene';

const App = () => (
  <Canvas gl={{ antialias: false }}>
    <SparkRuntime />
    <InputRuntime />
    <ConvaiRuntime />

    <Suspense fallback={null}>
      <Physics>
        <PlayerRuntime>
          <CircuitBreakerScene />
        </PlayerRuntime>
      </Physics>
    </Suspense>
  </Canvas>
);

export default App;
