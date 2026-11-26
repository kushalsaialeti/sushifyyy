import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { loopPreviewPosition, type Trim } from '@/services/vocalEditor';
import { motion } from '@/theme/theme';

export function useVocalPreview({ start, end }: Trim, duration: number, initialPosition: number) {
  const [position, setPosition] = useState(initialPosition);
  const [playing, setPlaying] = useState(false);
  const pause = useCallback(() => setPlaying(false), []);

  useFocusEffect(useCallback(() => {
    const subscription = AppState.addEventListener('change', (state) => { if (state !== 'active') pause(); });
    return () => { subscription.remove(); pause(); };
  }, [pause]));

  useEffect(() => {
    if (!playing) return;
    let lastTick = performance.now();
    const interval = setInterval(() => {
      const now = performance.now();
      const elapsed = Math.max(0, (now - lastTick) / 1000);
      lastTick = now;
      setPosition((value) => loopPreviewPosition(value, elapsed, { start, end }));
    }, motion.waveformTickMs);
    return () => clearInterval(interval);
  }, [end, playing, start]);

  function seek(seconds: number) {
    const target = Math.max(0, Math.min(duration, seconds));
    setPosition(playing ? loopPreviewPosition(target, 0, { start, end }) : target);
  }

  function toggle() {
    if (playing) pause();
    else if (end > start) {
      setPosition((value) => loopPreviewPosition(value, 0, { start, end }));
      setPlaying(true);
    }
  }

  return { position: Math.min(position, duration), playing, pause, seek, toggle };
}
