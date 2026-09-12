#!/usr/bin/env bash
# Emergency delivery: upload InterviewAce build files to temp file hosts
set -u
DL=/home/z/my-project/download
ZIP="$DL/app-android.zip"
AAB="$DL/interviewace-v1.0.0.aab"
APK="$DL/interviewace-v1.0.0-test.apk"

echo "=== file.io (single-use, auto-delete after 1 download) ==="
for f in "$ZIP" "$AAB" "$APK"; do
  resp=$(curl -sL -m 90 -F "file=@$f" https://file.io)
  echo "$(basename $f): $resp" | head -c 400; echo ""
done

echo ""
echo "=== bashupload.com (single download, 3 days) ==="
for f in "$ZIP" "$AAB" "$APK"; do
  resp=$(curl -s -m 90 -T "$f" https://bashupload.com/$(basename $f))
  echo "$(basename $f): $resp" | grep -E "wget|curl|http" | head -1
done

echo ""
echo "=== tmpfiles.org (60 min expiry) ==="
for f in "$ZIP" "$AAB" "$APK"; do
  resp=$(curl -sL -m 90 -F "file=@$f" https://tmpfiles.org/api/v1/upload)
  echo "$(basename $f): $resp" | head -c 300; echo ""
done

echo ""
echo "=== transfer.sh ==="
for f in "$ZIP" "$AAB" "$APK"; do
  resp=$(curl -sL -m 90 --upload-file "$f" "https://transfer.sh/$(basename $f)")
  echo "$(basename $f): $resp" | head -c 300; echo ""
done
