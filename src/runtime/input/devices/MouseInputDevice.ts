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

    this.store.addOrientationDelta(
      -event.movementY * MOUSE_SENSITIVITY,
      -event.movementX * MOUSE_SENSITIVITY,
      0,
    );
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
