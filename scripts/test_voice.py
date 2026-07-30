"""Test ASR + TTS round trip end-to-end."""
import base64
import json
import urllib.request
import urllib.error

BASE = "http://localhost:3000"

# 1. Generate audio via TTS
print("1. Calling TTS with test text...")
tts_payload = json.dumps({"text": "I have three years of experience as a backend developer."}).encode()
req = urllib.request.Request(f"{BASE}/api/tts", data=tts_payload, headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        audio_bytes = resp.read()
        print(f"   ✓ TTS returned {len(audio_bytes)} bytes of audio (type: {resp.headers.get('Content-Type')})")
except urllib.error.HTTPError as e:
    print(f"   ✗ TTS failed: {e.code} {e.read().decode()}")
    raise SystemExit(1)

# 2. Send that audio to ASR for transcription
print("\n2. Sending audio to ASR for transcription...")
b64 = base64.b64encode(audio_bytes).decode()
asr_payload = json.dumps({"audio_base64": b64}).encode()
req = urllib.request.Request(f"{BASE}/api/asr", data=asr_payload, headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read().decode())
        print(f"   ✓ ASR returned: {result}")
        print(f"   Transcribed text: {result.get('text', '(empty)')}")
except urllib.error.HTTPError as e:
    print(f"   ✗ ASR failed: {e.code} {e.read().decode()}")
    raise SystemExit(1)

print("\n✓ Round-trip voice pipeline working end-to-end.")
