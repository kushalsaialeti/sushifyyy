import { useMemo } from 'react';
import Svg, { Path } from 'react-native-svg';

import { demoPeak } from '@/services/demoWaveform';
import { colors } from '@/theme/theme';

// Static fixtures for the welcome and library screens. Live transport arrives in the recorder stage.
export function PreviewWaveform({ seed, variant }: { seed: number; variant: 'welcome' | 'continue' | 'project' }) {
  const width = variant === 'welcome' ? 330 : variant === 'continue' ? 306 : 150;
  const height = variant === 'welcome' ? 56 : variant === 'continue' ? 48 : 24;
  const count = variant === 'welcome' ? 70 : variant === 'continue' ? 60 : 30;
  const paths = useMemo(() => {
    let top = '';
    let reflected = '';
    let highlight = '';
    const center = height / 2;
    const step = width / count;
    for (let i = 0; i < count; i += 1) {
      const peak = demoPeak(i, seed) * center * 0.88;
      const x = ((i + 0.5) * step).toFixed(1);
      const line = `M${x} ${(center - peak).toFixed(1)}V${center}`;
      reflected += `M${x} ${center + 1}V${(center + peak * 0.72).toFixed(1)}`;
      if (variant === 'welcome' ? i > 30 && i < 40 : variant === 'continue' && i < 22) highlight += line;
      else top += line;
    }
    return { top, reflected, highlight, stroke: Math.max(1.2, step * 0.56) };
  }, [count, height, seed, variant, width]);

  return <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden>
    <Path d={paths.reflected} stroke={variant === 'project' ? colors.ashSilver : colors.deepBurgundy}
      opacity={variant === 'welcome' ? 0.8 : variant === 'continue' ? 0.55 : 1} strokeWidth={paths.stroke} strokeLinecap="round" />
    <Path d={paths.top} stroke={variant === 'project' ? colors.deepBurgundy : colors.signalCrimson} strokeWidth={paths.stroke} strokeLinecap="round" />
    {!!paths.highlight && <Path d={paths.highlight} stroke={colors.electricCoral} strokeWidth={paths.stroke} strokeLinecap="round" />}
  </Svg>;
}
