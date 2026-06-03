import { ConvaiWidget, useConvaiClient } from '@convai/web-sdk/react';
import { useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';

import type { SyntheticEvent } from 'react';
import type { Root } from 'react-dom/client';

const CONVAI_CHARACTER_ID = '1324ea58-5ad3-11f1-b712-42010a7be02e';

const getConvaiApiKey = () => {
  const hashParams = new URLSearchParams(window.location.hash.slice(1));

  return hashParams.get('convaiApiKey');
};

const stopWidgetEvent = (event: SyntheticEvent) => {
  event.stopPropagation();
};

export const ConvaiRuntime = () => {
  const gl = useThree((state) => state.gl);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<Root | null>(null);

  const apiKey = useMemo(() => getConvaiApiKey(), []);
  const convaiClient = useConvaiClient(
    apiKey
      ? {
          apiKey,
          characterId: CONVAI_CHARACTER_ID,
          startWithAudioOn: false,
        }
      : undefined,
  );

  useEffect(() => {
    const portalTarget = gl.domElement.parentElement;

    if (!portalTarget || !apiKey) {
      return;
    }

    const host = document.createElement('div');
    const root = createRoot(host);

    hostRef.current = host;
    rootRef.current = root;
    portalTarget.appendChild(host);

    return () => {
      root.unmount();
      host.remove();
      rootRef.current = null;
      hostRef.current = null;
    };
  }, [apiKey, gl]);

  useEffect(() => {
    if (!apiKey) {
      return;
    }

    rootRef.current?.render(
      <div
        className="convai-widget-overlay"
        onClick={stopWidgetEvent}
        onKeyDown={stopWidgetEvent}
        onKeyUp={stopWidgetEvent}
        onMouseDown={stopWidgetEvent}
        onMouseUp={stopWidgetEvent}
        onPointerDown={stopWidgetEvent}
        onPointerUp={stopWidgetEvent}
      >
        <div className="convai-widget-shell">
          <ConvaiWidget convaiClient={convaiClient} defaultVoiceMode={false} />
        </div>
      </div>,
    );
  }, [apiKey, convaiClient]);

  return null;
};
