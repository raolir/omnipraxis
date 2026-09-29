import { ConvaiWidget, useConvaiClient } from '@convai/web-sdk/react';
import { useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { useConvaiStore } from './useConvaiStore';

import type { SyntheticEvent } from 'react';
import type { Root } from 'react-dom/client';

//const CONVAI_CHARACTER_ID = '1324ea58-5ad3-11f1-b712-42010a7be02e'; Andressa 
//const CONVAI_CHARACTER_ID = '38ed3eb3-51f5-4c7d-9964-a5ff917c93e5'; // Rodrigo 
//const CONVAI_CHARACTER_ID = 'a0c60acb-56f3-403d-ad34-e032e5ba63d6'; // Rodrigo 2 
//const CONVAI_CHARACTER_ID = '5bbd5c46-bb13-4a16-8e0d-2702554c7fb6'; // Rodrigo 3
//const CONVAI_CHARACTER_ID = 'b876991f-868b-4d37-a3bf-c5d2ed9a3c11'; // Rodrigo 4
const CONVAI_CHARACTER_ID = '5cdce4ac-8975-499f-aa2e-14351988ee07'; // Rodrigo 5: funcionando 100%
//const CONVAI_CHARACTER_ID = '3845ee4b-2844-4237-b8dc-ca903e4cba56'; // Rodrigo 6: funcionando 100% (verificar)

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
  
  const hasStartedRef = useRef(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  
  const apiKey = useMemo(() => getConvaiApiKey(), []);
  const convaiClient = useConvaiClient(
    apiKey
      ? {
          apiKey,
          characterId: CONVAI_CHARACTER_ID,
          startWithAudioOn: false,
          enableLipsync: true,
          blendshapeConfig: {  format: 'arkit'  },
        }
      : undefined,
  );
  
  useEffect(() => {
    useConvaiStore.getState().setClient(convaiClient);
  }, [convaiClient]);
  
  useEffect(() => {
    if (convaiClient && convaiClient.state.isConnected && isWidgetOpen && !hasStartedRef.current) {
      
      hasStartedRef.current = true;       

      setTimeout(() => {
        convaiClient.sendTriggerMessage('start session');
      }, 1200);
    }
  }, [convaiClient, convaiClient?.state.isConnected, isWidgetOpen]);


  useEffect(() => {
    const handleSceneTrigger = (event: Event) => {
      const customEvent = event as CustomEvent<{ triggerName: string; message: string }>;
      
      if (convaiClient && convaiClient.state.isConnected) {
        convaiClient.sendTriggerMessage(customEvent.detail.triggerName, customEvent.detail.message);
      }
    };

    window.addEventListener('convai-trigger', handleSceneTrigger);

    return () => {
      window.removeEventListener('convai-trigger', handleSceneTrigger);
    };
  }, [convaiClient, convaiClient?.state.isConnected]);
  

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
    
    const handleWidgetInteraction = () => {
      setIsWidgetOpen(true); 
    };

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
        <div className="convai-widget-shell" onClickCapture={handleWidgetInteraction}>
          <ConvaiWidget convaiClient={convaiClient} defaultVoiceMode={false} />
        </div>
      </div>,
    );
  }, [apiKey, convaiClient]);

  return null;
};
