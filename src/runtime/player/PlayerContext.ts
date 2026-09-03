import { createContext, useContext } from 'react';

import type { ReactNode } from 'react';

type PlayerPosition = readonly [number, number, number];

export type PlayerOrientation = {
  yaw: number;
  pitch: number;
};

export type PlayerInteraction = {
  label: string;
  action: () => void;
};

export type PlayerRuntimeContextValue = {
  spawn: (position: PlayerPosition, yaw?: number, pitch?: number) => void;
  idleTime: number;
  getOrientation: () => PlayerOrientation;
  interactionTargetId: string | null;
  setInteractionTarget: (id: string, interaction: PlayerInteraction) => void;
  clearInteractionTarget: (id: string) => void;
  clearCurrentInteractionTarget: () => void;
  setHeldItem: (heldItem: ReactNode | null) => void;
};

export const PlayerRuntimeContext = createContext<PlayerRuntimeContextValue | null>(null);

export const usePlayer = () => {
  const player = useContext(PlayerRuntimeContext);

  if (!player) {
    throw new Error('usePlayer must be used within PlayerRuntime.');
  }

  return player;
};
