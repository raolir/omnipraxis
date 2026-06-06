import { createContext, useContext } from 'react';

export type UIRuntimeContextValue = {
  showScreenFeedback: (
    tintColor: string,
    message: string,
    messageColor: string,
    duration: number,
  ) => void;
};

export const UIRuntimeContext = createContext<UIRuntimeContextValue | null>(null);

export const useUI = () => {
  const ui = useContext(UIRuntimeContext);

  if (!ui) {
    throw new Error('useUI must be used within UIRuntime.');
  }

  return ui;
};
