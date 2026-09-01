export type InputVector3 = {
  x: number;
  y: number;
  z: number;
};

export type InputQuaternion = InputVector3 & {
  w: number;
};

type PositionInput = {
  absolute: InputVector3 | null;
  delta: InputVector3;
  velocity: InputVector3;
};

type OrientationInput = {
  absolute: InputQuaternion | null;
  delta: InputVector3;
  velocity: InputVector3;
};

const createVector3 = (): InputVector3 => ({ x: 0, y: 0, z: 0 });

const resetVector3 = (vector: InputVector3): void => {
  vector.x = 0;
  vector.y = 0;
  vector.z = 0;
};

export class InputStore {
  readonly position: PositionInput = {
    absolute: null,
    delta: createVector3(),
    velocity: createVector3(),
  };

  readonly orientation: OrientationInput = {
    absolute: null,
    delta: createVector3(),
    velocity: createVector3(),
  };

  interact = false;

  private runContributions = 0;

  get run(): boolean {
    return this.runContributions > 0;
  }

  setAbsolutePosition(position: Readonly<InputVector3> | null): void {
    this.position.absolute = position ? { ...position } : null;
  }

  addPositionDelta(x: number, y: number, z: number): void {
    this.position.delta.x += x;
    this.position.delta.y += y;
    this.position.delta.z += z;
  }

  addPositionVelocity(x: number, y: number, z: number): void {
    this.position.velocity.x += x;
    this.position.velocity.y += y;
    this.position.velocity.z += z;
  }

  setAbsoluteOrientation(orientation: Readonly<InputQuaternion> | null): void {
    this.orientation.absolute = orientation ? { ...orientation } : null;
  }

  addOrientationDelta(x: number, y: number, z: number): void {
    this.orientation.delta.x += x;
    this.orientation.delta.y += y;
    this.orientation.delta.z += z;
  }

  addOrientationVelocity(x: number, y: number, z: number): void {
    this.orientation.velocity.x += x;
    this.orientation.velocity.y += y;
    this.orientation.velocity.z += z;
  }

  addRunContribution(contribution: number): void {
    this.runContributions += contribution;
  }

  triggerInteract(): void {
    this.interact = true;
  }

  clearInteract(): void {
    this.interact = false;
  }

  resetPositionDelta(): void {
    resetVector3(this.position.delta);
  }

  resetOrientationDelta(): void {
    resetVector3(this.orientation.delta);
  }

  reset(): void {
    this.position.absolute = null;
    resetVector3(this.position.delta);
    resetVector3(this.position.velocity);
    this.orientation.absolute = null;
    resetVector3(this.orientation.delta);
    resetVector3(this.orientation.velocity);
    this.runContributions = 0;
    this.interact = false;
  }
}

export const inputStore = new InputStore();
