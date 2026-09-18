import { ConvaiWidget, useConvaiClient } from '@convai/web-sdk/react';
import { useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import type { SyntheticEvent } from 'react';
import type { Root } from 'react-dom/client';

//const CONVAI_CHARACTER_ID = '1324ea58-5ad3-11f1-b712-42010a7be02e'; Andressa 
//const CONVAI_CHARACTER_ID = '8a1c1bb6-90f9-11f1-a4f2-42010a7be02f'; Felicity 
//const CONVAI_CHARACTER_ID = 'a0c60acb-56f3-403d-ad34-e032e5ba63d6'; // Rodrigo 2 
//const CONVAI_CHARACTER_ID = '38ed3eb3-51f5-4c7d-9964-a5ff917c93e5'; Rodrigo 
const CONVAI_CHARACTER_ID = '5bbd5c46-bb13-4a16-8e0d-2702554c7fb6'; // Rodrigo 3

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let globalConvaiClient: any = null;

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

  const timeOfDay = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  }, []);

  const convaiClient = useConvaiClient(
    apiKey
      ? {
          apiKey,
          characterId: CONVAI_CHARACTER_ID,
          startWithAudioOn: false,
          enableLipsync: true,
          blendshapeConfig: {  format: 'arkit'  }
        }
      : undefined,
  );

  useEffect(() => {
    globalConvaiClient = convaiClient;
  }, [convaiClient]);
  
  useEffect(() => {
    if (convaiClient && convaiClient.state.isConnected && isWidgetOpen && !hasStartedRef.current) {
      
      hasStartedRef.current = true; 

      convaiClient.updateTemplateKeys({
        TimeOfDay: timeOfDay,
      });

      setTimeout(() => {
        convaiClient.sendTriggerMessage('start session', 'The user just entered the simulation.');
      }, 1200);
    }
  }, [convaiClient, convaiClient?.state.isConnected, timeOfDay, isWidgetOpen]);


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
