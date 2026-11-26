# Sushifyyyy Studio V1 — Codex Design Handoff

The reference is the interactive prototype on the **Sushifyyyy Studio V1** design canvas. It has three artboards:

- `Main.dc.html`: the whole creator app as one stateful 390×844 phone prototype
- `States.dc.html`: the common-states gallery
- `Admin.dc.html`: the Super Admin concept

Tokens are in `theme.ts`.

> **The web prototype is not production React Native code.** It is a behavioural and visual reference. Recording, audio DSP, file I/O, auth and the database are all simulated.

---

## A. Screen registry

| ID | Screen | Route (Expo Router) | Entry points | Exits / destinations | Purpose |
|---|---|---|---|---|---|
| S01 | Splash | `/` | App launch | Auto after ~1.8 s or tap → S02 (or S03 if a session is valid) | Brand moment and session check |
| S02 | Welcome / Login | `/(auth)/login` | S01, Sign out, access revoked | S03 on approved; stays with an inline state otherwise | Email + Google sign-in. Shows the loading, invalid-credentials, no-access and network-failure states |
| S03 | Creator Home | `/(tabs)/index` | Login, Home tab, export success | S05 (New Recording / center +), S06 (Continue), S04 (Drafts / See all), S12, S13 | Calm launch pad |
| S04 | Projects Library | `/(tabs)/projects` | Projects tab, Home → Drafts | S06 (Open), S11 (Export), rename/duplicate/delete sheets | Every local project |
| S05 | Recording Studio | `/studio/[projectId]/record` | Center +, Home New Recording, step rail | S06 automatically after Stop → Processing → Finished | Raw vocal capture |
| S06 | Vocal Editor | `/studio/[projectId]/enhance` | S05, project Open, step rail | S07 (Continue to Karaoke), S08 (Skip to Video), back → S05 (finished state) | Non-destructive enhancement |
| S07 | Karaoke Import & Mixer | `/studio/[projectId]/karaoke` | S06, step rail | S08 (Skip or Continue), back → S06 | Optional backing-track mix |
| S08 | Video Decision | `/studio/[projectId]/video` | S06 skip, S07, step rail | S09 (Add video; goes to S10 if a video exists), S11 (Continue without video) | Lets the creator choose whether to add a video |
| S09 | Video Recorder | `/studio/[projectId]/video/camera` (full-screen modal) | S08 | S10 (Next), back → S08 | Camera capture with the mix playing |
| S10 | Video Sync / Preview | `/studio/[projectId]/video/sync` | S09, step rail (when a video exists) | S11, back → S09 | Offset, trim and preview |
| S11 | Export | `/studio/[projectId]/export` | S08, S10, Projects → Export | S12 (View in Exports), S03 (Home) | Format, quality, name and location, then the progress, success and failure states |
| S12 | Export History | `/(tabs)/exports` | Exports tab, Home tile, export success | Info sheet, share sheet | Finished files on the device |
| S13 | Creator Profile | `/(tabs)/profile` | Profile tab, Home avatar | S14, About dialog, Sign out → S02 | Identity, access status, storage |
| S14 | Settings | `/settings` (stack) | S13 rows | Back → S13 | Defaults, motion, haptics, data, privacy |
| S15 | Common states | Components, not a route | Everywhere | — | Skeletons, empty states, toasts, dialogs, permission, revoked, offline, incompatibility |
| S16 | Super Admin concept | Separate admin surface (not in the creator tab bar) | Admin login only | — | Grant and revoke access, pending requests, audit log |

## B. Design tokens

See **`theme.ts`**. In summary:

- **Palette:** 10 brand colours, plus a few derived neutrals that are tints of them.
- **Red use:** red means two things only: *create/record* and *audio signal*. Coral is used for highlights and warnings.
- **Status colours:** there is no green. "Success" uses porcelain with a check mark.

## C. Navigation specification

- **Root stack:** splash → `(auth)` → `(tabs)`. A modal studio stack sits above the tabs and hides the dock.
- **Tabs:** there are four tabs: Home, Projects, Exports, Profile. The center Create button is **not a route**. It pushes `/studio/new/record`, which creates a draft project id first.
- **Studio workflow:** this is a nested stack. A **step rail** (Record · Enhance · Karaoke · Video · Export) shows the current step in crimson and completed steps in silver.
  - Completed steps are tappable, so the creator can jump back without losing state.
  - Steps the creator hasn't reached are disabled.
  - The rail locks while an export is running.
