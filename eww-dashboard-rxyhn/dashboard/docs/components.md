# Каталог компонентов

Что уже собрано и готово к переиспользованию. В конце — как расширять каталог.

## Примитивы (переиспользуемые yuck-виджеты)

### `radialmeter` — круговой индикатор (0..100)

```yuck
(defwidget radialmeter [value text ?class ?labelclass]
    (circular-progress :value value
        :class "radial ${class}"
        :start-angle 0
        :thickness 12
        (label :text text
            :class "radial-label ${labelclass}"
            :limit-width 2
            :show_truncated false
            :wrap false
            :angle 0.0)))
```

**Props**:
| prop | тип | пример | что делает |
|---|---|---|---|
| value | number 0..100 | `ram-usage` | процент заполнения |
| text | string | `""` | иконка/надпись в центре (нерд-шрифт) |
| class | string (опц.) | `"ram-radial"` | доп. класс для окраски |
| labelclass | string (опц.) | `"ram-radial-label"` | класс для текста внутри |

**⚠️ Важно про диапазон `value`**: `circular-progress` ждёт **0..100** (процент), а **не** 0..1. Все вики/туториалы в интернете противоречат друг другу — в current stable eww это 0..100. Если ставишь `:value 0.5` — получишь 0.5% заполнения (практически ничего).

Если твой источник отдаёт долю (0..1) — умножь в скрипте: `awk '{print int($1*100)}'`.

**Использование**:
```yuck
(radialmeter :value ram-usage :text "" :class "ram-radial" :labelclass "ram-radial-label")
```

**SCSS-паттерн** (в `widgets/systray.scss`): обёртка `.radial-XXX-box` задаёт padding/bg, `.XXX-radial` — цвет заполнения.

---

### `stat-row` — «иконка + текст» в строку (новое)

Не вынесено в rxyhn, но повторяется в task-list. Предлагаю как primitive:

```yuck
(defwidget stat-row [icon text ?iconclass ?textclass]
    (box :orientation "h" :space-evenly false :spacing 20
        (label :class "stat-icon ${iconclass}" :text icon)
        (label :class "stat-text ${textclass}"  :text text)))
```

**Где применяется**: TaskList (`todo`, `uptime`, `mem-usage`, `disk-usage` — все 4 строки). Music-метаданные. Профиль.

---

### `icon-btn` — кнопка-иконка с hover

```yuck
(defwidget icon-btn [icon cmd ?tooltip ?class]
    (button :class "icon-btn ${class}"
            :onclick cmd
            :tooltip {tooltip ?: ""}
        icon))
```

**Hover-стиль** определи один раз в `_mixins.scss`:
```scss
@mixin icon-btn {
    padding: .5rem .8rem;
    border-radius: 10px;
    color: $foreground;
    &:hover { color: $blue; background-color: rgba(255,255,255,0.05); }
}
```

---

## Виджеты (законченные блоки с данными)

Все виджеты в `src/yuck/_widgets.yuck`, стили — в `src/scss/widgets/*.scss`.

### `profile` — аватар + имя + хост

- **Вход**: `NAME`, `UNAME` (из `_variables.yuck`, `hostname`/`whoami`).
- **Структура**: круглая `.pfp` (фон-картинка из `assets/profile.png`) + `.pfptxt` + `.subpfptxt`.
- **Настройка**: заменить `assets/profile.png` — размер 15rem по центру.

### `sysbar` — 2×2 сетка круговых меток

- **Вход**: `ram-usage`, `current-volume`, `battery-capacity`, `current-brightness` (все 0..100).
- **Структура**: внешняя `(box :orientation "v")` с двумя `(box :orientation "h")` внутри. Каждая клетка = обёртка `radial-XXX-box` + `radialmeter`.
- **Цвет**: `ram`=blue, `volume`=magenta, `bat`=green, `brightness`=yellow (`$blue`/`$magenta`/`$green`/`$yellow`).

### `clock` — HH:MM + день

- **Вход**: `hour`, `minute`, `day` (`defpoll`, `date +%H/%M/%A`).
- **Структура**: `(box :orientation "v")` → `(box :orientation "h" (hour)(:)(min))` + день снизу.
- **Шрифт**: «Comic Mono», жирный 2.5em для времени.

### `music` — обложка + метаданные + управление

- **Вход**: `art`, `title`, `artist`, `playpause`, `songtime` (скрипт `scripts/music`).
- **Структура**: `.album_art` (background-image через inline style, **единственное место, где допустим inline** — путь динамический) → title/artist → `prev/play/next` → scale-шкала.
- **Действия**: `onclick` → `scripts/music previous/toggle/next`.

### `quotes` — цитата + автор

- **Вход**: `quote_text`, `quote_author`.
- **Паттерн**: `scripts/quotes quote` + `scripts/quotes author` — один скрипт, разные флаги.

### `weather` — день + иконка + температура

- **Вход**: 6 переменных из `scripts/getweather --flag`.
- **Цвет иконки**: `:style "color: ${weather-hex}"` — динамический цвет из скрипта, второй допустимый inline.

### `task-list` — follow-ups + уведомления + powermenu

- **Вход**: `next_appointment`, `todo-*`, `uptime`, `mem-usage`, `disk-usage`.
- **Структура**: верхняя строка appointment + 4 строки `stat-row` + горизонтальный powermenu (5 кнопок).
- **Powermenu actions**: `systemctl poweroff/reboot`, `betterlockscreen -l`, `bspc quit` (унаследовано от bspwm — надо переписать под hyprland), `eww close-all`.

### `app` — вертикальный столбец launcher-кнопок

- **Вход**: ничего, всё hardcoded в yuck.
- **Проблема**: иконки разной ширины (разные кегли в SCSS) → выравнивание плывёт. Фикс — единый `min-width` на `.applications button`.

---

## Как добавлять в каталог

1. Когда делаешь новый виджет или примитив — добавь секцию сюда **в том же коммите**.
2. Формат: название, вход (переменные/props), структура (что из чего), ссылки на SCSS-файл.
3. Минимум один пример использования.
4. Если это переиспользуемое — положи в «Примитивы», иначе в «Виджеты».

Правило: **через 3 сессии я уже не помню что есть** → если не задокументировано, значит не существует.

### Правило «двух повторов»

Если GTK-паттерн (набор box/label/класс со специфическим поведением) встретился в **двух** виджетах — это значит его уже нужно вынести в отдельный `defwidget` и задокументировать здесь. Третий повтор = технический долг, обычно означает что кто-то уже страдал с синхронизацией двух копий.

Исключение: тайл-обёртка (`@include tile`) — она у всех, выносится через SCSS-миксин (см. `styling.md`).
