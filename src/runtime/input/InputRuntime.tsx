import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';

import { KeyboardInputDevice } from './devices/KeyboardInputDevice';
import { MouseInputDevice } from './devices/MouseInputDevice';
import { inputStore } from './InputStore';

export const InputRuntime = () => {
  const gl = useThree((state) => state.gl);

  const devices = useMemo(() => [new KeyboardInputDevice(), new MouseInputDevice()], []);

  useEffect(() => {
    for (const device of devices) {
      device.initialize(inputStore, gl.domElement);
    }

    return () => {
      for (const device of devices) {
        device.dispose();
      }
    };
  }, [devices, gl]);

  return null;
};
