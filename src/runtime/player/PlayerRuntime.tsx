import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { PlayerRuntimeContext } from './PlayerContext';
import { PlayerController } from './PlayerController';
import { inputStore } from '../input/InputStore';

import type { PlayerRuntimeContextValue } from './PlayerContext';
import type { ReactNode } from 'react';

type PlayerSpawnRequest = {
  position: readonly [number, number, number];
  yaw: number;
  pitch: number;
};

type PlayerRuntimeProps = {
  children?: ReactNode;
  physicsTimeStep: number;
};

export const PlayerRuntime = ({ children, physicsTimeStep }: PlayerRuntimeProps) => {
  const events = useThree((state) => state.events);
  const get = useThree((state) => state.get);
  const setEvents = useThree((state) => state.setEvents);

  const [enabled, setEnabled] = useState(false);
  const [spawnRequest, setSpawnRequest] = useState<PlayerSpawnRequest | null>(null);
  const [interactionTargetId, setInteractionTargetId] = useState<string | null>(null);
  const [heldItem, setHeldItem] = useState<ReactNode | null>(null);

  const interactionCallbackRef = useRef<(() => void) | null>(null);
  const wasInteractPressedRef = useRef(false);

  useEffect(() => {
    const previousCompute = get().events.compute;

    setEvents({
      compute(_event, state) {
        state.pointer.set(0, 0);
        state.raycaster.setFromCamera(state.pointer, state.camera);
      },
    });

    return () => {
      setEvents({ compute: previousCompute });
    };
  }, [get, setEvents]);

  useFrame(() => {
    events.update?.();

    const interactPressed = inputStore.interact;

    if (interactPressed && !wasInteractPressedRef.current) {
      interactionCallbackRef.current?.();
    }

    wasInteractPressedRef.current = interactPressed;
  });

  const spawn = useCallback((position: readonly [number, number, number], yaw = 0, pitch = 0) => {
    setEnabled(false);
    setSpawnRequest({ position, yaw, pitch });
  }, []);

  const handleSpawnApplied = useCallback(() => {
    setSpawnRequest(null);
    setEnabled(true);
  }, []);

  const setInteractionTarget = useCallback((id: string, callback: () => void) => {
    interactionCallbackRef.current = callback;
    setInteractionTargetId(id);
  }, []);

  const clearInteractionTarget = useCallback((id: string) => {
    setInteractionTargetId((currentTargetId) => {
      if (currentTargetId !== id) {
        return currentTargetId;
      }

      interactionCallbackRef.current = null;

      return null;
    });
  }, []);

  const clearCurrentInteractionTarget = useCallback(() => {
    interactionCallbackRef.current = null;
    setInteractionTargetId(null);
  }, []);

  const contextValue = useMemo<PlayerRuntimeContextValue>(
    () => ({
      spawn,
      interactionTargetId,
      setInteractionTarget,
      clearInteractionTarget,
      clearCurrentInteractionTarget,
      setHeldItem,
    }),
    [
      clearCurrentInteractionTarget,
      clearInteractionTarget,
      interactionTargetId,
      setInteractionTarget,
      spawn,
    ],
  );

  return (
    <PlayerRuntimeContext.Provider value={contextValue}>
      <PlayerController
        enabled={enabled}
        spawnRequest={spawnRequest}
        onSpawnApplied={handleSpawnApplied}
        heldItem={heldItem}
        physicsTimeStep={physicsTimeStep}
      />
      {children}
    </PlayerRuntimeContext.Provider>
  );
};
