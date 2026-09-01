import { useEffect, useMemo } from 'react';

import { automaticInput, InputStore } from './InputStore';

export const useAutomaticInput = (): InputStore => {
  const input = useMemo(() => new InputStore(), []);

  useEffect(() => {
    const removeInput = automaticInput.addSource(input);

    return () => {
      removeInput();
      input.reset();
    };
  }, [input]);

  return input;
};
