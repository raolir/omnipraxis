import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';

import { GamepadInputDevice } from './devices/GamepadInputDevice';
import { KeyboardInputDevice } from './devices/KeyboardInputDevice';
import { MouseInputDevice } from './devices/MouseInputDevice';
import { TouchInputDevice } from './devices/TouchInputDevice';
import { inputStore, InputStore, userInput } from './InputStore';

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
  const deviceInputs = useMemo(() => devices.map(() => new InputStore()), [devices]);

  useFrame(() => {
    for (const device of devices) {
      device.poll?.();
    }

    inputStore.resolve();
  }, -2);

  useEffect(() => {
    inputStore.reset();

    const removeInputs = deviceInputs.map((input) => userInput.addSource(input));

    for (const [index, device] of devices.entries()) {
      device.initialize(deviceInputs[index], gl.domElement);
    }

    return () => {
      for (const device of devices) {
        device.dispose();
      }

      for (const removeInput of removeInputs) {
        removeInput();
      }

      inputStore.reset();
    };
  }, [deviceInputs, devices, gl]);

  return null;
};
