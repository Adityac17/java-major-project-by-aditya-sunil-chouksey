#!/bin/bash
# Renders an SVG to PNG (2x) and optionally PDF using Google Chrome in headless mode.
# usage: render.sh input.svg output.png [output.pdf]
set -e
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SVG="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
PNG="$2"; PDF="$3"
W=$(grep -o 'width="[0-9]*"' "$SVG" | head -1 | grep -o '[0-9]*')
H=$(grep -o 'height="[0-9]*"' "$SVG" | head -1 | grep -o '[0-9]*')
HTML="${SVG%.svg}.render.html"
printf '<!doctype html><html><head><style>@page{size:%spx %spx;margin:0}html,body{margin:0;padding:0;background:#fff}img{display:block}</style></head><body><img src="%s" width="%s" height="%s"></body></html>' "$W" "$H" "$(basename "$SVG")" "$W" "$H" > "$HTML"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 --window-size=$W,$H --screenshot="$PNG" "file://$HTML" 2>/dev/null
if [ -n "$PDF" ]; then "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="$PDF" "file://$HTML" 2>/dev/null; fi
rm -f "$HTML"
