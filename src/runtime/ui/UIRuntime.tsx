import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { InteractionReticle } from './InteractionReticle';
import { OverlayButton } from './OverlayButton';
import { UIRuntimeContext } from './UIContext';

import type { UIOverlayButton, UIRuntimeContextValue } from './UIContext';
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

const OVERLAY_BUTTON_PLACEMENTS: UIOverlayButton['placement'][] = ['reticle-bottom'];

type UIScreenOverlayProps = {
  screenFeedback: ScreenFeedback | null;
  overlayButtons: readonly UIOverlayButtonEntry[];
};

type UIOverlayButtonEntry = UIOverlayButton & {
  id: string;
};

const UIScreenOverlay = ({ screenFeedback, overlayButtons }: UIScreenOverlayProps) => {
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
        {OVERLAY_BUTTON_PLACEMENTS.map((placement) => {
          const placementButtons = overlayButtons.filter(
            (button) => button.placement === placement,
          );

          if (placementButtons.length === 0) {
            return null;
          }

          return (
            <div
              key={placement}
              className={`ui-overlay-button-stack ui-overlay-button-stack--${placement}`}
            >
              {placementButtons.map((button) => (
                <OverlayButton key={button.id} label={button.label} onPress={button.onPress} />
              ))}
            </div>
          );
        })}
      </div>,
    );
  }, [overlayButtons, screenFeedback]);

  return null;
};

export const UIRuntime = ({ children }: UIRuntimeProps) => {
  const [screenFeedback, setScreenFeedback] = useState<ScreenFeedback | null>(null);
  const [overlayButtons, setOverlayButtons] = useState<Record<string, UIOverlayButton>>({});
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

  const setOverlayButton = useCallback<UIRuntimeContextValue['setOverlayButton']>((id, button) => {
    setOverlayButtons((currentButtons) => {
      const nextButtons = { ...currentButtons };

      if (!button) {
        delete nextButtons[id];

        return nextButtons;
      }

      nextButtons[id] = button;

      return nextButtons;
    });
  }, []);

  const overlayButtonEntries = useMemo<UIOverlayButtonEntry[]>(
    () =>
      Object.entries(overlayButtons)
        .map(([id, button]) => ({ id, ...button }))
        .sort((firstButton, secondButton) => {
          const priorityDelta = (secondButton.priority ?? 0) - (firstButton.priority ?? 0);

          return priorityDelta || firstButton.id.localeCompare(secondButton.id);
        }),
    [overlayButtons],
  );

  const contextValue = useMemo<UIRuntimeContextValue>(
    () => ({ setOverlayButton, showScreenFeedback }),
    [setOverlayButton, showScreenFeedback],
  );

  return (
    <UIRuntimeContext.Provider value={contextValue}>
      {children}
      <UIScreenOverlay overlayButtons={overlayButtonEntries} screenFeedback={screenFeedback} />
    </UIRuntimeContext.Provider>
  );
};
