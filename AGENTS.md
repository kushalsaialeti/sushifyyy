# AGENTS.md — Sushifyyyy (instructions for Codex)

You are building **Sushifyyyy**, a private, creator-only mobile recording studio. Build it with React Native and Expo. It must match the approved design exactly.

## Source of truth (read before every task)
1. `design/SUSHIFYYYY_CODEX_HANDOFF.md` is the full spec:
   - A: screen registry
   - C: navigation
   - D: components
   - E: interactions
   - F: React Native mapping
   - G: state matrix
   - H: acceptance checklist
2. `design/theme.ts` holds the design tokens. Copy it to `src/theme/theme.ts`, and never hard-code colours, sizes or durations that exist there.
3. `design/prototype/*.dc.html` is the interactive web prototype. Read its markup for exact copy, spacing, radii, layout order and state logic. Each screen is marked with a comment such as `<!-- SCREEN 05 · RECORDING STUDIO -->`. The `IC` object in the script holds the exact SVG icon paths.
4. `design/screens/*.png` holds screenshots of each screen, if present. Match them visually.

If the spec and the prototype disagree, the prototype wins on visuals and the handoff wins on architecture.

## Stack
- Expo (latest SDK), TypeScript strict, **Expo Router**
- react-native-reanimated, react-native-gesture-handler, react-native-safe-area-context
- @shopify/react-native-skia for waveforms, and react-native-svg for icons and the dock notch
- expo-haptics, expo-sqlite, expo-document-picker, expo-camera, expo-media-library, expo-file-system
- @supabase/supabase-js for creator authorization only
- zustand for workflow state
- Inter font via @expo-google-fonts/inter

## Hard rules
- Android-first, iOS-compatible. Design viewport is 390×844. The layout must also work at 360 and 430 widths, and must respect safe areas.
- Use only the palette in `theme.ts`. Do not add purple, blue or green, and do not add decorative gradients.
- Bottom dock:
  - It has 5 positions. The center button is a 60 px crimson circle with a **white plus**. Never use a microphone icon there.
  - The active indicator is **one persistent Reanimated view** that springs between tabs. It contracts when it crosses the center button and never paints over the red button.
- Karaoke and video are always optional and always have a Skip action.
- Never upload recordings, videos or karaoke files. Everything stays local.
- Admin grant/revoke must go through a Supabase Edge Function that checks the role. The client never does this alone.
- Do not add social features, subscriptions, ads, or screens that aren't in the registry.
- Every touch target must be at least 44 px. Text contrast must be at least 4.5:1. Support reduced motion.

## How to work
- Work through the stages in `docs/CODEX_PROMPTS.md` in order, **one stage per task or branch**.
- Audio, camera and export start out as **mock implementations** behind interfaces in `src/services/` (`AudioEngine`, `VideoRecorder`, `Exporter`). Their behaviour matches the prototype's simulation, so the UI is complete before any native work begins.
- Build the reusable components from handoff section D in `src/components/` before building screens.
- Before finishing any task:
  - `npx tsc --noEmit` passes
  - `npx expo lint` passes
  - the app starts with `npx expo start`
- Then tick the matching items in handoff section H in your summary.
