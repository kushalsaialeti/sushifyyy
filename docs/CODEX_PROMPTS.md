# Codex prompts — paste one at a time, in order

Start each one in a fresh Codex task from the repo root. Review the result, test it on your phone with Expo Go or a dev build, and commit before you move to the next prompt.

---

### 1 — Project setup and tokens
```
Read AGENTS.md and design/SUSHIFYYYY_CODEX_HANDOFF.md.

Set up the project:
- Scaffold an Expo + TypeScript + Expo Router app in this repo, if one doesn't already exist.
- Install every library listed in AGENTS.md "Stack".
- Copy design/theme.ts to src/theme/theme.ts.
- Load the Inter fonts.
- Create the route skeleton from handoff section A: (auth), (tabs), studio/[projectId]/..., settings. Use placeholder screens.
- Add the textured obsidian background as an AppScreen component.

No real screens yet.
```

### 2 — Bottom dock and app shell
```
Build BottomNavigation, AnimatedTabIndicator and ElevatedCreateButton exactly as specified:
- handoff section C, "Active indicator motion"
- handoff section D
- the "BOTTOM NAVIGATION" block in design/prototype/Main.dc.html

Requirements:
- The indicator is one persistent Reanimated view that springs between tabs and contracts when it crosses the center button.
- The center button is crimson with a white plus.
- Draw the notch with react-native-svg.
- Respect safe areas.

Wire up the 4 tabs. The + button should push the studio record route.
```

### 3 — Shared components
```
Build every component in handoff section D under src/components/, with the props and states listed there:
- PrimaryGlossyButton, SecondaryButton, MatteCard
- SegmentedControl, ToggleSwitch
- EffectSlider (use a Gesture Handler pan gesture)
- EffectGroup, BottomSheet, ConfirmationDialog
- StatusToast (with a provider), EmptyState, LoadingSkeleton, Banner, StepRail

Match the colours, radii and press animations in theme.ts and the prototype markup.

Add a temporary /dev/components screen that shows all of them.
```

### 4 — Splash, Login, Home, Projects, Exports, Profile, Settings
```
Build S01, S02, S03, S04, S12, S13 and S14 from the prototype.

Copy the text and the layout order exactly. Use the demo data from the PROJECTS and EXPORTS constants in Main.dc.html, stored in a local store for now.

Include:
- every login state: loading, invalid, no access, network
- project search, filter, the ⋯ sheet, rename, duplicate, and delete with confirmation
- export preview and the info sheet
- sign-out confirmation
- all settings toggles, including Reduce motion, which must disable animations everywhere
```

### 5 — Waveform and Recorder
```
Build WaveformTimeline with Skia. It needs these variants: live, playback, trimmed, karaoke and mini. Then build RecordingTimer and AudioLevelMeter.

Build S05 Recording Studio with every state in handoff E and G:
- idle, preparing, recording, paused, processing, finished
- mic denied, earphones disconnected banner, interruption, storage low

Drive it from a MockAudioEngine in src/services/ that emits level and buffer events at 30–60 Hz, with the same behaviour as the prototype. When a take is stopped, open the Editor automatically.
```

### 6 — Vocal Editor
```
Build S06 exactly as specified:
- Original/Enhanced switch, zoom, tap-to-seek, playback that loops inside the trim
- trim handles
- the 7 effect groups as an accordion, with the exact labels and hint text from the prototype
- undo/redo history that commits on gesture end
- Restore defaults with a confirmation; it keeps the trim
- footer buttons

Store effect parameters per project. They are non-destructive.
```

### 7 — Karaoke, Video Decision, Camera, Sync
```
Build S07, S08, S09 and S10 with the exact back-navigation map from handoff C.

- Karaoke: import with expo-document-picker (copy the file into the app sandbox), mute/solo, levels, align, trim intro, mix preview, and remove with a confirmation. Skip is the primary button until a file is imported.
- Camera: use expo-camera behind a VideoRecorder interface.
- Sync: offset, trim, auto-sync, and the "In sync" badge.

Both karaoke and video must be skippable.
```

### 8 — Export
```
Build S11:
- format, quality and resolution options, save location, and the size estimate formula from the prototype's estSize()
- progress through three phases: rendering, encoding, saving
- cancel available until saving starts
- failure and retry
- the success screen

For now use a MockExporter. It must never claim a real file exists. Add a hook point for the real exporter that uses expo-media-library.
```

### 9 — Local persistence and Supabase access
```
Persist everything locally:
- Move project, effect, karaoke, video and export metadata to expo-sqlite, using the schema in handoff F.
- The step rail reads reachedStep, so users can return to any finished step without losing progress.

Add Supabase Auth (email and Google):
- a creators table with RLS
- an access check at launch and when the app resumes
- the Access Revoked screen

Write the Edge Function for admin grant/revoke with an audit log. Keep all keys in .env, never in code.
```

### 10 — Polish pass
```
Go through handoff section H item by item. Fix every mismatch against the prototype and the screenshots in design/screens/.

Test at 360, 390 and 430 widths. Check:
- reduced motion
- 44 px touch targets
- 4.5:1 text contrast
- keyboard avoidance on login, rename and export

Report which checklist items pass.
```

### Later — native audio (separate effort)
```
Replace MockAudioEngine with a native module: Oboe on Android, AVAudioEngine on iOS. It needs low-latency monitoring that is only allowed on wired or USB headsets, noise reduction profiles, and audio-focus interruption handling. Keep the AudioEngine interface unchanged.
```
