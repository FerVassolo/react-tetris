import React from 'react';
import DetectShift from '../modules/detect-shift';
import { Action } from '../models/Game';

export type KeyboardMap = Record<string, Action>;
type KeyboardDispatch = Record<string, () => void>;

type HotkeysFn = (keys: string, callback: (event: KeyboardEvent, handler: unknown) => void) => void;
type Hotkeys = HotkeysFn & {
  unbind: (keys: string) => void;
};

export const useKeyboardControls = (
  keyboardMap: KeyboardMap,
  dispatch: React.Dispatch<Action>
): void => {
  React.useEffect(() => {
    let hotkeys: Hotkeys | undefined;
    let removeKeyboardEvents: ((keyboardMap: KeyboardDispatch) => void) | undefined;

    import('hotkeys-js').then((hotkeysModule) => {
      hotkeys = hotkeysModule.default;

      const keyboardDispatch = Object.entries(keyboardMap).reduce<KeyboardDispatch>(
        (output, [key, action]) => {
          output[key] = () => dispatch(action);
          return output;
        },
        {}
      );

      addKeyboardEvents(keyboardDispatch, hotkeys);

      removeKeyboardEvents = (keyboardMap) => {
        Object.keys(keyboardMap).forEach((k) => {
          if (k === 'shift') {
            const fn = keyboardMap[k];
            fn && DetectShift.unbind(fn);
          } else {
            hotkeys?.unbind(k);
          }
        });
      };
    });

    // Cleanup
    return () => {
      if (removeKeyboardEvents) {
        const keyboardDispatch = Object.entries(keyboardMap).reduce<KeyboardDispatch>(
          (output, [key, action]) => {
            output[key] = () => dispatch(action);
            return output;
          },
          {}
        );
        removeKeyboardEvents(keyboardDispatch);
      }
    };
  }, [keyboardMap, dispatch]);
};

function addKeyboardEvents(keyboardMap: KeyboardDispatch, hotkeys: Hotkeys) {
  Object.keys(keyboardMap).forEach((k) => {
    const fn = keyboardMap[k];
    if (k === 'shift' && fn) {
      DetectShift.bind(fn);
    } else if (fn) {
      hotkeys(k, fn);
    }
  });
}
