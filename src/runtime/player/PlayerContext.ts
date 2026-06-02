import { createContext, useContext } from 'react';

import type { ReactNode } from 'react';

type PlayerPosition = readonly [number, number, number];

export type PlayerRuntimeContextValue = {
  spawn: (position: PlayerPosition, yaw?: number, pitch?: number) => void;
  interactionTargetId: string | null;
  setInteractionTarget: (id: string, callback: () => void) => void;
  clearInteractionTarget: (id: string) => void;
  setHeldItem: (heldItem: ReactNode | null) => void;
  setScreenTint: (color: string, duration: number) => void;
};

export const PlayerRuntimeContext = createContext<PlayerRuntimeContextValue | null>(null);

export const usePlayer = () => {
  const player = useContext(PlayerRuntimeContext);

  if (!player) {
    throw new Error('usePlayer must be used within PlayerRuntime.');
  }

  return player;
};
