import { useFrame, useThree } from '@react-three/fiber';
import { useBeforePhysicsStep } from '@react-three/rapier';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { PlayerRuntimeContext } from './PlayerContext';
import { PlayerController } from './PlayerController';
import { inputStore } from '../input/InputStore';
import { useUI } from '../ui/UIContext';

import type { PlayerInteraction, PlayerRuntimeContextValue } from './PlayerContext';
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

type ActiveInteraction = {
  id: string;
  interaction: PlayerInteraction;
};

const PLAYER_INTERACTION_BUTTON_ID = 'player-interaction';

export const PlayerRuntime = ({ children, physicsTimeStep }: PlayerRuntimeProps) => {
  const events = useThree((state) => state.events);
  const get = useThree((state) => state.get);
  const setEvents = useThree((state) => state.setEvents);
  const { setOverlayButton } = useUI();

  const [enabled, setEnabled] = useState(false);
  const [spawnRequest, setSpawnRequest] = useState<PlayerSpawnRequest | null>(null);
  const [activeInteraction, setActiveInteraction] = useState<ActiveInteraction | null>(null);
  const [heldItem, setHeldItem] = useState<ReactNode | null>(null);

  const activeInteractionRef = useRef<ActiveInteraction | null>(null);
  const interactionTargetId = activeInteraction?.id ?? null;

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
  });

  useBeforePhysicsStep(() => {
    if (!inputStore.interact) {
      return;
    }

    inputStore.clearInteract();
    activeInteractionRef.current?.interaction.action();
  });

  const triggerInteractionInput = useCallback(() => {
    inputStore.triggerInteract();
  }, []);

  useEffect(() => {
    setOverlayButton(
      PLAYER_INTERACTION_BUTTON_ID,
      activeInteraction
        ? {
            label: activeInteraction.interaction.label,
            onPress: triggerInteractionInput,
            placement: 'reticle-bottom',
          }
        : null,
    );
  }, [activeInteraction, setOverlayButton, triggerInteractionInput]);

  useEffect(() => {
    return () => {
      setOverlayButton(PLAYER_INTERACTION_BUTTON_ID, null);
    };
  }, [setOverlayButton]);

  const spawn = useCallback((position: readonly [number, number, number], yaw = 0, pitch = 0) => {
    setEnabled(false);
    setSpawnRequest({ position, yaw, pitch });
  }, []);

  const handleSpawnApplied = useCallback(() => {
    setSpawnRequest(null);
    setEnabled(true);
  }, []);

  const setInteractionTarget = useCallback((id: string, interaction: PlayerInteraction) => {
    const currentInteraction = activeInteractionRef.current;

    if (currentInteraction?.id === id && currentInteraction.interaction === interaction) {
      return;
    }

    const nextInteraction = { id, interaction };

    activeInteractionRef.current = nextInteraction;
    setActiveInteraction(nextInteraction);
  }, []);

  const clearInteractionTarget = useCallback((id: string) => {
    if (activeInteractionRef.current?.id !== id) {
      return;
    }

    activeInteractionRef.current = null;
    setActiveInteraction(null);
  }, []);

  const clearCurrentInteractionTarget = useCallback(() => {
    activeInteractionRef.current = null;
    setActiveInteraction(null);
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
