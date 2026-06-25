import type { InputDevice } from '../InputDevice';
import type { InputStore } from '../InputStore';

const MOUSE_SENSITIVITY = 0.001;

export class MouseInputDevice implements InputDevice {
  private store!: InputStore;

  private element!: HTMLElement;

  private onMouseMove = (event: MouseEvent): void => {
    if (document.pointerLockElement !== this.element) {
      return;
    }

    this.store.addLook(-event.movementX * MOUSE_SENSITIVITY, -event.movementY * MOUSE_SENSITIVITY);
  };

  private onPointerDown = async (event: PointerEvent): Promise<void> => {
    if (event.pointerType !== 'mouse' || event.button !== 0) {
      return;
    }

    if (document.pointerLockElement !== this.element) {
      await this.element.requestPointerLock();
    }
  };

  initialize(store: InputStore, element: HTMLElement): void {
    this.store = store;

    this.element = element;

    window.addEventListener('mousemove', this.onMouseMove);

    this.element.addEventListener('pointerdown', this.onPointerDown);
  }

  dispose(): void {
    window.removeEventListener('mousemove', this.onMouseMove);

    this.element.removeEventListener('pointerdown', this.onPointerDown);
  }
}
