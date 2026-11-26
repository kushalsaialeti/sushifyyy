# Engineering decisions

## Repository and app structure

Preserve the design folder and use the root Expo Router layout prescribed by the handoff. If the existing app is recovered, keep its working modules and routes and reconcile any differences with the registry. A monorepo offers little benefit for a single mobile deliverable with first-party server functions. Use `app/` for route composition, `src/components/` for shared UI, `src/services/` for media interfaces and adapters, and storage and auth modules under `src/`. Add Supabase functions and migrations under `supabase/` at the authorization stage.

The handoff governs routing and data boundaries. The prototype governs visual details and copy, including the current signed-in dock. Adapt to native controls rather than depending on the canvas runtime. Copy design tokens to `src/theme/theme.ts` in the foundation stage.

## Local workflow and media

Keep project workflow state in Zustand and persist metadata in SQLite. Store recordings and imported media in the app sandbox. Scope project visibility to the owning account on shared devices. Preserve raw audio and store edits as parameters. Save export state only after the adapter reports a verified output, or show explicitly simulated output during the mock phase. Pass cancellation and failures through `AudioEngine`, `VideoRecorder` and `Exporter` so the UI is testable before native integration.

## Authorization and trust boundaries

Use Supabase for identity, creator access and feature policy. Keep media local. Store mobile session credentials using platform-backed secure storage. Recheck authorization on cold launch and resume. RLS scopes creator reads to the authenticated account. Administrative writes go through an Edge Function that verifies the server-side Super Admin role and records the mutation with an audit entry. Restrict service credentials to the server. Test unauthenticated and cross-account reads, revoked access, unprivileged admin calls and server-side feature visibility. [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

## Delivery sequence

Phase 0 covers the available repository and design. Follow `CODEX_PROMPTS.md` one stage at a time after review. Validate each stage against its intended entry points, record test and device evidence, and measure audio routing, latency and sync with real hardware before advancing native media work. The [gap analysis](IMPLEMENTATION_GAP_ANALYSIS.md) records stage acceptance and outstanding risks.
