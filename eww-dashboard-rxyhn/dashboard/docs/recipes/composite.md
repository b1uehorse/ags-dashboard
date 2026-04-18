# Рецепт: composite (виджет из нескольких переменных + условный рендер)

Когда один виджет тянет >1 источника и по-разному их отображает. Пример: music-плеер (обложка + текст + кнопки), weather (день + иконка + t° + локация), commit-activity.

## Ключевые приёмы

1. **Один виджет — один стилевой tile**, внутри обычные вложенные box-ы.
2. **Условный текст/стиль** через тернарки прямо в `:text`/`:class`.
3. **Inline-style только для динамических значений** (background-image, color) — остальное в SCSS.
4. **Fallback-значения** через `?:` на случай если источник ещё не загрузился.

## Пример: music-плеер (упрощённый)

### 1. Переменные

```yuck
(defpoll mpris-title  :interval "3s" :initial "—" "playerctl metadata title 2>/dev/null || echo '—'")
(defpoll mpris-artist :interval "3s" :initial "—" "playerctl metadata artist 2>/dev/null || echo '—'")
(defpoll mpris-status :interval "2s" :initial "stopped" "playerctl status 2>/dev/null | tr 'A-Z' 'a-z' || echo stopped")
(defpoll mpris-art    :interval "5s" :initial "" "${EWWCONFIGDIR}/scripts/mpris-art")
```

Отдельный скрипт для обложки — потому что `mpris:artUrl` часто приходит как `file:///path%20with%20spaces/cover.jpg` с URL-энкодингом. Прямой sed обрежет `file://`, но `%20` останется → GTK не загрузит картинку.

```bash
#!/usr/bin/env bash
# scripts/mpris-art — чистит URL от "file://" и URL-encoding
URL=$(playerctl metadata mpris:artUrl 2>/dev/null) || { echo ""; exit 0; }
[ -z "$URL" ] && { echo ""; exit 0; }
# отрезаем схему + декодируем %xx
python3 -c "
import urllib.parse, sys
u = sys.argv[1]
if u.startswith('file://'): u = u[7:]
print(urllib.parse.unquote(u))
" "$URL"
```

**Приём**: `2>/dev/null || echo '—'` — если playerctl упал (нет плееров), отдаём дефолт. Никогда не роняем скрипт.

### 2. Виджет

```yuck
(defwidget music-mini []
    (box :class "tile music-tile ${mpris-status == 'playing' ? 'playing' : 'idle'}"
         :orientation "v" :space-evenly false :spacing 8
        ;; обложка
        (box :class "music-cover"
             :style "background-image: url('${mpris-art != '' ? mpris-art : EWWCONFIGDIR + '/assets/fallback.png'}');")
        ;; метаданные
        (label :class "music-title"  :text "${mpris-title ?: 'Nothing playing'}" :limit-width 20)
        (label :class "music-artist" :text "${mpris-artist ?: ''}" :limit-width 20)
        ;; управление
        (box :orientation "h" :space-evenly false :spacing 12 :halign "center"
            (button :class "icon-btn" :onclick "playerctl previous &"   "⏮")
            (button :class "icon-btn" :onclick "playerctl play-pause &" "${mpris-status == 'playing' ? '⏸' : '⏵'}")
            (button :class "icon-btn" :onclick "playerctl next &"       "⏭"))))
```

**Что сделано нового**:
- Класс `.playing` / `.idle` переключается на корневом tile — можно стилизовать статус на уровне всего виджета.
- `background-image` — единственное место inline-style. Путь динамический.
- Кнопка play/pause меняет иконку в зависимости от статуса — условный рендер в `:text` (а тут в позиционном слоте `button`).
- `:limit-width 20` — обрезает длинные тайтлы, без ручного подсчёта символов.

### 3. SCSS

```scss
// src/scss/widgets/music.scss
.music-tile {
    @include tile;
    min-width: 220px;
    transition: border-color .3s;

    &.playing { border: 1px solid $magenta; }
    &.idle    { border: 1px solid transparent; }
}

.music-cover {
    min-width: 120px; min-height: 120px;
    border-radius: 10px;
    background-color: rgba(255,255,255,0.04);  // placeholder если пустая
    background-size: cover;
    background-position: center;
}

.music-title  { @include mono-bold(1.1em); }
.music-artist { color: $foreground; opacity: .7; font-size: .9em; }
```

### 4. Reload

```bash
eww -c ~/.config/eww/dashboard reload
```

## Пример: weather

Та же схема — несколько defpoll, виджет с вложенными box, условный цвет иконки:

```yuck
(defwidget weather-mini []
    (box :class "tile weather-tile" :orientation "v" :space-evenly false :spacing 4
        (label :class "weather-day"  :text day)
        (box :class "weather-icon" :style "color: ${weather-hex};"
            (label :text weather-icon))
        (label :class "weather-stat" :text "${weather-stat}" :limit-width 15)
        (label :class "weather-temp" :text "${temperature} · ${weather-city}")))
```

Ничего нового: inline-style **только** для color из defpoll.

## Ошибочные паттерны

### ❌ Прямой shell в виджете

```yuck
(label :text "${shell "date"}")   ;; НЕ делай
```

Не реактивно, не кешируется. → `defpoll date ... "date"`.

### ❌ Повторение SCSS-блоков

```scss
.music-tile { background: rgba(...); border-radius: 12px; margin: .5rem; padding: 1.5rem; }
.weather-tile { background: rgba(...); border-radius: 12px; margin: .5rem; padding: 1.5rem; }
```

→ `@include tile;` — один источник правды.

### ❌ Условия в SCSS через отдельные вложенные тайлы

```yuck
(box :class "music-playing" ...)  ;; рендерим один тайл
(box :class "music-idle" ...)     ;; рендерим другой — ДУБЛЬ
```

→ один тайл + класс-модификатор `.playing`/`.idle`.

## Чеклист

- [ ] Все источники — `defpoll`/`deflisten` с `:initial` и fallback'ом
- [ ] Один tile-контейнер на виджет, миксин `@include tile`
- [ ] Inline-style только для background-image / dynamic color
- [ ] Класс-модификатор на корне для глобальных вариаций
- [ ] `:limit-width` на всех user-тексты (artist/title/etc)
- [ ] Hover-эффекты на кнопках через `@include icon-btn`
