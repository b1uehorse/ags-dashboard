#!/usr/bin/env bash
# waifu-play — запускает танцующую вайфу в маленьком прозрачном окне mpv
# Usage:
#   waifu-play              — случайная из ~/waifus/*.gif
#   waifu-play /path.gif    — конкретный файл
#   waifu-play --stop       — убить текущую
set -u

DIR="$HOME/waifus"
SOCK="/tmp/mpv-waifu.sock"
PIDFILE="/tmp/mpv-waifu.pid"

case "${1:-}" in
    --stop)
        [ -f "$PIDFILE" ] && kill "$(cat "$PIDFILE")" 2>/dev/null
        rm -f "$PIDFILE" "$SOCK"
        exit 0
        ;;
    "")
        FILE="$(find "$DIR" -maxdepth 1 -type f \( -name '*.gif' -o -name '*.webm' -o -name '*.mp4' \) | shuf -n 1)"
        ;;
    *)
        FILE="$1"
        ;;
esac

[ -f "$FILE" ] || { echo "файл не найден: $FILE" >&2; exit 1; }

# выбить старую если жива
[ -f "$PIDFILE" ] && kill "$(cat "$PIDFILE")" 2>/dev/null
rm -f "$PIDFILE" "$SOCK"

mpv \
    --no-border \
    --ontop \
    --loop-file=inf \
    --no-input-default-bindings \
    --osc=no \
    --cursor-autohide=always \
    --force-window=yes \
    --autofit=240x240 \
    --geometry=+1600+800 \
    --title=waifu-dance \
    --input-ipc-server="$SOCK" \
    --no-audio \
    --hwdec=no \
    "$FILE" >/dev/null 2>&1 &

echo $! > "$PIDFILE"
echo "started pid=$(cat $PIDFILE), sock=$SOCK, file=$(basename "$FILE")"
