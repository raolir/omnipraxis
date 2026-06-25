import type { UIOverlayButton as UIOverlayButtonConfig } from './UIContext';
import type { MouseEvent, PointerEvent } from 'react';

type OverlayButtonProps = Pick<UIOverlayButtonConfig, 'label' | 'onPress'>;

const stopButtonEvent = (
  event: MouseEvent<HTMLButtonElement> | PointerEvent<HTMLButtonElement>,
) => {
  event.preventDefault();
  event.stopPropagation();
};

const pressButton = (
  event: PointerEvent<HTMLButtonElement>,
  onPress: UIOverlayButtonConfig['onPress'],
) => {
  stopButtonEvent(event);
  onPress();
};

export const OverlayButton = ({ label, onPress }: OverlayButtonProps) => (
  <button
    className="ui-overlay-button"
    type="button"
    aria-label={label}
    onClick={stopButtonEvent}
    onPointerDown={(event) => pressButton(event, onPress)}
    onPointerUp={stopButtonEvent}
    onPointerCancel={stopButtonEvent}
  >
    {label}
  </button>
);
