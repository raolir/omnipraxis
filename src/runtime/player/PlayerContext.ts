import { createContext, useContext } from 'react';

type PlayerPosition = readonly [number, number, number];

export type PlayerRuntimeContextValue = {
  spawn: (position: PlayerPosition, yaw?: number, pitch?: number) => void;
};

export const PlayerRuntimeContext = createContext<PlayerRuntimeContextValue | null>(null);

export const usePlayer = () => {
  const player = useContext(PlayerRuntimeContext);

  if (!player) {
    throw new Error('usePlayer must be used within PlayerRuntime.');
  }

  return player;
};
