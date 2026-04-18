# Рецепт: stat-tile (значение + иконка + подпись)

Классический блок «показать метрику» — загрузка CPU, uptime, свободное место, число писем и т.п.

## Ожидаемый вид

```
┌──────────────────┐
│  ⏱  up 3d 5h    │
└──────────────────┘
```

Или многострочный:
```
┌──────────────────┐
│  CPU             │
│  ██████░░  62%   │
└──────────────────┘
```

## Сборка (3 минуты)

### 1. Переменная

```yuck
;; src/yuck/_variables.yuck
(defpoll cpu-load :interval "5s" :initial "—"
    "awk '{print int($1*100)}' /proc/loadavg")
```

`/proc/loadavg` возвращает `0.52 0.44 0.30 ...` — умножаем на 100 и в int.

### 2. Виджет

Используем (если есть в `components.md`) примитив `stat-row`, иначе руками:

```yuck
;; src/yuck/_widgets.yuck
(defwidget cpu-stat []
    (box :class "tile stat-tile" :orientation "v" :space-evenly false :spacing 4
        (label :class "stat-title" :text "CPU" :halign "start")
        (box :orientation "h" :space-evenly false :spacing 8
            (label :class "stat-icon" :text "")         ;; nerd-font cpu
            (label :class "stat-value" :text "${cpu-load}%"))))
```

### 3. SCSS

```scss
// src/scss/widgets/cpu-stat.scss
.stat-tile {
    @include tile;
    min-width: 120px;
}
.stat-title { @include mono-bold(.9em); color: $foreground; opacity: .7; }
.stat-icon  { @include nerd; font-size: 1.4em; color: $blue; }
.stat-value { @include mono-bold(1.3em); color: $foreground; }
```

Импорт в `eww.scss`:
```scss
@import "src/scss/widgets/cpu-stat";
```

### 4. Вставить

В `src/yuck/_windows.yuck` внутри `defwidget dashboard` — добавить `(cpu-stat)` в нужную колонку.

### 5. Reload

```bash
eww -c ~/.config/eww/dashboard reload
```

## Метрика через разницу замеров (скорость сети, iops)

Не всё читается одним `cat`. Скорость = (значение_сейчас − значение_ранее) / интервал. Храни прошлый замер в файле:

```bash
#!/usr/bin/env bash
# scripts/net-speed — отдаёт КБ/с для interface $1 (default: eth0)
IF="${1:-$(ip route show default | awk '/default/ {print $5; exit}')}"
FILE=/tmp/net-speed.$IF

NOW_RX=$(cat /sys/class/net/$IF/statistics/rx_bytes)
NOW_T=$(date +%s%N)

if [ -f "$FILE" ]; then
    PREV_RX=$(awk '{print $1}' "$FILE")
    PREV_T=$(awk '{print $2}' "$FILE")
    DELTA_BYTES=$((NOW_RX - PREV_RX))
    DELTA_NS=$((NOW_T - PREV_T))
    # КБ/с = bytes * 1e9 / (ns * 1024)
    KBPS=$(awk -v db=$DELTA_BYTES -v dn=$DELTA_NS 'BEGIN{printf "%.1f", db*1e9/dn/1024}')
    echo "$KBPS"
else
    echo "0"
fi

echo "$NOW_RX $NOW_T" > "$FILE"
```

```yuck
(defpoll net-rx :interval "2s" :initial "0" "${EWWCONFIGDIR}/scripts/net-speed")
```

**Ключ**: первый запуск создаёт файл, возвращает 0; каждый следующий считает разницу со вторым замером.

## Вариации

**С прогресс-баром** (scale):
```yuck
(scale :min 0 :max 100 :value cpu-load :active false
       :class "stat-bar")
```

**Цвет-по-значению**:
```yuck
(box :class "stat-tile ${cpu-load > 80 ? 'warn' : ''}")
```
И в SCSS:
```scss
.stat-tile.warn { border: 2px solid $red; }
```

**С тултипом**:
```yuck
(box :tooltip "Load avg 1m: ${cpu-load}%"
     ...)
```

## Чеклист

- [ ] defpoll в `_variables.yuck`, не прямо в widget
- [ ] Класс `.stat-tile` использует `@include tile`
- [ ] Иконка через `@include nerd`, цвет из палитры
- [ ] Виджет вставлен в dashboard-композицию
- [ ] `eww logs` чистый после reload
