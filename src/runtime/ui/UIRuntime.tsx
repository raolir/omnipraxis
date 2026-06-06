import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { InteractionReticle } from './InteractionReticle';
import { UIRuntimeContext } from './UIContext';

import type { UIRuntimeContextValue } from './UIContext';
import type { ReactNode } from 'react';
import type { Root } from 'react-dom/client';

type UIRuntimeProps = {
  children?: ReactNode;
};

type ScreenFeedback = {
  tintColor: string;
  message: string;
  messageColor: string;
};

type UIScreenOverlayProps = {
  screenFeedback: ScreenFeedback | null;
};

const UIScreenOverlay = ({ screenFeedback }: UIScreenOverlayProps) => {
  const gl = useThree((state) => state.gl);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<Root | null>(null);

  useEffect(() => {
    const portalTarget = gl.domElement.parentElement;

    if (!portalTarget) {
      return;
    }

    const host = document.createElement('div');
    const root = createRoot(host);

    hostRef.current = host;
    rootRef.current = root;
    portalTarget.appendChild(host);

    return () => {
      root.unmount();
      host.remove();
      rootRef.current = null;
      hostRef.current = null;
    };
  }, [gl]);

  useEffect(() => {
    rootRef.current?.render(
      <div className="ui-screen-overlay">
        {screenFeedback ? (
          <>
            <div className="ui-screen-tint" style={{ background: screenFeedback.tintColor }} />
            <div className="ui-screen-message" style={{ color: screenFeedback.messageColor }}>
              {screenFeedback.message}
            </div>
          </>
        ) : null}
        <InteractionReticle />
      </div>,
    );
  }, [screenFeedback]);

  return null;
};

export const UIRuntime = ({ children }: UIRuntimeProps) => {
  const [screenFeedback, setScreenFeedback] = useState<ScreenFeedback | null>(null);
  const screenFeedbackRemainingRef = useRef(0);

  useFrame((_, delta) => {
    if (screenFeedbackRemainingRef.current <= 0) {
      return;
    }

    screenFeedbackRemainingRef.current = Math.max(0, screenFeedbackRemainingRef.current - delta);

    if (screenFeedbackRemainingRef.current === 0) {
      setScreenFeedback(null);
    }
  });

  const showScreenFeedback = useCallback<UIRuntimeContextValue['showScreenFeedback']>(
    (tintColor, message, messageColor, duration) => {
      if (duration <= 0) {
        screenFeedbackRemainingRef.current = 0;
        setScreenFeedback(null);

        return;
      }

      screenFeedbackRemainingRef.current = duration;
      setScreenFeedback({ tintColor, message, messageColor });
    },
    [],
  );

  const contextValue = useMemo<UIRuntimeContextValue>(
    () => ({ showScreenFeedback }),
    [showScreenFeedback],
  );

  return (
    <UIRuntimeContext.Provider value={contextValue}>
      {children}
      <UIScreenOverlay screenFeedback={screenFeedback} />
    </UIRuntimeContext.Provider>
  );
};