- **Back behaviour:**
  - Recorder: while recording or paused, Back pauses the take and opens the **Leave this take?** dialog (Save draft / Keep recording). After a take is finished, Back goes to the Editor.
  - Editor → Recorder, which shows the finished state.
  - Karaoke → Editor.
  - Video Decision → Karaoke if a track was imported, otherwise → Editor.
  - Camera close → Decision. This discards an in-progress take.
  - Sync → Camera.
  - Export → Sync if a video exists, otherwise → Decision. Back is disabled while exporting.
  - The Android hardware back button follows the same map.
- **Modals:**
  - Bottom sheets: project actions, rename, file info, prototype states. They have a 28 px top radius, a grab handle and tap-scrim-to-close.
  - Dialogs: centred, 26 px radius. A destructive confirm button is solid crimson.
  - Toasts: top of the screen, auto-dismiss after 2.4 s.
- **Active indicator motion:**
  - It is **one persistent element** in the dock. It translates by whole tab slots (slot index × 20 % of the dock width), using a spring with a slight overshoot (`motion.tabIndicator`).
  - The center slot (index 2) is never a destination.
  - When moving between the left side (Home, Projects) and the right side (Exports, Profile), the capsule contracts to `scaleX 0.5` and `opacity 0.35` for 230 ms while it travels.
  - It sits at z-index 1, below the tab labels (z2), the dock notch (z3) and the red button (z4). It can never paint over the Create button.
  - The active icon turns charcoal, lifts by 1.5 px, and its label goes from weight 500 to 600.

## D. Component inventory

| Component | Key props | Visual states |
|---|---|---|
| `AppScreen` | `scroll`, `withDock`, `footer` | Textured obsidian bg. Bottom padding is 124 px when the dock is shown. |
| `AppHeader` | `title`, `subtitle`, `onBack`, `right` | 44 px icon buttons. The title is centred and ellipsised. |
| `StepRail` | `current`, `reached`, `onStep`, `locked` | current / done / upcoming / locked |
| `BottomNavigation` | `active`, `onTab`, `onCreate` | — |
| `AnimatedTabIndicator` | `slot`, `crossing` | rest, travelling, crossing-contracted |
| `ElevatedCreateButton` | `onPress`, `haptics` | rest, pressed (0.96). Always crimson, white plus. |
| `PrimaryGlossyButton` | `label`, `icon`, `loading`, `disabled` | rest, pressed, loading spinner, disabled |
| `SecondaryButton` | `label`, `tone: neutral \| danger` | rest, pressed, disabled |
| `MatteCard` | `padding`, `elevated` | graphite / elevated graphite / inset well |
| `WaveformTimeline` | `samples`, `playhead`, `highlightUntil`, `trim`, `zoom`, `variant: vocal \| karaoke \| mini`, `onSeek` | live-recording (scrolls, last 5 bars coral), playback (played part coral), trimmed regions dimmed, karaoke (graphite bg, silver peaks), processing overlay, finished overlay |
| `RecordingTimer` | `seconds`, `state` | idle (silver), recording (porcelain), paused (coral) |
| `AudioLevelMeter` | `level 0–1` | 28 segments: porcelain → coral (from 19) → crimson (from 24). Unlit segments are `#1D1F24`. |
| `EffectSlider` | `label`, `hint`, `min`, `max`, `step`, `value`, `format`, `onChange` | rest, dragging. Animated value readout. |
| `EffectGroup` (accordion) | `title`, `description`, `summary`, `open` | collapsed / expanded. Only one is open at a time. |
| `ToggleSwitch` | `value`, `disabled` | off (ash), on (crimson), disabled (45 % opacity) |
| `SegmentedControl` | `options[{value,label,disabled}]`, `value` | selected (porcelain gloss), unselected, disabled |
| `ProjectCard` | `project`, `onOpen`, `onMenu` | Draft / Completed badge, audio/video icon |
| `ExportCard` | `export`, `playing`, `position` | idle, previewing (progress bar) |
| `AudioTrack` | `kind`, `muted`, `solo`, `offset`, `trimStart` | audible / muted-dimmed (35 %) |
| `TrimHandle` | `edge`, `position` | rest, dragging |
| `ExportProgress` | `progress`, `phase`, `cancellable` | rendering, encoding, saving (no cancel) |
| `BottomSheet` | `title`, `onClose` | entering, open |
| `ConfirmationDialog` | `title`, `body`, `confirmLabel`, `destructive` | neutral / destructive |
| `StatusToast` | `message`, `kind: success \| warn` | — |
| `EmptyState` | `icon`, `title`, `body`, `action` | — |
| `LoadingSkeleton` | `variant` | shimmer |
| `Banner` | `icon`, `message`, `dismissible` | headphones disconnected, interruption, storage low, offline |

