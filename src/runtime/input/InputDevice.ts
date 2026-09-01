import type { InputStore } from './InputStore';

export interface InputDevice {
  initialize(store: InputStore, element: HTMLElement): void;

  poll?(): void;

  dispose(): void;
}
