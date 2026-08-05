import { sceneSlugs } from './sceneManifest';
import { isSceneSlug, sceneRegistry } from './sceneRegistry';

import type { SceneSlug } from './sceneManifest';
import type { SceneDefinition } from './sceneRegistry';

export type SceneRoute =
  | { type: 'index' }
  | { type: 'scene'; slug: SceneSlug; scene: SceneDefinition }
  | { type: 'not-found' };

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export const resolveSceneRoute = (pathname: string): SceneRoute => {
  if (pathname === basePath || pathname === `${basePath}/`) {
    return { type: 'index' };
  }

  const routePrefix = `${basePath}/`;

  if (!pathname.startsWith(routePrefix)) {
    return { type: 'not-found' };
  }

  const relativePath = pathname.slice(routePrefix.length);
  const encodedSlug = relativePath.endsWith('/') ? relativePath.slice(0, -1) : relativePath;

  if (!encodedSlug || encodedSlug.includes('/')) {
    return { type: 'not-found' };
  }

  try {
    const slug = decodeURIComponent(encodedSlug);

    if (isSceneSlug(slug)) {
      return { type: 'scene', slug, scene: sceneRegistry[slug] };
    }
  } catch {
    return { type: 'not-found' };
  }

  return { type: 'not-found' };
};

export const getSceneIndexEntries = () =>
  sceneSlugs.map((slug) => ({ slug, ...sceneRegistry[slug] }));

export const getRouteHref = (slug?: SceneSlug) => {
  const pathname = slug ? `${import.meta.env.BASE_URL}${slug}` : import.meta.env.BASE_URL;

  return `${pathname}${window.location.search}${window.location.hash}`;
};
