import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Suspense } from 'react';

import { InputRuntime } from './runtime/input/InputRuntime';
import { PlayerController } from './runtime/player/PlayerController';
import { World } from './runtime/world/World';

const Scene = () => (
  <>
    <color attach="background" args={['#202025']} />

    <ambientLight intensity={0.5} />
    <directionalLight position={[-10, 10, 5]} />

    <World />
  </>
);

const App = () => (
  <Canvas gl={{ antialias: false }}>
    <Suspense fallback={null}>
      <InputRuntime />

      <Physics debug>
        <PlayerController />
        <Scene />
      </Physics>
    </Suspense>
  </Canvas>
);

export default App;
