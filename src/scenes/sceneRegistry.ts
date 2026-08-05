import { BaseScene } from './BaseScene';
import { CircuitBreakerScene } from './CircuitBreakerScene';
import { sceneManifest } from './sceneManifest';

import type { SceneSlug } from './sceneManifest';
import type { ComponentType } from 'react';

export type SceneDefinition = {
  component: ComponentType;
  title: string;
};

export const sceneRegistry = {
  base: {
    ...sceneManifest.base,
    component: BaseScene,
  },
  'circuit-breaker': {
    ...sceneManifest['circuit-breaker'],
    component: CircuitBreakerScene,
  },
} satisfies Record<SceneSlug, SceneDefinition>;

export const isSceneSlug = (value: string): value is SceneSlug =>
  Object.hasOwn(sceneRegistry, value);
