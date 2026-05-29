import { WorldCollider } from './WorldCollider';
import { WorldSplats } from './WorldSplats';

export const World = () => (
  <group>
    <WorldSplats />
    <WorldCollider />
  </group>
);
