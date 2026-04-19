# Remote workflow: правки из macOS, eww крутится на betrayer

Конфиг редактируется на маке в этом репо, raccoон-синхронизируется в `~/.config/eww/dashboard/` на `bekh@100.100.166.114` (CachyOS + Hyprland).

## Синхронизация кода

```bash
rsync -av --exclude='.git' \
  ~/betrayer_widgets/eww-dashboard-rxyhn/dashboard/ \
  bekh@100.100.166.114:~/.config/eww/dashboard/
```

## Запуск eww/grim по SSH из macOS

GTK/Wayland процессы требуют явного окружения — наследованный env по SSH не годится. Нужны три переменных: `XDG_RUNTIME_DIR`, `WAYLAND_DISPLAY`, `HYPRLAND_INSTANCE_SIGNATURE`.

**HIS определяется по живому `hyprland.lock`**, не по времени модификации директории (в `/run/user/1000/hypr/` может быть мусор от прошлых сессий):

```bash
HIS=$(for d in /run/user/1000/hypr/*/; do
  [ -f "$d/hyprland.lock" ] && basename "$d"
done | head -1)
```

**Wayland socket** тоже надо найти — обычно `wayland-1`, но после логина может быть `wayland-0/2`:

```bash
ls /run/user/1000/ | grep '^wayland-[0-9]*$'
```

## Полный цикл "правка → скрин"

```bash
# локально: rsync
rsync -av --exclude='.git' \
  ~/betrayer_widgets/eww-dashboard-rxyhn/dashboard/ \
  bekh@100.100.166.114:~/.config/eww/dashboard/

# SSH + heredoc с нужным env
ssh bekh@100.100.166.114 'bash -s' <<'EOF'
export XDG_RUNTIME_DIR=/run/user/1000
export WAYLAND_DISPLAY=wayland-1
HIS=$(for d in /run/user/1000/hypr/*/; do [ -f "$d/hyprland.lock" ] && basename "$d"; done | head -1)
export HYPRLAND_INSTANCE_SIGNATURE=$HIS

eww -c ~/.config/eww/dashboard kill
sleep 1
eww -c ~/.config/eww/dashboard daemon >/dev/null 2>&1 &
sleep 2
eww -c ~/.config/eww/dashboard open dashboard
sleep 2
grim ~/dash.png
EOF

# обратно на мак
scp bekh@100.100.166.114:~/dash.png /tmp/dash.png
```

## `reload` vs `kill`

`eww reload` не всегда пересобирает scss — если правки визуально не применились, делай полный `kill` + `daemon` + `open`. Особенно важно после изменений yuck структуры (`:width`, новые классы).

## Симметрия колонок (рецепт)

Чтобы левая и правая колонки были одной ширины относительно центра, `min-width` на отдельных tile недостаточно: содержимое (например `.album_art` с большим padding) раздувает tile сверх min-width, колонка теряет симметрию.

Решение — жёсткий `:width` на внешнем боксе колонки в yuck:

```yuck
(defwidget col-left []
    (box :orientation "v" :space-evenly "false" :width 200 :class "side-col"
        (profile) (ccu-tile) (sticker)))

(defwidget col-right []
    (box :orientation "v" :space-evenly "false" :width 200 :class "side-col"
        (music) (oscillo) (quickcmd)))
```

`:width` на box — eww понимает это как hint, GTK зажимает колонку, внутренние tile подтягиваются.

## SSH pkill self-kill gotcha

`ssh host 'pkill -f "<pattern>"'` убьёт сам ssh-процесс, если tailscaled/sshd включает полную команду в свой cmdline. Обход — heredoc с экранированной точкой в регексе: `pkill -f "term_widget\.py"`.
