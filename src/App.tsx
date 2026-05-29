import { Canvas } from '@react-three/fiber';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';

import { InputRuntime } from './runtime/input/InputRuntime';
import { PlayerController } from './runtime/player/PlayerController';

const Scene = () => (
  <>
    <color attach="background" args={['#202025']} />

    <ambientLight intensity={0.5} />
    <directionalLight position={[-10, 10, 5]} />

    <CuboidCollider position={[0, -2, 0]} args={[20, 0.5, 20]} />

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
    <InputRuntime />
    <PlayerController />

    <Physics debug>
      <Scene />
    </Physics>
  </Canvas>
);

export default App;
