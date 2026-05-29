import { Canvas } from '@react-three/fiber';
import { Physics, RigidBody } from '@react-three/rapier';
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

    <RigidBody colliders={'hull'}>
      <mesh>
        <boxGeometry />
        <meshStandardMaterial color="pink" />
      </mesh>
    </RigidBody>
  </>
);

const App = () => (
  <Canvas gl={{ antialias: false }}>
    <Suspense fallback={null}>
      <InputRuntime />
      <PlayerController />

      <Physics debug>
        <Scene />
      </Physics>
    </Suspense>
  </Canvas>
);

export default App;
