# Experiments

Экспериментальные виджеты — где проверяем идеи, которые потом могут уехать в `widgets/` или остаться тут.

**В `app.ts` по умолчанию НЕ регистрируются** — раскомментировать вручную когда хочется попробовать.

---

## `QuickCmd`

Мини-терминал: поле ввода прибитое снизу экрана. Enter — выполнить команду, результат показывает под инпутом (80 символов). Не полноценный терминал, только fire-and-forget команды.

Полезно для «kill -9 что-то», «открой файл», «снять скрин», быстрого `git status` в PWD.

**Hyprland bind:**
```
bind = SUPER, space, exec, ags toggle-window quickcmd
```

---

## `NowPlayingTicker`

Маленькая плашка в правом верхнем углу с текущим треком (MPRIS). Исчезает если ничего не играет (показывает "— silence —").

Удобно если убрал основной дашборд но хочешь видеть кто играет.

---

## `CpuSparkline`

Столбчатый график последних 30 секунд загрузки CPU. Рисуется без canvas — просто N прямоугольников с computed height.

Основа для других sparkline-ов (network, disk IO, battery drain rate).

---

## `WorkspaceDots`

Точки-индикаторы workspace Hyprland в нижней части экрана. Кликабельные — переключают ws. Активная подсвечивается.

Альтернатива waybar-workspaces.

---

## `NtfyLog`

Опрашивает `ntfy.sh/kk_alert` каждые 10с (`?poll=1&since=1m`), показывает последнее уведомление. Помогает когда пушу сам себе пуши и хочу видеть их на десктопе, а не только на айфоне.

---

## `PinnedWidget`

Демо виджета, который привязывается к конкретному workspace через обычное (XDG) окно + Hyprland `windowrule`. В отличие от layer-shell-дашборда (виден везде), этот появляется только когда активен его ws.

См. файл — в шапке расписаны нужные windowrule.

---

## Идеи для следующих экспериментов

- **ScreenDimmer** — прозрачный full-screen overlay по таймеру фокуса (pomodoro).
- **ClipboardHistory** — список последних `wl-paste` записей + hotkey вставки.
- **QuickNotes** — текстарея с fs-persistent контентом (`~/.ags-notes.txt`).
- **BluetoothToggle** — тайл с текущим статусом + список устройств (через `libastal-bluetooth`).
- **WifiPicker** — выбор SSID (через `libastal-network`).
- **PowerMenu** — shutdown/reboot/lock/suspend в виде 4 больших кнопок, появляется по binду.
- **ScreenshotTool** — `grim -g "$(slurp)"` с превью и кнопкой «скопировать в буфер».
- **GithubNotif** — пуллить `gh api notifications` каждые 60с, показывать бейдж.
- **DockerList** — `docker ps --format …` в тайл, с кнопками stop/restart.
- **K8sContext** — для работы если надо, индикатор текущего kubectl context.
- **GtdInbox** — быстрое добавление строк в `~/.todo.txt` через `<entry>`.
- **MattermostBadge** — сколько непрочитанных в MM (через наш ретранслятор API).
