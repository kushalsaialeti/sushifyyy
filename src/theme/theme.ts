/**
 * Sushifyyyy Studio V1 — design tokens
 * Source of truth for the React Native / Expo implementation.
 * Values mirror the interactive prototype (Main.dc.html) exactly.
 */

export const colors = {
  // Brand palette (strict — do not add hues)
  obsidian: '#08090B',        // app background
  graphite: '#14161A',        // cards, dock, sheets
  graphiteElevated: '#1D1F24',// raised surfaces, icon tiles
  ashSilver: '#33363D',       // borders, inactive tracks
  porcelain: '#F6F6F4',       // primary buttons, labels
  signalCrimson: '#EF3349',   // record, create, waveform peaks, active slider fill
  electricCoral: '#FF6370',   // waveform highlights, warnings, focus ring
  mutedSilver: '#A3A5AE',     // secondary text & icons
  deepBurgundy: '#701C2B',    // waveform shading / reflection, warn-toast chip
  timelineWhite: '#F2F2F1',   // audio timeline background

  // Derived neutrals used in the prototype (tints of the palette above)
  well: '#0E0F12',            // inset wells (segmented track, info boxes)
  footer: '#0B0C0F',          // sticky action footers
  hairline: '#1F2126',        // card borders
  hairlineStrong: '#26282E',  // input / control borders
  dockBorder: '#23252B',
  textTertiary: '#7C7F88',    // captions, placeholders (4.5:1 on obsidian)
  textOnLight: '#14161A',     // charcoal text on porcelain
  textOnLightMuted: '#4A4D55',
  timelineLabel: '#5C5F67',   // time markers on timeline white
  timelineGrid: '#DEDEDB',
  timelineDim: '#C9C9C5',     // waveform outside trim region
  karaokeWave: '#C9CAD0',     // karaoke track peaks (light silver)
  karaokeWaveShade: '#4A4D55',
  scrim: 'rgba(0,0,0,0.66)',
} as const;

export const gradients = {
  porcelainGloss: ['#FFFFFF', '#F6F6F4', '#E2E2DF'],           // 0 / 48 / 100%
  segmentActive: ['#FFFFFF', '#E6E6E3'],
  crimsonButton: { center: '36% 28%', stops: ['#FF7C88', '#EF3349', '#CF2A3F'], at: [0, 0.46, 1] },
  sliderFill: ['#701C2B', '#EF3349'],
} as const;

export const typography = {
  family: { regular: 'Inter_400Regular', medium: 'Inter_500Medium', semibold: 'Inter_600SemiBold', bold: 'Inter_700Bold' },
  size: {
    screenTitle: 28,   // 26–30
    display: 30,       // brand wordmark, login
    section: 18,       // 18–22
    cardTitle: 16,
    body: 15,          // 14–16
    bodySmall: 14,
    label: 13,         // 12–13
    caption: 12,
    nav: 10.5,         // 10–11
    timer: 56,         // recorder timer (tabular numerals)
    timerFraction: 28,
    exportPercent: 40,
  },
  letterSpacing: { title: -0.02, display: -0.03 }, // em
  lineHeight: { body: 1.5, tight: 1.0 },
  tabularNums: { fontVariant: ['tabular-nums'] as const },
} as const;

export const spacing = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, screenX: 16, screenTop: 24 } as const;

export const radius = {
  segmentInner: 10, control: 12, input: 14, button: 16, card: 20, panel: 22, sheet: 28, dialog: 26, pill: 999,
} as const;

export const shadows = {
  glossButton: { color: '#000', opacity: 0.45, radius: 20, offsetY: 8, elevation: 8 },
  createButtonGlow: { color: colors.signalCrimson, opacity: 0.38, radius: 22, offsetY: 0 },
  createButtonDrop: { color: '#000', opacity: 0.6, radius: 16, offsetY: 8, elevation: 10 },
  dock: { color: '#000', opacity: 0.45, radius: 30, offsetY: -12 },
  timeline: { color: '#000', opacity: 0.5, radius: 30, offsetY: 10 },
  toast: { color: '#000', opacity: 0.55, radius: 30, offsetY: 12 },
  knob: { color: '#000', opacity: 0.55, radius: 6, offsetY: 2 },
} as const;

export const motion = {
  tabIndicator: { type: 'spring', damping: 15, stiffness: 170, mass: 0.9, webEquivalent: '460ms cubic-bezier(.34,1.42,.56,1)' },
  tabIndicatorCross: { scaleX: 0.5, opacity: 0.35, duration: 230 }, // when jumping across the centre button
  buttonPress: { scale: 0.96, duration: 140 },
  pageTransition: { duration: 280, translateY: 8, easing: 'cubic-bezier(.2,.8,.2,1)' },
  bottomSheet: { duration: 340, easing: 'cubic-bezier(.2,.9,.25,1)' },
  modal: { duration: 250, fromScale: 0.96 },
  toast: { duration: 360, visibleMs: 2400 },
  recordPulse: { duration: 1600, minOpacity: 0.4 },
  recordHalo: { duration: 1900, toScale: 1.32 },
  successPop: { duration: 360, fromScale: 0.85 },
  toggleKnob: { duration: 260 },
  meterUpdateMs: 90,
  waveformTickMs: 100,
} as const;

export const icon = { nav: 22, inline: 18, button: 20, hero: 26, strokeWidth: 1.8 } as const;

export const dims = {
  designViewport: { width: 390, height: 844 },
  touchTarget: 44,
  dock: { height: 88, rowHeight: 52, rowTop: 8, indicatorWidth: 62, indicatorHeight: 52, indicatorRadius: 18 },
  createButton: { size: 60, elevation: 18, notchSize: 80, notchVisible: 24 },
  recordButton: { size: 88, ring: 4 },
  transportSecondary: 56,
  playButton: 52,
  primaryButton: { height: 54, heightCompact: 44 },
  input: { height: 52 },
  segmented: { height: 40, padding: 4 },
  slider: { trackHeight: 4, knob: 22, hitHeight: 32 },
  toggle: { width: 52, height: 32, knob: 26 },
  timeline: { recorderHeight: 170, editorHeight: 150, trackHeight: 72, markerBand: 22 },
  meterSegments: 28,
} as const;

export const theme = { colors, gradients, typography, spacing, radius, shadows, motion, icon, dims };
export type Theme = typeof theme;
export default theme;
