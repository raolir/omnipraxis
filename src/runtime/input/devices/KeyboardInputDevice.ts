import type { InputDevice } from '../InputDevice';
import type { InputStore } from '../InputStore';

export class KeyboardInputDevice implements InputDevice {
  private store!: InputStore;

  private pressedKeys = new Set<string>();

  private appliedVelocityX = 0;

  private appliedVelocityZ = 0;

  private appliedRunContribution = 0;

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

    this.applyPositionVelocity(moveX, moveZ);
    this.applyRun(run);
  }

  private applyPositionVelocity(x: number, z: number): void {
    this.store.addPositionVelocity(x - this.appliedVelocityX, 0, z - this.appliedVelocityZ);
    this.appliedVelocityX = x;
    this.appliedVelocityZ = z;
  }

  private applyRun(run: boolean): void {
    const contribution = run ? 1 : 0;

    this.store.addRunContribution(contribution - this.appliedRunContribution);
    this.appliedRunContribution = contribution;
  }

  private clearInput = (): void => {
    this.pressedKeys.clear();
    this.applyPositionVelocity(0, 0);
    this.applyRun(false);
  };
}
