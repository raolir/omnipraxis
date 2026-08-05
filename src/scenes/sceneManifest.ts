export const sceneManifest = {
  base: {
    title: 'Base Scene',
  },
  'circuit-breaker': {
    title: 'Circuit Breaker',
  },
} as const;

export type SceneSlug = keyof typeof sceneManifest;

export const sceneSlugs = Object.keys(sceneManifest) as SceneSlug[];
