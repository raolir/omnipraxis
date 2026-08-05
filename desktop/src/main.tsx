import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { DesktopRoot } from './DesktopRoot';
import '../../src/index.css';
import './style.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DesktopRoot />
  </StrictMode>,
);