## E. Interaction specification (every control)

**Splash.** Tap anywhere to skip. Otherwise it auto-advances.

**Login**
- Email and password fields.
- **Sign in:** shows a spinner and "Checking access…" for about 1.1 s, then shows the outcome.
- **Continue with Google:** follows the same flow as Sign in.
- **No access:** replaces the form with the "Studio access is pending" card and a "Use another account" button.
- **Invalid:** crimson field borders and an inline message.
- **Network:** a banner above the form.
- The prototype-only outcome selector picks which of these you see.

**Home**
- **Earphone readiness card:** toggles the simulated connection. This drives monitoring availability everywhere.
- **New Recording:** opens S05 on a new draft.
- **Continue:** opens the most recent project in the Editor.
- **Drafts tile:** opens Projects with the Drafts filter on.
- **Exports tile:** opens Exports.
- **Recent rows:** open that project.
- **Avatar:** opens Profile.

**Dock.** The four tabs switch screens and move the indicator. The **+** button starts a new recording and fires a soft haptic if haptics are on.

**Projects**
- Search filters by name as you type.
- The segmented control filters All / Drafts / Completed.
- **Open** and **⋯** are on each card. The ⋯ sheet has:
  - **Open**
  - **Rename** (opens the rename sheet → Save name)
  - **Duplicate** (adds "(copy)" as a Draft)
  - **Export** (goes to S11)
  - **Delete** (opens a destructive confirm, then removes the project and shows a toast)
- The empty state has a Start recording button.

**Recorder**

| Control | Behaviour |
|---|---|
| Red button | idle → *preparing* (0.9 s) → *recording*; recording → *paused*; paused → resume |
| Stop (square) | Enabled while recording or paused. Goes to *processing* (1.3 s) → *finished* ("Take saved · m:ss") → Editor after 1 s. The duration is stored on the project. |
| Monitor button / switch | Only works when earphones are connected. Otherwise it is dimmed and explains why. |
| Noise segmented | Natural / Clean / Strong Clean, with a one-line description and an honest note about its limits |
| Save draft | Adds the project to Projects and shows a toast |
| Prototype states sheet | permission denied; unplug/plug earphones; audio interruption (only while recording or paused, forces *paused* with a banner); storage almost full; reset |
| Permission-denied card | **Open phone settings** returns to idle with a toast. **Not now** goes back. |

- The waveform scrolls while recording. The playhead locks at about 72 % of the timeline width, and the time markers roll.
- The input meter tracks the simulated amplitude.

**Editor**

| Control | Behaviour |
|---|---|
| Undo / Redo | Snapshot history. Slider drags within 700 ms merge into one step. Buttons are disabled at either end of the history. |
| Original / Enhanced | Re-renders the waveform with or without gain, compression and fades applied |
| Zoom − / + | 1×–8×. The window stays centred on the playhead. |
| Waveform tap | Seeks |
| Play / Pause | Loops within the trim region. The played part turns coral. |
| Effect groups | Accordion: Voice level, Reverb (amount, room size), Tone (warmth, presence, air), Smoothing, Fades (in, out), Trim (start, end — handles and duration update live), Noise cleanup (segmented) |
| Restore defaults | Confirm dialog. Resets every effect but keeps the trim. The reset can be undone. |
| Footer | **Skip to Video** → S08. **Continue to Karaoke** → S07. |

**Karaoke**
- **Skip** is in the header and the footer. It is the primary (gloss) button until a track has been imported.
- **Choose a file** shows the importing state (1.2 s), then the ready state with the demo file.
- **Trash** opens a confirm, then removes the track.
- **M / S per track:** mute and solo, with the audible logic shown in the "Vocals + karaoke / Vocals only…" label.
- **Sliders:** vocal level, karaoke level, align (±2 s, shifts the karaoke waveform), trim intro (dims the start of the karaoke track).
- **Preview mix:** moves a shared playhead across both tracks.
- **Continue:** goes to S08.

**Video Decision.** "Add Performance Video" opens the camera, or Sync if a take already exists. "Continue Without Video" goes to Export with Audio only selected.

