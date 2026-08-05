import { ConvaiRuntime } from './runtime/convai/ConvaiRuntime';
import { RuntimeApp } from './RuntimeApp';

import type { ComponentType } from 'react';

type AppProps = {
  Scene: ComponentType;
};

const App = ({ Scene }: AppProps) => (
  <RuntimeApp canvasRuntimes={<ConvaiRuntime />}>
    <Scene />
  </RuntimeApp>
);

export default App;
