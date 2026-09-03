import type { InputDevice } from '../InputDevice';
import type { InputStore } from '../InputStore';

export class KeyboardInputDevice implements InputDevice {
  private store!: InputStore;

  private pressedKeys = new Set<string>();

  private onKeyDown = (event: KeyboardEvent): void => {
    this.pressedKeys.add(event.code);

    if (event.code === 'KeyE' && !event.repeat) {
      this.store.triggerInteract();
    }

    this.updateInput();
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    this.pressedKeys.delete(event.code);

    this.updateInput();
  };

  private onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      this.clearInput();
    }
  };

  initialize(store: InputStore): void {
    this.store = store;

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.clearInput);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.clearInput);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);

    this.clearInput();
  }

  private updateInput(): void {
    const moveX = (this.pressedKeys.has('KeyD') ? 1 : 0) - (this.pressedKeys.has('KeyA') ? 1 : 0);

    const moveZ = (this.pressedKeys.has('KeyS') ? 1 : 0) - (this.pressedKeys.has('KeyW') ? 1 : 0);

    const run = this.pressedKeys.has('ShiftLeft') || this.pressedKeys.has('ShiftRight');

    this.store.setPositionVelocity(moveX, 0, moveZ);
    this.store.setRun(run);
  }

  private clearInput = (): void => {
    this.pressedKeys.clear();
    this.store.setPositionVelocity(0, 0, 0);
    this.store.setRun(false);
  };
}
