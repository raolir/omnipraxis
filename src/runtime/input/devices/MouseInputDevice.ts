import type { InputDevice } from '../InputDevice';
import type { InputStore } from '../InputStore';

const MOUSE_SENSITIVITY = 0.002;

export class MouseInputDevice implements InputDevice {
  private store!: InputStore;

  private element!: HTMLElement;

  private onMouseMove = (event: MouseEvent): void => {
    if (document.pointerLockElement !== this.element) {
      return;
    }

    this.store.deltaYaw -= event.movementX * MOUSE_SENSITIVITY;

    this.store.deltaPitch -= event.movementY * MOUSE_SENSITIVITY;
  };

  private onClick = async (): Promise<void> => {
    if (document.pointerLockElement !== this.element) {
      await this.element.requestPointerLock();
    }
  };

  initialize(store: InputStore, element: HTMLElement): void {
    this.store = store;

    this.element = element;

    window.addEventListener('mousemove', this.onMouseMove);

    this.element.addEventListener('click', this.onClick);
  }

  dispose(): void {
    window.removeEventListener('mousemove', this.onMouseMove);

    this.element.removeEventListener('click', this.onClick);
  }
}
