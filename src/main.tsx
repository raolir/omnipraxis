import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { SceneRouter } from './SceneRouter.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SceneRouter />
  </StrictMode>,
);
