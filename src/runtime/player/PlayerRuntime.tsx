import { useCallback, useMemo, useState } from 'react';

import { PlayerRuntimeContext } from './PlayerContext';
import { PlayerController } from './PlayerController';

import type { PlayerRuntimeContextValue } from './PlayerContext';
import type { ReactNode } from 'react';

type PlayerSpawnRequest = {
  position: readonly [number, number, number];
  yaw: number;
  pitch: number;
};

type PlayerRuntimeProps = {
  children?: ReactNode;
};

export const PlayerRuntime = ({ children }: PlayerRuntimeProps) => {
  const [enabled, setEnabled] = useState(false);
  const [spawnRequest, setSpawnRequest] = useState<PlayerSpawnRequest | null>(null);

  const spawn = useCallback((position: readonly [number, number, number], yaw = 0, pitch = 0) => {
    setEnabled(false);
    setSpawnRequest({ position, yaw, pitch });
  }, []);

  const handleSpawnApplied = useCallback(() => {
    setSpawnRequest(null);
    setEnabled(true);
  }, []);

  const contextValue = useMemo<PlayerRuntimeContextValue>(() => ({ spawn }), [spawn]);

  return (
    <PlayerRuntimeContext.Provider value={contextValue}>
      <PlayerController
        enabled={enabled}
        spawnRequest={spawnRequest}
        onSpawnApplied={handleSpawnApplied}
      />
      {children}
    </PlayerRuntimeContext.Provider>
  );
};
