import type { InputDevice } from '../InputDevice';
import type { InputStore } from '../InputStore';

const JOYSTICK_RADIUS = 64;
const TOUCH_LOOK_SENSITIVITY = 0.003;

type LookPointer = {
  x: number;
  y: number;
};

export class TouchInputDevice implements InputDevice {
  private store!: InputStore;

  private element!: HTMLElement;

  private host: HTMLDivElement | null = null;

  private joystick: HTMLDivElement | null = null;

  private joystickKnob: HTMLDivElement | null = null;

  private joystickPointerId: number | null = null;

  private joystickOriginX = 0;

  private joystickOriginY = 0;

  private appliedVelocityX = 0;

  private appliedVelocityZ = 0;

  private lookPointers = new Map<number, LookPointer>();

  private onPointerDown = (event: PointerEvent): void => {
    if (event.pointerType !== 'touch') {
      return;
    }

    event.preventDefault();
    this.capturePointer(event.pointerId);

    if (this.joystickPointerId === null && this.isLowerLeftTouch(event)) {
      this.beginJoystick(event);

      return;
    }

    this.lookPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (event.pointerType !== 'touch') {
      return;
    }

    if (event.pointerId === this.joystickPointerId) {
      event.preventDefault();
      this.updateJoystick(event.clientX, event.clientY);

      return;
    }

    const lookPointer = this.lookPointers.get(event.pointerId);

    if (!lookPointer) {
      return;
    }

    event.preventDefault();

    const deltaX = event.clientX - lookPointer.x;
    const deltaY = event.clientY - lookPointer.y;

    this.store.addOrientationDelta(
      -deltaY * TOUCH_LOOK_SENSITIVITY,
      -deltaX * TOUCH_LOOK_SENSITIVITY,
      0,
    );
    lookPointer.x = event.clientX;
    lookPointer.y = event.clientY;
  };

  private onPointerEnd = (event: PointerEvent): void => {
    if (event.pointerType !== 'touch') {
      return;
    }

    event.preventDefault();
    this.releasePointer(event.pointerId);
    this.clearPointer(event.pointerId);
  };

  private onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      this.clearAllPointers();
    }
  };

  initialize(store: InputStore, element: HTMLElement): void {
    this.store = store;
    this.element = element;

    this.createHost();

    this.element.addEventListener('pointerdown', this.onPointerDown, { passive: false });
    this.element.addEventListener('pointermove', this.onPointerMove, { passive: false });
    this.element.addEventListener('pointerup', this.onPointerEnd, { passive: false });
    this.element.addEventListener('pointercancel', this.onPointerEnd, { passive: false });
    this.element.addEventListener('lostpointercapture', this.onPointerEnd, { passive: false });
    window.addEventListener('blur', this.clearAllPointers);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  dispose(): void {
    this.element.removeEventListener('pointerdown', this.onPointerDown);
    this.element.removeEventListener('pointermove', this.onPointerMove);
    this.element.removeEventListener('pointerup', this.onPointerEnd);
    this.element.removeEventListener('pointercancel', this.onPointerEnd);
    this.element.removeEventListener('lostpointercapture', this.onPointerEnd);
    window.removeEventListener('blur', this.clearAllPointers);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);

    this.clearAllPointers();
    this.host?.remove();
    this.host = null;
    this.joystick = null;
    this.joystickKnob = null;
  }

  private createHost(): void {
    const portalTarget = this.element.parentElement;

    if (!portalTarget) {
      return;
    }

    const host = document.createElement('div');

    host.className = 'touch-controls-overlay';
    portalTarget.appendChild(host);
    this.host = host;
  }

  private beginJoystick(event: PointerEvent): void {
    this.joystickPointerId = event.pointerId;
    this.joystickOriginX = event.clientX;
    this.joystickOriginY = event.clientY;

    this.showJoystick();
    this.updateJoystick(event.clientX, event.clientY);
  }

  private updateJoystick(clientX: number, clientY: number): void {
    const deltaX = clientX - this.joystickOriginX;
    const deltaY = clientY - this.joystickOriginY;
    const distance = Math.hypot(deltaX, deltaY);
    const scale = distance > JOYSTICK_RADIUS ? JOYSTICK_RADIUS / distance : 1;
    const clampedX = deltaX * scale;
    const clampedY = deltaY * scale;

    this.applyPositionVelocity(clampedX / JOYSTICK_RADIUS, clampedY / JOYSTICK_RADIUS);

    if (this.joystickKnob) {
      this.joystickKnob.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`;
    }
  }

  private showJoystick(): void {
    if (!this.host) {
      return;
    }

    const joystick = document.createElement('div');
    const knob = document.createElement('div');

    joystick.className = 'touch-joystick';
    joystick.style.left = `${this.joystickOriginX}px`;
    joystick.style.top = `${this.joystickOriginY}px`;
    knob.className = 'touch-joystick-knob';

    joystick.appendChild(knob);
    this.host.appendChild(joystick);
    this.joystick = joystick;
    this.joystickKnob = knob;
  }

  private hideJoystick(): void {
    this.joystick?.remove();
    this.joystick = null;
    this.joystickKnob = null;
  }

  private applyPositionVelocity(x: number, z: number): void {
    this.store.addPositionVelocity(x - this.appliedVelocityX, 0, z - this.appliedVelocityZ);
    this.appliedVelocityX = x;
    this.appliedVelocityZ = z;
  }

  private isLowerLeftTouch(event: PointerEvent): boolean {
    const rect = this.element.getBoundingClientRect();

    return event.clientX < rect.left + rect.width / 2 && event.clientY > rect.top + rect.height / 2;
  }

  private clearPointer(pointerId: number): void {
    if (pointerId === this.joystickPointerId) {
      this.joystickPointerId = null;
      this.applyPositionVelocity(0, 0);
      this.hideJoystick();

      return;
    }

    this.lookPointers.delete(pointerId);
  }

  private clearAllPointers = (): void => {
    this.joystickPointerId = null;
    this.lookPointers.clear();
    this.applyPositionVelocity(0, 0);
    this.hideJoystick();
  };

  private capturePointer(pointerId: number): void {
    try {
      this.element.setPointerCapture(pointerId);
    } catch {
      // Pointer capture can fail if the browser already released the pointer.
    }
  }

  private releasePointer(pointerId: number): void {
    if (!this.element.hasPointerCapture(pointerId)) {
      return;
    }

    try {
      this.element.releasePointerCapture(pointerId);
    } catch {
      // Nothing to release if the browser already cleared capture.
    }
  }
}
