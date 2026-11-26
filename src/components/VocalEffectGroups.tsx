import { useState } from 'react';
import { Text } from 'react-native';

import { creatorText } from '@/components/CreatorScreenElements';
import { EffectGroup } from '@/components/EffectGroup';
import { EffectSlider } from '@/components/EffectSlider';
import { SegmentedControl } from '@/components/SegmentedControl';
import { minimumTrimLength, trimEdit, type Trim, type VocalEffects } from '@/services/vocalEditor';
import { formatDuration, noiseOptions } from '@/store/creatorStudio';

type NumericEffect = Exclude<keyof VocalEffects, 'trimStart' | 'trimEnd' | 'noise'>;
type Slider = { key: NumericEffect; label: string; hint: string; min: number; max: number; step: number; format: (value: number) => string };
const decibels = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)} dB`;
const percent = (value: number) => `${value}%`;
const seconds = (value: number) => `${value.toFixed(1)} s`;
const roomLabel = (value: number) => value < 34 ? 'Booth' : value < 67 ? 'Studio' : 'Hall';
const cleanupLabels = { natural: 'Natural', clean: 'Clean', strong: 'Strong' } as const;

const groups = [
  { id: 'volume', title: 'Voice level', description: 'How loud your voice sits', summary: (fx) => decibels(fx.gain), sliders: [
    { key: 'gain', label: 'Vocal gain', hint: 'Turn up a quiet take, or calm a loud one.', min: -12, max: 12, step: 0.5, format: decibels },
  ] },
  { id: 'space', title: 'Reverb', description: 'A sense of room around your voice', summary: (fx) => percent(fx.reverb), sliders: [
    { key: 'reverb', label: 'Amount', hint: 'From dry and close to dreamy.', min: 0, max: 100, step: 1, format: percent },
    { key: 'room', label: 'Room size', hint: 'Small booth to a big hall.', min: 0, max: 100, step: 1, format: roomLabel },
  ] },
  { id: 'tone', title: 'Tone', description: 'Basic EQ — shape how your voice sounds', summary: () => 'EQ', sliders: [
    { key: 'warmth', label: 'Warmth (lows)', hint: 'Adds body. Lower it if the voice sounds boomy.', min: -6, max: 6, step: 0.5, format: decibels },
    { key: 'presence', label: 'Presence (mids)', hint: 'Brings your words forward.', min: -6, max: 6, step: 0.5, format: decibels },
    { key: 'air', label: 'Air (highs)', hint: 'Sparkle and breath on top.', min: -6, max: 6, step: 0.5, format: decibels },
  ] },
  { id: 'smooth', title: 'Smoothing', description: 'Gentle compression evens out loud and soft parts', summary: (fx) => percent(fx.comp), sliders: [
    { key: 'comp', label: 'Amount', hint: 'A little goes a long way.', min: 0, max: 100, step: 1, format: percent },
  ] },
  { id: 'fades', title: 'Fades', description: 'Ease the start and end', summary: (fx) => `${fx.fadeIn.toFixed(1)}s · ${fx.fadeOut.toFixed(1)}s`, sliders: [
    { key: 'fadeIn', label: 'Fade in', hint: 'Seconds at the start.', min: 0, max: 5, step: 0.1, format: seconds },
    { key: 'fadeOut', label: 'Fade out', hint: 'Seconds at the end.', min: 0, max: 5, step: 0.1, format: seconds },
  ] },
] satisfies { id: string; title: string; description: string; summary: (effects: VocalEffects) => string; sliders: Slider[] }[];

export function VocalEffectGroups({ committed, effects, trim, committedTrim, duration, initiallyOpen, onPreview, onCommit }: {
  committed: VocalEffects;
  effects: VocalEffects;
  trim: Trim;
  committedTrim: Trim;
  duration: number;
  initiallyOpen: 'space' | 'volume';
  onPreview: (patch: Partial<VocalEffects> | null) => void;
  onCommit: (patch: Partial<VocalEffects>) => void;
}) {
  const [open, setOpen] = useState<string | null>(initiallyOpen);
  const shortest = Math.min(minimumTrimLength, duration);

  function toggle(id: string) {
    onPreview(null);
    setOpen((current) => current === id ? null : id);
  }

  return <>
    {groups.map((group) => <EffectGroup key={group.id} title={group.title} description={group.description}
      summary={group.summary(effects)} open={open === group.id} onToggle={() => toggle(group.id)}>
      {group.sliders.map(({ key, ...slider }) => <EffectSlider key={key} {...slider} value={committed[key]}
        onPreview={(value) => onPreview(value === null ? null : { [key]: value })} onChange={(value) => onCommit({ [key]: value })} />)}
    </EffectGroup>)}
    <EffectGroup title="Trim" description="Cut silence before and after you sing" summary={formatDuration(trim.end - trim.start)}
      open={open === 'trim'} onToggle={() => toggle('trim')}>
      <EffectSlider label="Start" hint="Drag to cut the beginning." min={0} max={Math.max(0, committedTrim.end - shortest)} step={0.1}
        value={committedTrim.start} format={formatDuration}
        onPreview={(value) => onPreview(value === null ? null : trimEdit('start', value, committedTrim, duration))}
        onChange={(value) => onCommit(trimEdit('start', value, committedTrim, duration))} />
      <EffectSlider label="End" hint="Drag to cut the ending." min={Math.min(duration, committedTrim.start + shortest)} max={duration} step={0.1}
        value={committedTrim.end} format={formatDuration}
        onPreview={(value) => onPreview(value === null ? null : trimEdit('end', value, committedTrim, duration))}
        onChange={(value) => onCommit(trimEdit('end', value, committedTrim, duration))} />
    </EffectGroup>
    <EffectGroup title="Noise cleanup" description="Reduce background noise after recording" summary={cleanupLabels[effects.noise]}
      open={open === 'cleanup'} onToggle={() => toggle('cleanup')}>
      <SegmentedControl label="Noise cleanup" options={noiseOptions} value={effects.noise} onChange={(noise) => onCommit({ noise })} />
      <Text style={creatorText.caption}>Softens hiss, fans and room hum. Stronger settings can make a voice sound thinner.</Text>
    </EffectGroup>
  </>;
}
