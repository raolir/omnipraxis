import type { InputDevice } from '../InputDevice';
import type { InputStore } from '../InputStore';

export class KeyboardInputDevice implements InputDevice {
  private store!: InputStore;

  private pressedKeys = new Set<string>();

  private appliedMoveX = 0;

  private appliedMoveZ = 0;

  private onKeyDown = (event: KeyboardEvent): void => {
    this.pressedKeys.add(event.code);

    if (event.code === 'KeyE' && !event.repeat) {
      this.store.triggerInteract();
    }

    this.updateMovement();
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    this.pressedKeys.delete(event.code);

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

    this.pressedKeys.clear();
    this.applyMovement(0, 0);
  }

  private updateMovement(): void {
    const moveX = (this.pressedKeys.has('KeyD') ? 1 : 0) - (this.pressedKeys.has('KeyA') ? 1 : 0);

    const moveZ = (this.pressedKeys.has('KeyS') ? 1 : 0) - (this.pressedKeys.has('KeyW') ? 1 : 0);

    this.applyMovement(moveX, moveZ);
  }

  private applyMovement(moveX: number, moveZ: number): void {
    this.store.addMovement(moveX - this.appliedMoveX, moveZ - this.appliedMoveZ);
    this.appliedMoveX = moveX;
    this.appliedMoveZ = moveZ;
  }
}
