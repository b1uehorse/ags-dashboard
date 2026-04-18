# Рецепт: live-data (событийный поток через deflisten)

Когда `defpoll` неэффективен — источник сам сигналит о событиях. Примеры: Hyprland workspace switch, изменения `~/.todo.txt`, MPRIS play/pause, mako-уведомления, brightness через acpi.

## Зачем не polling

- **Реактивно** — линия в stdout → мгновенный редрой, без задержки interval.
- **Экономно** — ничего не делаем в idle.
- **Точно** — не пропустим быстрое изменение между двумя pollами.

## Ожидаемый результат

Переменная обновляется каждый раз когда источник шлёт событие.

## Сборка (5 минут)

### 1. Скрипт-листенер

Шаблон `scripts/hypr-ws-listener`:

```bash
#!/usr/bin/env bash
# печатает номер workspace на каждое переключение
# Обязательно — внешний while true, чтобы пережить рестарт Hyprland/ротацию сокета
set -u

while true; do
    # HYPRLAND_INSTANCE_SIGNATURE — каноничный источник; fallback: выбираем ПЕРВУЮ
    # директорию, в которой лежит живой .socket2.sock (исключает трупы упавших сессий)
    if [ -n "${HYPRLAND_INSTANCE_SIGNATURE:-}" ]; then
        SIG="$HYPRLAND_INSTANCE_SIGNATURE"
    else
        SIG=""
        for dir in $(ls -t /run/user/$(id -u)/hypr 2>/dev/null); do
            if [ -S "/run/user/$(id -u)/hypr/$dir/.socket2.sock" ]; then
                SIG="$dir"; break
            fi
        done
    fi
    if [ -z "$SIG" ]; then
        sleep 2; continue
    fi
    SOCK="/run/user/$(id -u)/hypr/$SIG/.socket2.sock"

    # начальное значение — чтобы eww не застрял на пустой строке
    hyprctl activeworkspace -j 2>/dev/null | \
        python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])' 2>/dev/null

    # стрим событий через python (socat/ncat на хосте не всегда)
    python3 -u -c '
import socket, sys, re
try:
    s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    s.connect(sys.argv[1])
    buf = b""
    while True:
        chunk = s.recv(4096)
        if not chunk: break
        buf += chunk
        while b"\n" in buf:
            line, buf = buf.split(b"\n", 1)
            line = line.decode(errors="replace")
            m = re.match(r"workspace>>(\d+)", line)
            if m:
                print(m.group(1), flush=True)
except (ConnectionRefusedError, FileNotFoundError):
    pass  # сокет исчез — внешний while переподключится
' "$SOCK"

    # сокет закрылся/Hyprland упал — ждём и пытаемся снова
    sleep 2
done
```

Сделать исполняемым: `chmod +x scripts/hypr-ws-listener`.

**Ключевые правила**:
- Первая строка — **стартовое значение**, иначе eww до первого события держит пустоту
- `python3 -u` или `flush=True` — иначе stdout буферизуется строками по 4K
- Скрипт **не должен выходить** — eww не рестартит
- Ошибки в stderr, stdout только для значений

### 2. Переменная

```yuck
;; src/yuck/_variables.yuck
(deflisten current-ws :initial "1"
    "${EWWCONFIGDIR}/scripts/hypr-ws-listener")
```

`:initial` — страховка пока listener стартует.

### 3. Виджет

```yuck
(defwidget ws-dots []
    ;; важно: элементы в массиве — СТРОКИ, чтобы сравнение с current-ws (тоже строка) работало надёжно
    (box :class "ws-dots" :orientation "h" :space-evenly false :spacing 6
        (for i in "[\"1\",\"2\",\"3\",\"4\",\"5\"]"
            (label :class "ws-dot ${current-ws == i ? 'active' : ''}"
                   :text "●"))))
```

`(for i in array)` — yuck-цикл, массив JSON-строкой. Каждый элемент даёт `i`.

### 4. SCSS

```scss
// src/scss/widgets/ws-dots.scss
.ws-dots {
    @include tile;
    padding: .5rem 1rem;
    border-radius: 999px;
}
.ws-dot {
    color: $foreground;
    opacity: .4;
    font-size: 1.2em;
    padding: 0 4px;
    &.active { color: $blue; opacity: 1; }
}
```

### 5. Вставить + reload

```yuck
;; в dashboard композиции
(ws-dots)
```

```bash
eww -c ~/.config/eww/dashboard reload
```

## Другие источники для deflisten

### DBus события (уведомления, MPRIS)

```bash
dbus-monitor --session "type='signal',interface='org.freedesktop.Notifications',member='Notify'" | \
    while read -r line; do
        [[ "$line" == *"string"* ]] && echo "new-notif" && flush
    done
```

### File change

```bash
#!/usr/bin/env bash
FILE="$HOME/.todo.txt"
# первое значение
grep -c '^[^#]' "$FILE"
# стрим
while inotifywait -qq -e modify "$FILE"; do
    grep -c '^[^#]' "$FILE"
done
```

### MPRIS playerctl

```bash
playerctl -F metadata --format '{{status}}|{{artist}}|{{title}}'
```

Формат ANY — но eww получит строку целиком, парсь в виджете или в скрипте-обёртке.

### Brightness / volume

```bash
# инсталл: acpid + acpi_listen
acpi_listen | awk '/brightness/ {system("brightnessctl g"); fflush()}'
```

## Паттерн: один листенер — много переменных

Если из одного источника тянешь несколько полей (artist+title+status), либо:

- **Вариант А**: один `deflisten` + парсинг в виджете через `split()`:
  ```yuck
  (deflisten mpris :initial "||" "...playerctl...")
  ;; в виджете
  (label :text "${arraylength(split(mpris, '|')) > 1 ? split(mpris, '|')[1] : ''}")
  ```

- **Вариант Б**: несколько `defpoll` c playerctl-флагами (проще читать, чуть менее реактивно).

В rxyhn выбран Б (см. music). Для новых виджетов рекомендую **А** — экономит процессы.

## Частые ошибки

| Симптом | Причина |
|---|---|
| Переменная всегда пустая | Забыл `flush=True` в python / `-oL` в bash |
| Обновляется раз в 30 сек лагами | stdout-буфер 4K, строки накапливаются |
| Переменная пустая пока не случится событие | Не напечатал стартовое значение до цикла |
| Листенер «умер» после первого события | Забыл `while true` / exit-после-обработки |
| eww ругается «listener script failed» | Скрипт падает на старте, проверь через `bash -x scripts/..` в терминале |

## Чеклист

- [ ] Первый `print` в скрипте — начальное значение
- [ ] `python3 -u` или `flush=True`
- [ ] Скрипт не выходит (есть бесконечный цикл или блокирующий read)
- [ ] `:initial` задан в `deflisten` — страховка на старте
- [ ] `chmod +x scripts/NAME`
- [ ] Путь абсолютный, не относительный
- [ ] `eww logs` чистый после reload
