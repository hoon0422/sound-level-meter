# Decibella Sound Level Meter

[한국어](README.ko.md)

Decibella is an Expo / React Native sound level meter app for real-time microphone-based noise monitoring. It shows live dB readings, time and frequency graphs, contextual sound examples, a simple rocket feedback game, calibration controls, and saved recording logs.

The app is designed as a practical mobile sound guide, not as a certified laboratory sound level meter. Readings depend on the device microphone, operating system audio path, environment, and the user's calibration offset.

## Key Features

- **Live sound meter**: Displays current, average, and maximum dB values with an animated gauge.
- **dB over time graph**: Draws a live 0-120 dB timeline using Skia.
- **Frequency graph**: Shows spectrum bands from 32 Hz through 20 kHz using FFT-derived analyzer data.
- **Sound Guide**: Maps measured dB ranges to familiar real-world sound examples and localized labels.
- **Rocket feedback game**: Uses current dB levels to drive a small rocket animation, giving users a playful visual response to loudness.
- **Recording controls and history**: Tracks elapsed recording time and saves duration, min, max, and average dB after a measurement session stops.
- **Calibration**: Lets users adjust a persistent offset from -20.0 dB to +20.0 dB in 0.1 dB steps.
- **Localization**: Supports English, Korean, Japanese, Simplified Chinese, Traditional Chinese, French, and Spanish.
- **Theme support**: Provides light and dark app themes.
- **Rewarded-ad access flow**: Gates long measurements, Sound Guide, and recording logs behind temporary rewarded-ad access.
- **Foreground-only recording policy**: Stops recording when the app leaves the active state and keeps the screen awake while recording is active.
- **Observability**: Includes Sentry tracing/error reporting and optional Amplitude event tracking.

## Screenshots

<table>
  <tr>
    <td align="center"><img src="docs/screenshots/db-time.png" alt="dB Time screen" width="220"><br><sub>dB/Time</sub></td>
    <td align="center"><img src="docs/screenshots/db-freq.png" alt="dB Frequency screen" width="220"><br><sub>dB/Freq</sub></td>
    <td align="center"><img src="docs/screenshots/sound-guide.png" alt="Sound Guide screen" width="220"><br><sub>Sound Guide</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/records.png" alt="Records screen" width="220"><br><sub>Records</sub></td>
    <td align="center"><img src="docs/screenshots/settings.png" alt="Settings screen" width="220"><br><sub>Settings</sub></td>
    <td align="center"><img src="docs/screenshots/calibration.png" alt="Mic Calibration screen" width="220"><br><sub>Mic Calibration</sub></td>
  </tr>
</table>

## Quick Tour

Use this flow to understand the app quickly:

1. Open the app and grant microphone permission.
2. Start a recording from the main graph layout.
3. Watch the gauge, current/AVG/MAX readings, dB-over-time graph, frequency bars, Sound Guide, and rocket feedback respond to sound.
4. Stop recording and open the Log tab to inspect the saved session summary.
5. Open Settings, then review Calibration, Language, Theme, Credits, Open Source, Sunny's Games and Apps, and external links.
6. Try leaving the app or locking the screen while recording. The app should stop recording because background measurement is intentionally not supported.

Implementation notes worth reviewing:

- How `react-native-audio-api` feeds the microphone engine and analyzer data.
- How Zustand slices separate microphone lifecycle, audio metrics, spectrum data, stats, and graph state.
- Why UI-thread rendering uses Reanimated shared values and Skia for responsive visual updates.
- How calibration is intentionally a single broadband offset rather than per-frequency response correction.
- Why background recording was avoided in favor of a simpler foreground-only privacy model.
- How app configuration is environment-driven so multiple local agent builds can install independently.

## App Architecture

| Area                 | Main files                                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Routing and tabs     | `app/(tabs)/_layout.tsx`, `app/(tabs)/db-time.tsx`, `app/(tabs)/db-freq.tsx`, `app/(tabs)/sound-guide.tsx`, `app/(tabs)/log.tsx` |
| Main graph layout    | `components/GraphTabLayout.tsx`                                                                                                  |
| Live meter           | `components/SoundMeter.tsx`                                                                                                      |
| dB/time graph        | `components/SoundGraph.tsx`, `audio/dbTimeGraph/`                                                                                |
| Frequency graph      | `components/FrequencyBarGraph.tsx`, `audio/spectrum/`                                                                            |
| Sound Guide          | `components/SoundGuide.tsx`, `assets/icons/sound-guide/`                                                                         |
| Rocket feedback      | `components/RocketGamePage.tsx`, `assets/rocket/`                                                                                |
| Recording control    | `hooks/useRecordingControls.ts`, `components/RecordButton.tsx`                                                                   |
| Recording logs       | `hooks/useRecordingLogger.ts`, `store/logsStore.ts`, `components/RecordingLogCard.tsx`                                           |
| Foreground lifecycle | `hooks/useRecordingAppLifecycle.ts`                                                                                              |
| Calibration          | `app/settings/calibration.tsx`, `store/calibrationStore.ts`                                                                      |
| Localization         | `context/LanguageContext.tsx`, `i18n/index.ts`, `locales/*.json`                                                                 |
| Theme                | `context/ThemeContext.tsx`, `components/themes.ts`                                                                               |
| Rewarded ads         | `context/AdAccessContext.tsx`                                                                                                    |
| Analytics and errors | `analytics/events.ts`, `analytics/sentry.ts`                                                                                     |
| Expo/native config   | `app.config.js`, `plugins/`                                                                                                      |

## Technical Stack

- Expo SDK 54 with Expo Router
- React Native 0.81 and React 19
- TypeScript
- Zustand for app and audio state
- `react-native-audio-api` for microphone/audio analysis
- Reanimated and Worklets for UI-thread animation
- Skia for graph rendering
- AsyncStorage for persisted logs, calibration, language, and ad-access state
- `react-native-google-mobile-ads` for rewarded ads
- Sentry and Amplitude for production diagnostics and product analytics
- i18next / react-i18next / expo-localization for localization

## Audio Pipeline

The app configures the microphone engine with a 44.1 kHz sample rate and 1024 FFT size. Microphone data flows through the audio engine, then into separate state slices for:

- microphone connection and recording lifecycle
- current, average, minimum, and maximum dB metrics
- frequency spectrum bars and peaks
- running statistics
- the dB/time graph path

Visual components read either Zustand state or Reanimated shared values depending on update frequency. Fast-moving UI such as the meter needle, spectrum bars, Sound Guide, and rocket animation uses shared values to avoid unnecessary React renders.

## Recording and Privacy Model

Recording is intentionally foreground-only:

- The app requests microphone access before starting measurement or calibration.
- Recording stops when React Native `AppState` is no longer `active`.
- `expo-keep-awake` keeps the screen awake only while recording is active.
- Saved logs are created only after a measurement session with a positive duration.
- Calibration sessions are separate from measurement sessions and do not create normal recording logs.

## Settings

Settings includes:

- Calibration
- Language selection
- Light/dark theme selection
- Social links
- Sunny's Games and Apps
- Credits
- Open source information
- App version
- Terms and privacy policy links

The language system follows the device language until the user manually chooses a supported language. iOS microphone permission strings are generated from locale files through the custom Expo config plugin.
