#!/usr/bin/env bash
set -euo pipefail

ANDROID_HOME_DEFAULT="$HOME/Library/Android/sdk"
ANDROID_HOME="${ANDROID_HOME:-$ANDROID_HOME_DEFAULT}"
EMULATOR_BIN="$ANDROID_HOME/emulator/emulator"
ADB_BIN="$ANDROID_HOME/platform-tools/adb"

if [[ ! -x "$EMULATOR_BIN" ]]; then
  echo "[ERROR] emulator binary not found: $EMULATOR_BIN"
  echo "Install Android Emulator via Android Studio SDK Manager first."
  exit 1
fi

if [[ ! -x "$ADB_BIN" ]]; then
  echo "[ERROR] adb binary not found: $ADB_BIN"
  echo "Install Android Platform-Tools via Android Studio SDK Manager first."
  exit 1
fi

AVD_NAME="${1:-}"

if [[ -z "$AVD_NAME" ]]; then
  AVD_NAME="$("$EMULATOR_BIN" -list-avds | sed -n '1p')"
  if [[ -z "$AVD_NAME" ]]; then
    echo "[ERROR] No AVD found. Create one in Android Studio > Device Manager."
    exit 1
  fi
  echo "[INFO] No AVD name provided. Using first AVD: $AVD_NAME"
fi

if ! "$EMULATOR_BIN" -list-avds | grep -Fxq "$AVD_NAME"; then
  echo "[ERROR] AVD '$AVD_NAME' not found."
  echo "Available AVDs:"
  "$EMULATOR_BIN" -list-avds
  exit 1
fi

if "$ADB_BIN" devices | grep -q "emulator-"; then
  echo "[INFO] An emulator is already running."
  "$ADB_BIN" devices
  exit 0
fi

nohup "$EMULATOR_BIN" -avd "$AVD_NAME" >/tmp/android-emulator.log 2>&1 &

echo "[INFO] Starting emulator: $AVD_NAME"
echo "[INFO] Waiting for device boot..."
"$ADB_BIN" wait-for-device >/dev/null 2>&1 || true

for _ in {1..60}; do
  BOOT_STATE="$("$ADB_BIN" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')"
  if [[ "$BOOT_STATE" == "1" ]]; then
    echo "[OK] Emulator boot completed."
    "$ADB_BIN" devices
    exit 0
  fi
  sleep 1
done

echo "[WARN] Emulator is starting but boot check timed out."
echo "Check logs: /tmp/android-emulator.log"
"$ADB_BIN" devices || true