**Camera**
- **Record:** the ring's inner dot morphs into a rounded square, and the timer turns red and pulses.
- **Stop:** marks the take as recorded and shows a "Take recorded" pill.
- **Retake** and **Next** are enabled only once there is a take.
- **Flip:** switches the front/back camera label.
- **Close:** goes back to the Decision screen.
- The guidance text changes depending on whether earphones are connected.

**Sync**
- Tap the preview to play or pause. The playhead moves across both strips.
- **Audio offset slider:** ±500 ms. It shifts the audio strip, and the badge reads "In sync" within 80 ± 30 ms.
- **Auto-sync:** sets the offset to +80 ms and shows a toast.
- **Trim video start:** dims the start of the video strip.
- **Continue to export:** goes to S11 with Video selected.

**Export**
- **File name** is editable.
- **What to export:** Video is disabled until a video exists, with a note explaining why.
- **Format:** WAV or AAC/M4A.
- **Resolution:** 720p / 1080p, for video only.
- **Quality:** Standard / High / Studio.
- **Save to:** "Change" cycles through Music › Sushifyyyy, Downloads and Movies › Sushifyyyy.
- The estimate card shows the format, the trimmed length and the computed size.
- The prototype-only failure checkbox makes the export fail.
- **Export:** shows a ring progress bar with three phases: Rendering → Encoding → Saving. Cancel is available until 82 %.
- **Success:** the copy says plainly that the export was simulated. It adds an Exports entry, marks the project Completed and offers View in Exports / Back to Home.
- **Failure:** stops at 68 % and offers Try again / Change settings.

**Exports**
- Per-card play preview with a progress bar.
- **Info:** opens a file-details sheet.
- **Share:** shows a toast saying the share sheet would open here.

**Profile**
- Recording quality segmented control.
- Rows: Studio settings, Personal preferences, Privacy, About (dialog).
- **Sign out:** confirm, then back to Login.

**Settings**
- Segmented controls: default quality, noise default, export default.
- Toggles: headphone monitoring preference, reduce motion (disables every animation in the app), haptics.
- **Clear cache:** confirm, then a toast.

**Admin**
- **Grant / Decline** on pending requests.
- **Revoke:** destructive confirm.
- Every action prepends an entry to the audit log.

## F. React Native implementation notes

| Prototype behaviour | Production mapping |
|---|---|
| Single-artboard state machine | **Expo Router**: `(auth)`, `(tabs)`, `studio/[projectId]/…` stack. Workflow state lives in a Zustand store per project, persisted to SQLite. The step rail reads `reachedStep` from the project record. |
| CSS spring on the tab indicator | **Reanimated** `withSpring(slot * tabWidth, motion.tabIndicator)` on a single `Animated.View`. When crossing sides: `scaleX` via `withSequence(withTiming(0.5,{duration:115}), withTiming(1,{duration:115}))`. The dock draws the notch with `react-native-svg`. Use `useSafeAreaInsets()` for bottom padding. |
| `.press` scale | `Pressable` plus a Reanimated scale of 0.96 over 140 ms. Haptics: `expo-haptics` `impactAsync(Light)` on the Create, Record, Video Record and Export buttons, gated by the setting. |
| Range inputs | **Gesture Handler** `Gesture.Pan()` on a custom `EffectSlider` with a 32 px hit area. Values update on the UI thread with `useSharedValue`. Commit to the history store on `onEnd` instead of the 700 ms merge window. |
| Trim handles, waveform seek | Pan gestures on `TrimHandle` and a tap gesture on `WaveformTimeline`. Draw the waveform with **@shopify/react-native-skia** (paths built from a peak array). Never use one RN view per bar. |
| 100 ms interval ticks | **Native audio engine events.** The recorder emits `onLevel` / `onBuffer` at ~30–60 Hz, which feeds a shared-value ring buffer. Playback position comes from the player's `onProgress`. The UI never polls. |
| Recording, monitoring, noise reduction | A native module (for example, Oboe on Android and AVAudioEngine on iOS) behind one `AudioEngine` interface: `prepare()`, `start()`, `pause()`, `stop()`, `setMonitoring(bool)`, `setNoiseProfile('natural'\|'clean'\|'strong')`. Monitoring only turns on when the route is a wired or USB headset with acceptable latency. Otherwise show the incompatibility warning. Handle audio-focus loss as an interruption: pause and show the banner. |
| Effects chain | Non-destructive. Store the parameter JSON per project, render it in real time for preview, and render offline for export. Always keep `original.wav` untouched. |
| Karaoke import | `expo-document-picker` (type `audio/*`). Copy the file into the app sandbox, decode its metadata and peaks, and store `offsetMs` and `trimStartMs`. |
| Camera | `expo-camera` / VisionCamera. While recording video, the mix plays through earphones. Store the measured `avSyncOffsetMs`. |
| Export | A native offline render plus encode (WAV / AAC-M4A / H.264 MP4). Save through `expo-media-library` / SAF on Android to the chosen collection. Report progress phases. Only show success after the file URI is confirmed. |
| Local SQLite metadata | `expo-sqlite` tables: `projects(id, name, status, media, duration_ms, reached_step, created_at, updated_at)`, `takes(project_id, path, sample_rate)`, `effects(project_id, json, history_json)`, `karaoke(project_id, path, offset_ms, trim_ms, gains)`, `videos(project_id, path, offset_ms, trim_ms)`, `exports(id, project_id, uri, format, size, duration_ms, created_at)`. |
| Supabase creator authorization | Supabase Auth (email and Google OAuth). A `creators` table has `status: pending\|approved\|revoked`. Use RLS so that a user can only read their own row. Re-check access at launch and on resume. If revoked, show the Access Revoked screen. Recordings are **never uploaded**. |
| Admin grant / revoke | Supabase **Edge Function** using the service role, which verifies `role = 'super_admin'` from a server-side table before mutating and writes `audit_log`. The admin UI never writes `creators` directly. |
| Reduced motion | `AccessibilityInfo.isReduceMotionEnabled()` OR the in-app toggle sets durations to 0 and turns springs into timings. |

