# Dependency audit

The design checkout has no package manifest, lockfile or installed project dependency graph. Version compatibility, maintenance status, licenses and vulnerability findings are pending until the app checkout or a new foundation provides concrete versions.

| Proposed dependency | Role and acceptance check |
|---|---|
| `expo`, `react`, `react-native`, `expo-router` | Pin the SDK, React and React Native together. Check resolved versions with Expo tooling. Verify route entry, Android bundle and native-build support. |
| `react-native-reanimated`, `react-native-gesture-handler`, `react-native-safe-area-context` | Dock motion, gesture controls and safe-area layout. Confirm ABI and plugin compatibility, including the Worklets dependency when required by the pinned Reanimated version. |
| `react-native-svg`, `@shopify/react-native-skia` | Exact icons/dock shape and waveform paths. Verify Android rendering and confirm that the native binary supports the selected versions. |
| `expo-font`, `@expo-google-fonts/inter` | Bundle Inter weights from the theme and review font redistribution terms. Confirm startup without a network font request. |
| `expo-haptics`, `expo-sqlite` | Opt-in feedback and local metadata. Verify no-op haptics behavior on unsupported hardware and transactional schema migrations. |
| `expo-document-picker`, `expo-camera`, `expo-media-library`, `expo-file-system` | Local file import, camera, final save and sandbox access. Check permission declarations, file lifecycle and Android scoped-storage behavior before enabling native integrations. |
| `zustand` | Per-project workflow and preferences. Verify hydration and persistence ordering. |
| `@supabase/supabase-js` | Creator authorization metadata. Validate mobile token storage and refresh behavior, network boundaries and server-side role checks. |
| TypeScript and Expo ESLint config | Match the chosen SDK template and run strict type checking and lint on the committed lockfile. |

Install SDK-managed libraries with `expo install` and verify the resolution with `expo install --check` and Expo Doctor. Review package provenance, supported SDK/React Native versions, release activity, declared and bundled licenses, native permissions and direct/transitive advisories for the pinned graph. Run the package manager's vulnerability audit in CI and record remediation or a scoped exception for any relevant finding. [Expo CLI](https://docs.expo.dev/more/expo-cli/) · [Expo SDK reference](https://docs.expo.dev/versions/latest/)

Keep canvas `support.js` and the prototype's remote Google Fonts stylesheet outside the app dependency graph. Test custom native modules with a development build that includes those modules. [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/)
