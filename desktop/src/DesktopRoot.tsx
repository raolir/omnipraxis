import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { Component, useEffect, useState } from 'react';

import { RuntimeApp } from '../../src/RuntimeApp';
import { BaseScene } from '../../src/scenes/BaseScene';

import type { ErrorInfo, ReactNode } from 'react';

type SceneAssetPaths = {
  splats: string;
  colliders: string;
};

type DesktopState =
  | { status: 'loading' }
  | { status: 'ready'; assets: SceneAssetPaths }
  | { status: 'error'; message: string };

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error || 'Unknown desktop runtime error');

const DesktopStatus = ({ title, message }: { title: string; message: string }) => (
  <main className="desktop-status-page">
    <section className="desktop-status-panel">
      <p className="desktop-status-eyebrow">Omnipraxis</p>
      <h1>{title}</h1>
      <p>{message}</p>
    </section>
  </main>
);

class DesktopErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Desktop runtime failed.', error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return <DesktopStatus title="Unable to load scene" message={this.state.error.message} />;
    }

    return this.props.children;
  }
}

export const DesktopRoot = () => {
  const [state, setState] = useState<DesktopState>({ status: 'loading' });

  useEffect(() => {
    let active = true;

    void invoke<SceneAssetPaths>('resolve_scene_assets')
      .then((paths) => {
        if (!active) {
          return;
        }

        setState({
          status: 'ready',
          assets: {
            splats: convertFileSrc(paths.splats),
            colliders: convertFileSrc(paths.colliders),
          },
        });
      })
      .catch((error: unknown) => {
        if (active) {
          setState({ status: 'error', message: toErrorMessage(error) });
        }
      });

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      setState({ status: 'error', message: toErrorMessage(event.reason) });
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      active = false;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (state.status === 'loading') {
    return <DesktopStatus title="Loading scene" message="Validating external scene assets..." />;
  }

  if (state.status === 'error') {
    return <DesktopStatus title="Unable to load scene" message={state.message} />;
  }

  return (
    <DesktopErrorBoundary>
      <RuntimeApp>
        <BaseScene splatsUrl={state.assets.splats} collidersUrl={state.assets.colliders} />
      </RuntimeApp>
    </DesktopErrorBoundary>
  );
};