## G. Screen state matrix

| Screen | Empty | Loading | Active | Success | Error | Offline | Permission-restricted |
|---|---|---|---|---|---|---|---|
| Login | — | Checking access | Form | → Home | Invalid creds | Network banner | No creator access card |
| Home | No projects: hide the recent card | Skeleton cards | Default | Toasts | — | Offline pill (recording still works) | Access revoked → full screen |
| Projects | Empty / no search match | Skeleton list | List + sheets | Rename/duplicate/delete toasts | — | Works | — |
| Recorder | Idle hint | Preparing mic | Recording / paused | Processing → finished | Interruption, storage low | Works | Mic denied card. Monitoring disabled without earphones. Incompatible device warning. |
| Editor | — | Peaks loading (skeleton) | Editing / playing | Restore toast | — | Works | — |
| Karaoke | Import card | Importing | Mixer | Track added toast | Unsupported file (toast) | Works | Storage permission (Android SAF prompt) |
| Video decision | — | — | Two choices | — | — | Works | — |
| Camera | No take | Camera starting | Recording | Take recorded | Camera interrupted | Works | Camera / mic denied card |
| Sync | — | — | Preview | In sync badge | Check sync badge | Works | — |
| Export | — | Rendering, encoding, saving | Form | Complete (simulated) | Failed / retry | Works | Media-library permission |
| Exports | Empty message | Skeleton | Previewing | — | Missing file (toast) | Works | — |
| Profile / Settings | — | — | Default | Cache cleared | — | Offline note | — |
| Admin | No pending | — | Lists | Audit entry | Server rejection (toast) | Read-only | Non-admin: access denied |

## H. Acceptance checklist

**Visual**
- [ ] Only the palette in `theme.ts` is used. No purple, blue or green, and no decorative gradients beyond the porcelain gloss and the crimson button.
- [ ] The background texture is visible only up close. There are no large particles.
- [ ] Primary buttons are glossy porcelain with charcoal text. Record and Create are the only crimson buttons.
- [ ] The dock is full-width, graphite and bottom-anchored. It has 5 positions, and the center button is a 60 px crimson circle with a white **+** (no microphone), elevated about 18 px in a notch.
- [ ] The tab indicator is a single element that springs between slots, contracts when crossing sides, and never covers the red button.
- [ ] Timelines are timeline-white with crimson peaks, coral highlights, burgundy reflections, grid lines and time markers. The karaoke track is graphite with silver peaks.
- [ ] Typography: screen titles are 28 px (26–30), sections 18 px, body 14–16 px, captions 12–13 px, nav labels 10.5 px. Timers use tabular numerals.
- [ ] Text contrast is at least 4.5:1, including 12 px captions (`#7C7F88` or lighter on obsidian).

