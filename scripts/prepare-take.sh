#!/usr/bin/env bash
# Prepare a talking-head take for the effects: transcode, person matte, cut-outs, sticker borders, face position.
# macOS only (the matte and face steps use Apple's Vision framework through the Swift tools in tools/).
# usage: scripts/prepare-take.sh path/to/input.mov <name>     → public/takes/<name>/
set -euo pipefail
IN="$1"; NAME="$2"
OUT="public/takes/$NAME"
mkdir -p "$OUT"

# 1. Transcode to 1080×1920, constant 30 fps (cover-crop to 9:16), keeping the audio.
ffmpeg -y -loglevel error -i "$IN" -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1" \
	-c:v libx264 -crf 16 -preset medium -pix_fmt yuv420p -c:a aac -b:a 320k -movflags +faststart "$OUT/take.mp4"

# 2. Compile the Swift tools once.
[ -x tools/matte ] || swiftc -O tools/matte.swift -o tools/matte
[ -x tools/face ] || swiftc -O tools/face.swift -o tools/face

# 3. Per-frame person masks (Vision), 4. RGBA cut-outs, 5. sticker borders.
tools/matte "$OUT/take.mp4" "$OUT/masks"
python3 scripts/make-fg.py "$OUT/take.mp4" "$OUT/masks" "$OUT/fg"
python3 scripts/make-sticker-mattes.py "$OUT/fg" "$OUT/sticker"

# 6. Face position, then the FxSource to paste into src/edit/edit.json.
FACE=$(tools/face "$OUT/take.mp4" 2>/dev/null)
FRAMES=$(ls "$OUT/fg" | grep -c '\.webp$')
cat > "$OUT/source.json" <<JSON
{ "video": "takes/$NAME/take.mp4", "matte": "takes/$NAME/fg", "sticker": "takes/$NAME/sticker", "frames": $FRAMES, "face": $FACE, "continuous": true }
JSON
cat "$OUT/source.json"
