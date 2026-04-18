#!/usr/bin/env bash
# слушает события Hyprland, держит eww-дашборд открытым только на PIN_WS
# Why: layer-shell окно живёт на мониторе, а не на workspace — Hyprland сам его не прячет
set -u

PIN_WS="${1:-1}"
CFG="$HOME/.config/eww/dashboard"
SIG="${HYPRLAND_INSTANCE_SIGNATURE:-}"
[ -z "$SIG" ] && SIG="$(ls -t /run/user/$(id -u)/hypr 2>/dev/null | head -1)"
SOCK="/run/user/$(id -u)/hypr/$SIG/.socket2.sock"

sync_visible() {
    local ws="$1"
    if [ "$ws" = "$PIN_WS" ]; then
        eww -c "$CFG" open dashboard 2>/dev/null
    else
        eww -c "$CFG" close dashboard 2>/dev/null
    fi
}

current_ws="$(hyprctl activeworkspace -j 2>/dev/null | grep -oP '"id":\s*\K\d+' | head -1)"
sync_visible "${current_ws:-0}"

# подписка на socket2 через python (socat/nc -U отсутствуют на хосте)
python3 -u -c '
import socket, sys
s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
s.connect(sys.argv[1])
buf = b""
while True:
    chunk = s.recv(4096)
    if not chunk: break
    buf += chunk
    while b"\n" in buf:
        line, buf = buf.split(b"\n", 1)
        print(line.decode(errors="replace"), flush=True)
' "$SOCK" | while IFS= read -r line; do
    case "$line" in
        workspace\>\>*)
            sync_visible "${line#workspace>>}"
            ;;
    esac
done
