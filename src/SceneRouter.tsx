import { useEffect, useState } from 'react';

import App from './App';
import { getRouteHref, getSceneIndexEntries, resolveSceneRoute } from './scenes/sceneRoute';

import type { MouseEvent } from 'react';

const shouldHandleNavigation = (event: MouseEvent<HTMLAnchorElement>) =>
  event.button === 0 &&
  !event.altKey &&
  !event.ctrlKey &&
  !event.metaKey &&
  !event.shiftKey &&
  event.currentTarget.target !== '_blank';

const SceneIndex = ({
  onNavigate,
}: {
  onNavigate: (event: MouseEvent<HTMLAnchorElement>) => void;
}) => (
  <main className="scene-route-page">
    <section className="scene-route-panel">
      <p className="scene-route-eyebrow">Omnipraxis</p>
      <h1>Choose a scene</h1>
      <nav aria-label="Scenes">
        <ul className="scene-route-list">
          {getSceneIndexEntries().map(({ slug, title }) => (
            <li key={slug}>
              <a className="scene-route-link" href={getRouteHref(slug)} onClick={onNavigate}>
                <span>{title}</span>
                <span aria-hidden>Enter</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  </main>
);

const SceneNotFound = ({
  onNavigate,
}: {
  onNavigate: (event: MouseEvent<HTMLAnchorElement>) => void;
}) => (
  <main className="scene-route-page">
    <section className="scene-route-panel">
      <p className="scene-route-eyebrow">Scene not found</p>
      <h1>This route does not match a registered scene.</h1>
      <a className="scene-route-link" href={getRouteHref()} onClick={onNavigate}>
        <span>Scene index</span>
        <span aria-hidden>Return</span>
      </a>
    </section>
  </main>
);

export const SceneRouter = () => {
  const [route, setRoute] = useState(() => resolveSceneRoute(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => {
      setRoute(resolveSceneRoute(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleNavigate = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!shouldHandleNavigation(event)) {
      return;
    }

    event.preventDefault();

    const url = new URL(event.currentTarget.href);

    window.history.pushState(null, '', `${url.pathname}${url.search}${url.hash}`);
    setRoute(resolveSceneRoute(url.pathname));
  };

  if (route.type === 'index') {
    return <SceneIndex onNavigate={handleNavigate} />;
  }

  if (route.type === 'not-found') {
    return <SceneNotFound onNavigate={handleNavigate} />;
  }

  return <App key={route.slug} Scene={route.scene.component} />;
};
