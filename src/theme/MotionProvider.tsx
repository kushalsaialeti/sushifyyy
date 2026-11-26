import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

type MotionPreference = {
  reduceMotion: boolean;
  preference: boolean;
  setPreference: (value: boolean) => void;
};

const MotionContext = createContext<MotionPreference>({
  reduceMotion: false,
  preference: false,
  setPreference: () => undefined,
});

export function MotionProvider({ children }: PropsWithChildren) {
  const initialSystemSetting = useReducedMotion();
  const [systemReduced, setSystemReduced] = useState(initialSystemSetting);
  const [preference, setPreference] = useState(false);

  useEffect(() => {
    let pending = true;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      pending = false;
      setSystemReduced(enabled);
    });
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (pending) setSystemReduced(enabled);
    }).catch(() => undefined);
    return () => {
      pending = false;
      subscription.remove();
    };
  }, []);

  return <MotionContext.Provider value={{ reduceMotion: systemReduced || preference, preference, setPreference }}>
    {children}
  </MotionContext.Provider>;
}

export function useMotionPreference() {
  return useContext(MotionContext);
}
