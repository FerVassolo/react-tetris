import React from 'react';
import DetectShift from '../modules/detect-shift';
import { Action } from '../models/Game';

export type KeyboardMap = Record<string, Action>;

type KeyboardDispatch = Record<string, () => void>;

type Keymaster = {
  (key: string, fn: () => void): void;
  unbind: (key: string) => void;
};

export const useKeyboardControls = (
  keyboardMap: KeyboardMap,
  dispatch: React.Dispatch<Action>
): void => {
  React.useEffect(() => {
    let key: Keymaster | undefined;
    let removeKeyboardEvents: ((keyboardMap: KeyboardDispatch) => void) | undefined;

    import('keymaster').then((keymasterModule) => {
      key = (keymasterModule.default || keymasterModule) as Keymaster;
      const keyboardDispatch = Object.entries(
        keyboardMap
      ).reduce<KeyboardDispatch>((output, [key, action]) => {
        output[key] = () => dispatch(action);
        return output;
      }, {});
      addKeyboardEvents(keyboardDispatch, key);
      removeKeyboardEvents = (keyboardMap) => {
        Object.keys(keyboardMap).forEach((k) => {
          if (k === 'shift') {
            const fn = keyboardMap[k];
            fn && DetectShift.unbind(fn);
          } else {
            key && key.unbind(k);
          }
        });
      };
      // Cleanup
      return () => removeKeyboardEvents && removeKeyboardEvents(keyboardDispatch);
    });
  }, [keyboardMap, dispatch]);
};

function addKeyboardEvents(keyboardMap: KeyboardDispatch, key: Keymaster) {
  Object.keys(keyboardMap).forEach((k: keyof KeyboardDispatch) => {
    const fn = keyboardMap[k];
    if (k === 'shift' && fn) {
      DetectShift.bind(fn);
    } else if (fn) {
      key(k, fn);
    }
  });
}
