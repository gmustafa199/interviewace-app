#!/usr/bin/env bash
# ============================================================================
# InterviewAce — TWA Build Script
# ----------------------------------------------------------------------------
# Wraps the live PWA into a signed Android APK ready for Google Play upload.
#
# PREREQUISITES:
#   1. Node.js 18+ and Java JDK 17+ installed
#   2. Android SDK installed (ANDROID_HOME env var set)
#   3. Bubblewrap CLI installed:  npm i -g @bubblewrap/cli
#   4. PWA deployed live on HTTPS at your domain
#   5. /.well-known/assetlinks.json deployed at your domain
#   6. Update twa/twa-manifest.json: replace INTERVIEWACE_DOMAIN_REPLACE_ME
#      with your real domain (no https://, e.g. interviewace.app)
#
# USAGE:
#   ./build-apk.sh              # interactive - generates keystore if missing
#   ./build-apk.sh --release    # release build (signed)
#   ./build-apk.sh --play-bundle # produces .aab (Android App Bundle for Play)
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TWA_DIR="$PROJECT_DIR/twa"
MANIFEST="$TWA_DIR/twa-manifest.json"
KEYSTORE="$TWA_DIR/android.keystore"

cd "$TWA_DIR"

# --- Step 1: validate domain ---
if grep -q "INTERVIEWACE_DOMAIN_REPLACE_ME" "$MANIFEST"; then
  echo "❌ ERROR: Open twa/twa-manifest.json and replace INTERVIEWACE_DOMAIN_REPLACE_ME"
  echo "   with your real domain (e.g. interviewace.app). Then re-run this script."
  exit 1
fi

DOMAIN=$(python3 -c "import json; print(json.load(open('$MANIFEST'))['host'])")
echo "✓ Domain: $DOMAIN"

# --- Step 2: check bubblewrap installed ---
if ! command -v bubblewrap >/dev/null 2>&1; then
  echo "⚠️  Bubblewrap CLI not found. Installing globally..."
  npm install -g @bubblewrap/cli
fi

# --- Step 3: initial project init (only if not already initialized) ---
if [ ! -f "$TWA_DIR/build.gradle" ]; then
  echo "🚀 Initializing TWA project (first run only)..."
  bubblewrap init --manifest="$MANIFEST"
fi

# --- Step 4: generate keystore if missing ---
if [ ! -f "$KEYSTORE" ]; then
  echo "🔐 Generating signing keystore (one-time)..."
  keytool -genkeypair \
    -keystore "$KEYSTORE" \
    -alias android \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass:env KEYSTORE_PASSWORD \
    -keypass:env KEYSTORE_PASSWORD \
    -dname "CN=InterviewAce, OU=Mobile, O=InterviewAce, L=NA, ST=NA, C=US"
  echo ""
  echo "⚠️  SAVE THESE CREDENTIALS! If you lose them, you can never update your app:"
  echo "    Keystore: $KEYSTORE"
  echo "    Password: (whatever you set in KEYSTORE_PASSWORD env var)"
  echo "    Alias:    android"
fi

# --- Step 5: build ---
MODE="${1:--release}"
echo "🔨 Building APK ($MODE)..."

if [ "$MODE" = "--play-bundle" ]; then
  # Produces .aab — required by Google Play for new apps
  bubblewrap build --type=bundle
  echo ""
  echo "✅ Built: app-release-bundle.aab"
  echo "   Upload this file to Google Play Console."
else
  bubblewrap build
  echo ""
  echo "✅ Built: app-release-signed.apk"
  echo "   Use this for testing on real devices (sideload)."
fi

echo ""
echo "📋 NEXT STEPS:"
echo "   1. Get your app signing SHA256 from Google Play Console"
echo "      (Setup → App integrity → App signing key certificate)"
echo "   2. Paste it into public/.well-known/assetlinks.json"
echo "   3. Re-deploy the website so the file is live"
echo "   4. Upload the APK/AAB to Play Console → Production"
echo "   5. Submit for review (1-3 days)"
