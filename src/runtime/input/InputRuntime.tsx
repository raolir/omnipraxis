import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';

import { GamepadInputDevice } from './devices/GamepadInputDevice';
import { KeyboardInputDevice } from './devices/KeyboardInputDevice';
import { MouseInputDevice } from './devices/MouseInputDevice';
import { TouchInputDevice } from './devices/TouchInputDevice';
import { inputStore } from './InputStore';

import type { InputDevice } from './InputDevice';

export const InputRuntime = () => {
  const gl = useThree((state) => state.gl);

  const devices = useMemo<InputDevice[]>(
    () => [
      new KeyboardInputDevice(),
      new MouseInputDevice(),
      new TouchInputDevice(),
      new GamepadInputDevice(),
    ],
    [],
  );

  useFrame(() => {
    for (const device of devices) {
      device.poll?.();
    }
  }, -2);

  useEffect(() => {
    inputStore.reset();

    for (const device of devices) {
      device.initialize(inputStore, gl.domElement);
    }

    return () => {
      for (const device of devices) {
        device.dispose();
      }

      inputStore.reset();
    };
  }, [devices, gl]);

  return null;
};
