export class InputStore {
  moveX = 0;
  moveZ = 0;

  deltaYaw = 0;
  deltaPitch = 0;

  interact = false;

  resetFrameDeltas(): void {
    this.deltaYaw = 0;
    this.deltaPitch = 0;
  }
}

export const inputStore = new InputStore();
