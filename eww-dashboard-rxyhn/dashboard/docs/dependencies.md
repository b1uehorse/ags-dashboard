# Зависимости: что должно быть в системе

Главная причина «у меня не работает» = `command not found`, а не проблема в yuck. Сверься со списком до того как писать виджет.

## Обязательные (без них eww не запустится / не соберётся)

| Пакет (Arch) | Что это | Зачем |
|---|---|---|
| `eww` / `eww-git` | сам eww | рантайм |
| `gtk3` | GTK3 | рендер |
| `python` | python3 | deflisten-обёртки, unquote URL |
| `jq` | JSON-процессор | сборка массивов для `(for)`, парсинг api |
| nerd-font (`ttf-jetbrainsmono-nerd` / `ttf-nerd-fonts-symbols`) | шрифт с глифами | все иконки в виджетах |

Проверка:
```bash
for c in eww python3 jq fc-list; do
    command -v $c >/dev/null && echo "✓ $c" || echo "✗ MISSING: $c"
done
fc-list | grep -qi "nerd" && echo "✓ nerd-font" || echo "✗ MISSING: nerd-font"
```

## Системные данные (нужны конкретным виджетам)

| Команда | Пакет (Arch) | Нужна для |
|---|---|---|
| `playerctl` | `playerctl` | music (MPRIS) — artist/title/play-pause/artUrl |
| `brightnessctl` | `brightnessctl` | яркость экрана |
| `wpctl` | `wireplumber` | volume (PipeWire) |
| `pactl` | `pulseaudio-utils` | volume (PulseAudio) — если у тебя не PipeWire |
| `hyprctl` | `hyprland` | Hyprland workspace/window info |
| `inotifywait` | `inotify-tools` | deflisten для file-change |
| `dbus-monitor` | `dbus` | deflisten для dbus-signals |
| `nmcli` | `networkmanager` | состояние сети/wi-fi |
| `bluetoothctl` | `bluez-utils` | bluetooth-статус |
| `acpi` / `acpi_listen` | `acpi` / `acpid` | battery/brightness events |
| `curl` | `curl` | погода, api-запросы (**только в отдельных cache-скриптах**, не в defpoll!) |

## Опциональные (для конкретных recipes)

| Команда | Пакет | Где используется |
|---|---|---|
| `socat` | `socat` | альтернатива python-обёртке для unix-socket listener (в доках используется python) |
| `ncat` / `nmap-netcat` | `nmap` | то же |
| `inotify-tools` | `inotify-tools` | event-driven file change |
| `betterlockscreen` | `betterlockscreen` | lock из powermenu |
| `swaylock` | `swaylock-effects` | альтернатива lock на Wayland |

## Быстрая проверка окружения

```bash
#!/usr/bin/env bash
# scripts/check-env — запусти один раз после клонирования конфига
REQ="eww python3 jq"
OPT="playerctl brightnessctl hyprctl inotifywait wpctl"

echo "=== обязательные ==="
for c in $REQ; do command -v $c >/dev/null && echo "✓ $c" || echo "✗ MISSING: $c"; done
echo "=== опциональные ==="
for c in $OPT; do command -v $c >/dev/null && echo "✓ $c" || echo "   skip: $c"; done

echo "=== шрифты ==="
fc-list | grep -qi "nerd" && echo "✓ nerd-font" || echo "✗ nerd-font не установлен"
fc-list | grep -qi "comic mono" && echo "✓ comic mono" || echo "   skip: comic mono (можно заменить на JetBrainsMono)"
fc-list | grep -qi "cartograph" && echo "✓ cartograph CF" || echo "   skip: cartograph (можно заменить на JetBrainsMono Italic)"
```

## Чем заменить если нет

| Нет | Чем заменить |
|---|---|
| `jq` | `python3 -c "import json,sys; ..."` — медленнее, но работает |
| `inotifywait` | polling каждые N секунд через `stat -c %Y file` сравнение |
| `socat`/`ncat` | python-обёртка (встроенная в рецепте live-data) |
| `playerctl` | нет полноценной замены; можно `dbus-send` вручную, но много кода |
| `brightnessctl` | `echo N > /sys/class/backlight/*/brightness` (нужен root) |
| Comic Mono / Cartograph CF | `JetBrainsMono Nerd Font` (бесплатный, покрывает большую часть use-case'ов) |

## Установка одной командой (Arch / CachyOS)

```bash
# базовое
sudo pacman -S eww jq python ttf-jetbrains-mono-nerd inotify-tools

# для music/media
sudo pacman -S playerctl brightnessctl wireplumber

# для сетевого/системного
sudo pacman -S networkmanager bluez-utils acpi
```

Если пакета нет в `extra`/`community` — проверь в AUR через `paru` / `yay`.
