export type InputVector3 = {
  x: number;
  y: number;
  z: number;
};

type PositionInput = {
  delta: InputVector3;
  velocity: InputVector3;
};

type OrientationInput = {
  delta: InputVector3;
  velocity: InputVector3;
};

export type InputSource = {
  readonly position: PositionInput;
  readonly orientation: OrientationInput;
  readonly run: boolean;
  readonly interact: boolean;
  resolve: () => void;
  clearInteract: () => void;
  resetPositionDelta: () => void;
  resetOrientationDelta: () => void;
  reset: () => void;
};

const createVector3 = (): InputVector3 => ({ x: 0, y: 0, z: 0 });

const resetVector3 = (vector: InputVector3): void => {
  vector.x = 0;
  vector.y = 0;
  vector.z = 0;
};

export class InputStore implements InputSource {
  readonly position: PositionInput = {
    delta: createVector3(),
    velocity: createVector3(),
  };

  readonly orientation: OrientationInput = {
    delta: createVector3(),
    velocity: createVector3(),
  };

  run = false;

  interact = false;

  resolve(): void {}

  addPositionDelta(x: number, y: number, z: number): void {
    this.position.delta.x += x;
    this.position.delta.y += y;
    this.position.delta.z += z;
  }

  setPositionVelocity(x: number, y: number, z: number): void {
    this.position.velocity.x = x;
    this.position.velocity.y = y;
    this.position.velocity.z = z;
  }

  addOrientationDelta(x: number, y: number, z: number): void {
    this.orientation.delta.x += x;
    this.orientation.delta.y += y;
    this.orientation.delta.z += z;
  }

  setOrientationVelocity(x: number, y: number, z: number): void {
    this.orientation.velocity.x = x;
    this.orientation.velocity.y = y;
    this.orientation.velocity.z = z;
  }

  setRun(run: boolean): void {
    this.run = run;
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
    resetVector3(this.position.delta);
    resetVector3(this.position.velocity);
    resetVector3(this.orientation.delta);
    resetVector3(this.orientation.velocity);
    this.run = false;
    this.interact = false;
  }
}

export class CompositeInputSource implements InputSource {
  readonly position: PositionInput = {
    delta: createVector3(),
    velocity: createVector3(),
  };

  readonly orientation: OrientationInput = {
    delta: createVector3(),
    velocity: createVector3(),
  };

  run = false;

  interact = false;

  private readonly sources = new Set<InputSource>();

  constructor(sources: readonly InputSource[] = []) {
    for (const source of sources) {
      this.sources.add(source);
    }
  }

  addSource(source: InputSource): () => void {
    this.sources.add(source);

    return () => {
      this.sources.delete(source);
      this.resolve();
    };
  }

  resolve(): void {
    this.resetResolvedState();

    for (const source of this.sources) {
      source.resolve();
      this.position.delta.x += source.position.delta.x;
      this.position.delta.y += source.position.delta.y;
      this.position.delta.z += source.position.delta.z;
      this.position.velocity.x += source.position.velocity.x;
      this.position.velocity.y += source.position.velocity.y;
      this.position.velocity.z += source.position.velocity.z;
      this.orientation.delta.x += source.orientation.delta.x;
      this.orientation.delta.y += source.orientation.delta.y;
      this.orientation.delta.z += source.orientation.delta.z;
      this.orientation.velocity.x += source.orientation.velocity.x;
      this.orientation.velocity.y += source.orientation.velocity.y;
      this.orientation.velocity.z += source.orientation.velocity.z;
      this.run ||= source.run;
      this.interact ||= source.interact;
    }
  }

  clearInteract(): void {
    for (const source of this.sources) {
      source.clearInteract();
    }

    this.interact = false;
  }

  resetPositionDelta(): void {
    for (const source of this.sources) {
      source.resetPositionDelta();
    }

    resetVector3(this.position.delta);
  }

  resetOrientationDelta(): void {
    for (const source of this.sources) {
      source.resetOrientationDelta();
    }

    resetVector3(this.orientation.delta);
  }

  reset(): void {
    for (const source of this.sources) {
      source.reset();
    }

    this.resetResolvedState();
  }

  private resetResolvedState(): void {
    resetVector3(this.position.delta);
    resetVector3(this.position.velocity);
    resetVector3(this.orientation.delta);
    resetVector3(this.orientation.velocity);
    this.run = false;
    this.interact = false;
  }
}

export const userInput = new CompositeInputSource();
export const automaticInput = new CompositeInputSource();
export const inputStore = new CompositeInputSource([userInput, automaticInput]);
export const playerInteractionInput = new InputStore();

userInput.addSource(playerInteractionInput);
