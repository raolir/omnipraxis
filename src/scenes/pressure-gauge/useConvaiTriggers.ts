import { useEffect, useRef } from 'react';

import type { SimulationState } from './simulation';

export const sendConvaiTrigger = (triggerName: string, message: string = '') => {
  window.dispatchEvent(new CustomEvent('convai-trigger', { detail: { triggerName, message } }));
};

export const useConvaiTriggers = (simulation: SimulationState) => {
  const lastTriggerRef = useRef<string | null>(null);

  useEffect(() => {
    if (simulation.activeValve !== null) return;

    const { stage, valves, pressureState } = simulation;
    let currentTrigger: string | null = null;

    if (!valves.montante && valves.jusante && valves.venteio) {
      currentTrigger = 'gas leaking';
    } else if (valves.montante && !valves.jusante && valves.venteio) {
      currentTrigger = 'long jet on';
    } else if (valves.montante && valves.jusante && valves.venteio) {
      currentTrigger = 'short jet on';
    } else if (!valves.montante && !valves.jusante && !valves.venteio && pressureState === 'high') {
      currentTrigger = stage === 'restoring' ? 'high pressure 4' : 'high pressure 1';
    } else if (valves.montante && !valves.jusante && !valves.venteio) {
      currentTrigger = stage === 'restoring' ? 'high pressure 3' : 'high pressure 2';
    }
    else {
      if (stage === 'removed') {
        currentTrigger = 'step 5 done';
      } else if (stage === 'collected') {
        currentTrigger = 'step 6 done';
      } 
      else if (stage === 'isolating') {
        if (!valves.montante && valves.jusante && !valves.venteio) {
          currentTrigger = 'step 1 done';
        } else if (!valves.montante && !valves.jusante && !valves.venteio && pressureState === 'low') {
          currentTrigger = 'step 2 done';
        } else if (!valves.montante && !valves.jusante && valves.venteio) {
          currentTrigger = 'step 3 done';
        }
      } 
      else if (stage === 'isolated') {
        if (!valves.montante && !valves.jusante && !valves.venteio) {
          currentTrigger = 'step 4 done';
        }
      } 
      else if (stage === 'restoring') {
        if (!valves.montante && !valves.jusante && !valves.venteio) {
          currentTrigger = 'step 7 done'; 
        } else if (!valves.montante && valves.jusante && !valves.venteio) {
          currentTrigger = 'step 8 done';
        }
      } 
      else if (stage === 'complete') {
        if (valves.montante && valves.jusante && !valves.venteio) {
          currentTrigger = 'step 9 done';
        }
      }
    }

    if (currentTrigger && currentTrigger !== lastTriggerRef.current) {
      sendConvaiTrigger(currentTrigger, `O sistema atingiu o estado da simulação referente ao gatilho: ${currentTrigger}`);
      lastTriggerRef.current = currentTrigger;
    }

  }, [simulation]);
};