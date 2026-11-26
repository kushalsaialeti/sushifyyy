import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { gradients } from '@/theme/theme';

export function GlossFill({ variant = 'button' }: { variant?: 'button' | 'segment' | 'slider' }) {
  const stops = variant === 'button' ? gradients.porcelainGloss :
    variant === 'segment' ? gradients.segmentActive : gradients.sliderFill;

  return <View pointerEvents="none" aria-hidden style={StyleSheet.absoluteFill}>
    <Svg width="100%" height="100%">
      <Defs>
        <LinearGradient id="surfaceGloss" x1="0%" y1="0%" x2={variant === 'slider' ? '100%' : '0%'} y2={variant === 'slider' ? '0%' : '100%'}>
          {stops.map((color, index) => <Stop key={color} offset={index === stops.length - 1 ? 1 : index * 0.48} stopColor={color} />)}
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#surfaceGloss)" />
    </Svg>
  </View>;
}