**Functional**
- [ ] Splash → Login → each login outcome renders correctly.
- [ ] + → Record → Pause → Resume → Stop → Processing → auto-opens Editor with the correct duration.
- [ ] Monitoring is disabled, with an explanation, when earphones are disconnected. Unplugging while in the Recorder shows the banner.
- [ ] Mic denied, interruption and storage-low states each render clearly.
- [ ] Editor: every slider updates its value, undo/redo works, Original/Enhanced changes the waveform, trimming changes the length, Restore keeps the trim.
- [ ] Karaoke is optional. Skip goes straight to Video Decision. Import, mixer, remove, mute/solo and align all work.
- [ ] Video is optional. "Continue without video" goes to Export with Audio only.
- [ ] Camera → record → stop → retake/next → sync offset badge → export with video.
- [ ] Export shows the progress phases, cancels before Saving, the failure path retries, and success says the export was simulated and adds an Exports entry.
- [ ] The step rail lets the creator go back to completed steps without losing settings.
- [ ] Projects: search, filter, open, rename, duplicate and delete with confirmation all work.
- [ ] Reduce motion stops every animation.
- [ ] Every touch target is at least 44 px. Screens scroll with enough padding above the dock. Nothing overflows horizontally at 360 px.

**Platform (production)**
- [ ] Admin actions only succeed through the server function, and a client-side role edit has no effect.
- [ ] No recording, video or karaoke file leaves the device.

## I. Source handoff

- `Main.dc.html` is the prototype source. It is one file:
  - The `IC` icon map, waveform helpers (`amp`, `wave`) and demo data are at the top of the script.
  - The state machine is in `Component`, with handlers built in `renderVals()`.
  - The markup is split into sections labelled with the screen IDs above (`<!-- SCREEN 05 · RECORDING STUDIO -->` and so on).
- `States.dc.html` and `Admin.dc.html` hold the common-state components and the admin concept.
- `theme.ts` holds the tokens.

Port the components named in section D to RN. Use the markup only as a reference for layout, spacing and copy.

---

## Addendum — navigation update and Super Admin mobile app

**Bottom navigation on every signed-in screen.** The dock now stays visible throughout the studio workflow, the camera and Settings. Splash and Login are the only screens without it, because no one is signed in there yet.
- **Studio steps:** while the creator is in a studio step, the tab indicator is hidden and a thin porcelain ring surrounds the red **+**.
- **Leaving the studio:** tapping a tab saves the project as a draft automatically.
  - If a take is recording or paused, the app first shows **Leave this take? → Save draft**.
  - Tabs are blocked while an export is running.
- **Layout:** studio screens leave 88 px at the bottom for the dock, and sticky footers sit directly above it.

**Super Admin mobile app** (`design/prototype/AdminApp.dc.html`, screens `A01–A06`). This is a separate app area that only admins can reach. It has its own dock with the same style: Overview · Creators · (+ Invite) · Features · Audit.

| ID | Screen | Purpose |
|---|---|---|
| A01 | Overview | Counts for active creators, pending requests and hidden features. Pending requests can be granted or declined inline. Shows a feature-visibility summary and recent activity. |
| A02 | Creators | Search plus an Active / Pending / Revoked filter. Each card summarises which features are turned off for that creator. |
| A03 | Creator permissions | A Studio access switch, then one switch per feature: Karaoke import, Performance video, Live monitoring, Noise reduction, Strong Clean mode, WAV export, Studio quality. Features hidden globally appear locked. Changes are saved with "Save N changes". Revoke access has a destructive confirmation. |
| A04 | Invite a creator | Name, email (validated), and a starting feature preset: Full studio / Audio only / Custom. |
| A05 | Feature visibility | Each feature is set to **Everyone**, **Selected creators** (with a creator checklist) or **Hidden**. Changes stay as drafts, marked "Unpublished", until **Publish N changes** is confirmed. Hidden features are removed from the creator app entirely, not greyed out. |
| A06 | Audit log | All / Access / Features filter. Every grant, revoke, permission change and publish is logged. |

**Implementation notes**
- **Database:**
  - `creator_permissions(creator_id, feature_key, enabled)`
  - `feature_flags(feature_key, visibility: 'all'|'selected'|'hidden', allowed_creator_ids uuid[])`
  - `audit_log(...)`
- **Server-side writes:** all writes go through Supabase Edge Functions that check `role = 'super_admin'`.
- **Creator app:** at launch and on resume it fetches the effective feature set, which is the global visibility combined with that creator's own permissions. It hides those steps and options. For example, with video off, Video Decision is skipped and Export shows audio only.
