import type { InputDevice } from '../InputDevice';
import type { InputStore } from '../InputStore';

export class KeyboardInputDevice implements InputDevice {
  private store!: InputStore;

  private pressedKeys = new Set<string>();

  private onKeyDown = (event: KeyboardEvent): void => {
    this.pressedKeys.add(event.code);

    if (event.code === 'KeyE') {
      this.store.interact = true;
    }

    this.updateMovement();
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    this.pressedKeys.delete(event.code);

    if (event.code === 'KeyE') {
      this.store.interact = false;
    }

    this.updateMovement();
  };

  initialize(store: InputStore): void {
    this.store = store;

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  private updateMovement(): void {
    this.store.moveX =
      (this.pressedKeys.has('KeyD') ? 1 : 0) - (this.pressedKeys.has('KeyA') ? 1 : 0);

    this.store.moveZ =
      (this.pressedKeys.has('KeyS') ? 1 : 0) - (this.pressedKeys.has('KeyW') ? 1 : 0);
  }
}
