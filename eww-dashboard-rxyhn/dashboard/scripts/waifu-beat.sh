#!/usr/bin/env bash
# waifu-beat — слушает звук через cava, управляет mpv:
#   есть звук → unpause + seek +0.05 (дёргает кадр для "прыжка")
#   тишина   → pause
# Запускать после waifu-play.sh.
set -u

SOCK="/tmp/mpv-waifu.sock"
THRESHOLD=15    # 0..100 — ниже чего считаем "тишиной"

# однобаровая cava с частым rate
TMPCONF=$(mktemp --suffix=.conf)
cat > "$TMPCONF" <<EOF
[general]
bars = 1
framerate = 20
sensitivity = 100
autosens = 1
[output]
method = raw
raw_target = /dev/stdout
data_format = ascii
ascii_max_range = 100
bar_delimiter = 59
frame_delimiter = 10
[smoothing]
integral = 70
monstercat = 1
gravity = 80
EOF

trap 'rm -f "$TMPCONF"' EXIT

send() {
    [ -S "$SOCK" ] || return 0
    echo "{\"command\":$1}" | socat - "$SOCK" >/dev/null 2>&1 || \
    echo "{\"command\":$1}" | nc -U "$SOCK" >/dev/null 2>&1 || \
    python3 -c '
import socket, sys, json
s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
s.connect(sys.argv[1])
s.sendall((sys.argv[2] + "\n").encode())
s.close()
' "$SOCK" "{\"command\":$1}" 2>/dev/null
}

last_state=""

cava -p "$TMPCONF" 2>/dev/null | while IFS=';' read -r v _rest; do
    v="${v%?}"  # отрезаем frame delimiter если он попал
    v="${v##*[!0-9]}"
    [ -z "$v" ] && continue

    if [ "$v" -gt "$THRESHOLD" ]; then
        if [ "$last_state" != "on" ]; then
            send '["set_property","pause",false]'
            last_state=on
        fi
        # дёргаем seek для визуальной реакции
        send '["seek",0.05,"relative"]'
    else
        if [ "$last_state" != "off" ]; then
            send '["set_property","pause",true]'
            last_state=off
        fi
    fi
done
