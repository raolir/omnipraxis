import { useConvaiClient } from '@convai/web-sdk/react';
import { create } from 'zustand';

type ConvaiClient = ReturnType<typeof useConvaiClient>;

interface ConvaiStore {
  client: ConvaiClient | null;
  setClient: (client: ConvaiClient) => void;
}

export const useConvaiStore = create<ConvaiStore>((set) => ({
  client: null,
  setClient: (client) => set({ client }),
}));
