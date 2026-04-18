# Рецепт: chart (прогресс/спарклайн/радиал)

Три штуки, которые eww умеет из коробки для визуализации числа:

1. **`scale`** — горизонтальная/вертикальная полоска прогресса.
2. **`circular-progress`** — кольцо заполнения с текстом внутри.
3. **Sparkline** — самодельная через набор вертикальных box-ов с динамическим height.

## 1. Scale (progress bar)

```yuck
(defwidget ram-bar []
    (box :class "tile" :orientation "v" :space-evenly false :spacing 6
        (label :class "stat-title" :text "RAM" :halign "start")
        (scale :min 0 :max 100 :value ram-usage :active false
               :class "ram-scale")))
```

```scss
.ram-scale {
    trough       { all: unset; background-color: $background-alt; border-radius: 4px; min-height: 6px; }
    highlight    { all: unset; background-color: $blue; border-radius: 4px; }
    slider       { all: unset; }  // скрыть thumb
}
```

**Трюк**: `all: unset;` на trough/highlight/slider — сбрасываем дефолтный GTK-стиль. Иначе вылезет полосатый ползунок.

`:active false` — полоса становится нон-интерактивной (только показывает).

## 2. Circular progress (кольцо)

В rxyhn это `radialmeter` (см. `components.md`).

Минимальный вызов:
```yuck
(circular-progress :value cpu-load
                   :start-angle 0
                   :thickness 10
                   :class "cpu-radial"
    (label :text "" :class "cpu-radial-label"))
```

```scss
.cpu-radial       { background-color: $background-alt; color: $cyan; }
.cpu-radial-label { font-size: 1.8em; padding: 2rem; color: $cyan; }
```

**Параметры**:
- `:value` — 0..100 (почему-то не 0..1, хоть доки говорят иначе — проверь свою версию).
- `:thickness` — толщина кольца в px.
- `:start-angle` — откуда рисовать (0 = 12 часов).
- Содержимое (child) — рендерится в центре.

## 3. Sparkline (своими руками)

У eww нет готового мини-графика. Соберём из `defpoll`-массива + набора `box` с `:height`:

### 3.1. Скрипт-буфер

```bash
# scripts/cpu-history
#!/usr/bin/env bash
# хранит последние 30 значений CPU в /tmp/cpu-history.txt
FILE=/tmp/cpu-history.txt
[ -f "$FILE" ] || touch "$FILE"

cur=$(awk '{print int($1*100)}' /proc/loadavg)
(cat "$FILE"; echo "$cur") | tail -n 30 > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"

# отдаём массив JSON для yuck
printf '['
paste -sd, "$FILE"
printf ']'
```

### 3.2. Переменная

```yuck
(defpoll cpu-history :interval "2s" :initial "[0,0,0,0,0]"
    "~/.config/eww/dashboard/scripts/cpu-history")
```

### 3.3. Виджет

```yuck
(defwidget cpu-spark []
    (box :class "tile spark-tile" :orientation "v" :space-evenly false :spacing 4
        (label :class "stat-title" :text "CPU (30s)" :halign "start")
        (box :class "spark" :orientation "h" :space-evenly true :spacing 1
            (for v in cpu-history
                (box :class "spark-bar"
                     ;; +2px база — при нулевой нагрузке бар не схлопнется
                     :style "min-height: ${v / 2 + 2}px;")))))
```

`(for v in cpu-history)` — итерация по JSON-массиву. Каждый `v` — число 0..100, делим на 2 чтобы получить px (макс 50px).

### 3.4. SCSS

```scss
.spark { min-height: 50px; }
.spark-bar {
    background-color: $blue;
    min-width: 4px;
    border-radius: 1px;
}
```

## Цвет по значению

Любой chart красим по состоянию:

```yuck
(circular-progress :value temperature
    :class "${temperature > 80 ? 'temp-hot' : temperature > 60 ? 'temp-warm' : 'temp-cool'}"
    ...)
```

```scss
.temp-cool { color: $cyan; }
.temp-warm { color: $yellow; }
.temp-hot  { color: $red; }
```

## Ограничения

- **Smooth анимация между значениями** — нет. `scale`/`circular-progress` меняются скачком.
- **Больше 50-100 баров в sparkline** — GTK3 дрогнет на перерисовке. Для долгих временных серий лучше рендерить PNG-чарт в файл и показывать через `image :path`.
- **Легенды, подписи осей, tooltips-при-hover** — нет. Только сам график.

## Чеклист

- [ ] Скрипт-буфер хранит историю в `/tmp`, не в `$HOME`
- [ ] Массив для `for` возвращается как валидный JSON
- [ ] В SCSS сброс через `all: unset;` на trough/highlight
- [ ] Цвет — из палитры, не хардкод
