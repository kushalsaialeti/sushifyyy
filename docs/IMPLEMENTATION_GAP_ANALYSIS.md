# Implementation gap analysis

## Stage gates

The app branch from the previous pass is missing from this workspace. Reconcile this inventory with that checkout if it becomes available. The table maps the available design assets to the ordered implementation stages in `CODEX_PROMPTS.md`.

| Stage | Available reference | Evidence needed to close the stage |
|---|---|---|
| 1. Foundation | Route registry, tokens and viewport | Strict TypeScript, bundled Inter, route placeholders, safe-area `AppScreen`, Android bundle and Expo startup. |
| 2. Shell | Dock markup, screenshots and motion tokens | Four tabs and center Create action. Verify one persistent indicator, crossing compression, stacking, signed-in visibility and safe areas. |
| 3. Shared components | Handoff D, common state gallery and overlay examples | Confirm accessible controls, focus, overlay dismissal, feedback and reduced motion with the shared component demo. |
| 4. Creator screens | Screens S01–S04 and S12–S14, prototype fixtures | Exercise login outcomes, project actions, export preview states, sign-out and settings without network dependencies. |
| 5. Recorder | S05 variants and scripted audio simulation | Verify transport, interruption, storage, draft and correct stop-to-Editor duration using `MockAudioEngine`. |
| 6. Editor | S06 interaction rules and simulated playback | Verify history, trim, comparison, restore and project-scoped effects. |
| 7. Optional media | S07–S10 and state handlers | Walk both skip paths, validate back/close and exercise deterministic picker, camera and sync states in mock mode. Introduce platform media adapters only after the device gate. |
| 8. Export | S11 settings, estimate, phases and sample outcomes | Verify Cancel, saving lock, retry and local history. Keep simulated success copy explicit. |
| 9. Persistence and access | SQLite schema, access notes and admin prototype | Exercise migrations, project recovery and authorization. Verify RLS ownership, approval and revocation, effective feature policy and server-side admin audit. |
| 10. Polish and device gate | Handoff H and PNG references | Compare at 360, 390 and 430 dp. Validate physical Android, Android back behavior, keyboard, screen readers, reduced motion and main workflow branches. Record iOS compatibility checks when hardware is available. |
| Native media following UI validation | Service contracts and the handoff's platform mapping | Measure route safety, latency, recoverability and sync on physical hardware. Inspect real exported files for format, duration and readability. |

## Conflicts and risks

| Finding | Impact and acceptance decision |
|---|---|
| Handoff C describes a studio modal that hides the dock. The addendum and current prototype retain it. | Follow the addendum for shell placement and save-on-tab behavior. Keep the camera and export navigation locks. |
| Handoff F gives sliders a 32 px hit area; the hard minimum is 44 px. | Preserve the visual knob and track geometry. Enlarge the interaction area and check adjacent touch targets. Apply the same rule to compact segments and switches. |
| Token contrast varies by surface. `#7C7F88` is 4.98:1 on obsidian, 4.53:1 on graphite and 4.12:1 on elevated graphite. White against the crimson base is 4.01:1. | Use muted silver for small text over elevated graphite (6.71:1). Keep white on the Create glyph per the design and label the control for assistive technology. Verify composed states and ordinary button text separately. |
| The current login registry specifies email and Google. The previous checkout reportedly had phone OTP and onboarding. | Review the recovered routes and account model before choosing how to reconcile them with the approved design. |
| Browser timers, synthesized peaks and fixed offsets represent hardware behavior in the canvas. | Preserve the visible states. Use measured timestamps for later capture and sync, and make async operations idempotent with cancellation and ownership checks. |
| Wired monitoring needs safe routing and low latency across devices. Noise cleanup can degrade vocal quality. | Measure latency by supported route. Disable monitoring immediately on disconnect or route change. Preserve originals and compare profiles with representative vocals before release. |
| Files and metadata can diverge after app termination, storage errors or interrupted export. | Use staged writes, durable metadata updates and recovery. Test process death, missing files and retry without duplicating success records. |
| An offline device may have stale creator access or feature flags. | Define and test an explicit offline entitlement window before release. Block unverified access and refresh at launch/resume when connected. |
