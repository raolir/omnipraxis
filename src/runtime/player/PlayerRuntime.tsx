import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { PlayerRuntimeContext } from './PlayerContext';
import { PlayerController } from './PlayerController';
import { inputStore } from '../input/InputStore';
import { InteractionReticle } from '../ui/InteractionReticle';

import type { PlayerRuntimeContextValue } from './PlayerContext';
import type { ReactNode } from 'react';
import type { Root } from 'react-dom/client';

type PlayerSpawnRequest = {
  position: readonly [number, number, number];
  yaw: number;
  pitch: number;
};

type PlayerRuntimeProps = {
  children?: ReactNode;
  physicsTimeStep: number;
};

type PlayerScreenOverlayProps = {
  screenTintColor: string | null;
};

const PlayerScreenOverlay = ({ screenTintColor }: PlayerScreenOverlayProps) => {
  const gl = useThree((state) => state.gl);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<Root | null>(null);

  useEffect(() => {
    const portalTarget = gl.domElement.parentElement;

    if (!portalTarget) {
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
  }, [gl]);

  useEffect(() => {
    rootRef.current?.render(
      <div className="player-screen-overlay" aria-hidden>
        {screenTintColor ? (
          <div className="player-screen-tint" style={{ background: screenTintColor }} />
        ) : null}
        <InteractionReticle />
      </div>,
    );
  }, [screenTintColor]);

  return null;
};

export const PlayerRuntime = ({ children, physicsTimeStep }: PlayerRuntimeProps) => {
  const events = useThree((state) => state.events);
  const get = useThree((state) => state.get);
  const setEvents = useThree((state) => state.setEvents);

  const [enabled, setEnabled] = useState(false);
  const [spawnRequest, setSpawnRequest] = useState<PlayerSpawnRequest | null>(null);
  const [interactionTargetId, setInteractionTargetId] = useState<string | null>(null);
  const [heldItem, setHeldItem] = useState<ReactNode | null>(null);
  const [screenTintColor, setScreenTintColor] = useState<string | null>(null);

  const interactionCallbackRef = useRef<(() => void) | null>(null);
  const wasInteractPressedRef = useRef(false);
  const screenTintRemainingRef = useRef(0);

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

  useFrame((_, delta) => {
    events.update?.();

    const interactPressed = inputStore.interact;

    if (interactPressed && !wasInteractPressedRef.current) {
      interactionCallbackRef.current?.();
    }

    wasInteractPressedRef.current = interactPressed;

    if (screenTintRemainingRef.current > 0) {
      screenTintRemainingRef.current = Math.max(0, screenTintRemainingRef.current - delta);

      if (screenTintRemainingRef.current === 0) {
        setScreenTintColor(null);
      }
    }
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

  const setScreenTint = useCallback((color: string, duration: number) => {
    if (duration <= 0) {
      screenTintRemainingRef.current = 0;
      setScreenTintColor(null);

      return;
    }

    screenTintRemainingRef.current = duration;
    setScreenTintColor(color);
  }, []);

  const contextValue = useMemo<PlayerRuntimeContextValue>(
    () => ({
      spawn,
      interactionTargetId,
      setInteractionTarget,
      clearInteractionTarget,
      clearCurrentInteractionTarget,
      setHeldItem,
      setScreenTint,
    }),
    [
      clearCurrentInteractionTarget,
      clearInteractionTarget,
      interactionTargetId,
      setInteractionTarget,
      setScreenTint,
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
      <PlayerScreenOverlay screenTintColor={screenTintColor} />
    </PlayerRuntimeContext.Provider>
  );
};
