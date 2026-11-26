# design/

- `SUSHIFYYYY_CODEX_HANDOFF.md` is the full spec (sections A–I).
- `theme.ts` holds the design tokens.
- `prototype/` holds the interactive prototype source. Codex reads these files for exact layout and copy. They need the design canvas's runtime, so they won't open on their own in a browser.
- `screens/` is where you add your screenshots. Open the canvas in Play mode, screenshot each screen, and save them with names like `S03-home.png` or `S05-recorder-recording.png`. Codex matches its work against these images.
