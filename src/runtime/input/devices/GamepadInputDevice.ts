import type { InputDevice } from '../InputDevice';
import type { InputStore } from '../InputStore';

const STICK_DEADZONE = 0.15;
const INTERACT_BUTTON_INDEX = 0;
const RUN_BUTTON_INDEX = 4;
const LEFT_STICK_X_AXIS = 0;
const LEFT_STICK_Y_AXIS = 1;
const RIGHT_STICK_X_AXIS = 2;
const RIGHT_STICK_Y_AXIS = 3;

const applyRadialDeadzone = (x: number, y: number): readonly [number, number] => {
  const magnitude = Math.hypot(x, y);

  if (magnitude <= STICK_DEADZONE) {
    return [0, 0];
  }

  const normalizedMagnitude = Math.min(1, (magnitude - STICK_DEADZONE) / (1 - STICK_DEADZONE));
  const scale = normalizedMagnitude / magnitude;

  return [x * scale, y * scale];
};

export class GamepadInputDevice implements InputDevice {
  private store: InputStore | null = null;

  private activeGamepadIndex: number | null = null;

  private interactPressed = false;

  private needsButtonBaseline = true;

  private onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      this.clearInput();
      this.needsButtonBaseline = true;
    }
  };

  initialize(store: InputStore): void {
    this.store = store;

    window.addEventListener('blur', this.onBlur);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  poll(): void {
    if (!this.store) {
      return;
    }

    if (document.visibilityState === 'hidden' || !document.hasFocus()) {
      this.clearInput();
      this.needsButtonBaseline = true;

      return;
    }

    const gamepads = navigator.getGamepads?.();

    if (!gamepads) {
      return;
    }

    const gamepad = this.selectGamepad(gamepads);

    if (!gamepad) {
      return;
    }

    const [moveX, moveZ] = applyRadialDeadzone(
      gamepad.axes[LEFT_STICK_X_AXIS] ?? 0,
      gamepad.axes[LEFT_STICK_Y_AXIS] ?? 0,
    );
    const [lookX, lookY] = applyRadialDeadzone(
      gamepad.axes[RIGHT_STICK_X_AXIS] ?? 0,
      gamepad.axes[RIGHT_STICK_Y_AXIS] ?? 0,
    );

    this.store.setPositionVelocity(moveX, 0, moveZ);
    this.store.setOrientationVelocity(-lookY, -lookX, 0);
    this.store.setRun(gamepad.buttons[RUN_BUTTON_INDEX]?.pressed ?? false);
    this.applyInteraction(gamepad.buttons[INTERACT_BUTTON_INDEX]?.pressed ?? false);
  }

  dispose(): void {
    window.removeEventListener('blur', this.onBlur);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);

    this.clearInput();
    this.activeGamepadIndex = null;
    this.store = null;
  }

  private selectGamepad(gamepads: readonly (Gamepad | null)[]): Gamepad | null {
    const activeGamepad =
      this.activeGamepadIndex === null ? null : gamepads[this.activeGamepadIndex];

    if (activeGamepad?.connected && activeGamepad.mapping === 'standard') {
      return activeGamepad;
    }

    this.clearInput();
    this.activeGamepadIndex = null;

    for (const gamepad of gamepads) {
      if (gamepad?.connected && gamepad.mapping === 'standard') {
        this.activeGamepadIndex = gamepad.index;
        this.needsButtonBaseline = true;

        return gamepad;
      }
    }

    return null;
  }

  private applyInteraction(pressed: boolean): void {
    if (this.needsButtonBaseline) {
      this.interactPressed = pressed;
      this.needsButtonBaseline = false;

      return;
    }

    if (pressed && !this.interactPressed) {
      this.store?.triggerInteract();
    }

    this.interactPressed = pressed;
  }

  private clearInput(): void {
    this.store?.setPositionVelocity(0, 0, 0);
    this.store?.setOrientationVelocity(0, 0, 0);
    this.store?.setRun(false);
    this.interactPressed = false;
  }

  private onBlur = (): void => {
    this.clearInput();
    this.needsButtonBaseline = true;
  };
}
