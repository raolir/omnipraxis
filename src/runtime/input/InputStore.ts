export class InputStore {
  moveX = 0;
  moveZ = 0;

  deltaYaw = 0;
  deltaPitch = 0;

  interact = false;

  addMovement(x: number, z: number): void {
    this.moveX += x;
    this.moveZ += z;
  }

  addLook(deltaYaw: number, deltaPitch: number): void {
    this.deltaYaw += deltaYaw;
    this.deltaPitch += deltaPitch;
  }

  triggerInteract(): void {
    this.interact = true;
  }

  clearInteract(): void {
    this.interact = false;
  }

  resetFrameDeltas(): void {
    this.deltaYaw = 0;
    this.deltaPitch = 0;
  }
}

export const inputStore = new InputStore();
