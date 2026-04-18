# eww widget framework — карманный конструктор

Цель: когда ты говоришь «сделай виджет X», я за 5 минут собираю его из готовых кирпичей, которые задокументированы тут.

Весь фреймворк — это **соглашения + каталог компонентов**, ничего в рантайме мы не добавляем. Eww остаётся eww.

## Ментальная модель eww (30 секунд)

Eww — это **реактивный DOM поверх GTK3**, описанный на lisp-подобном `yuck`. Три блока:

1. **Переменные** (`defpoll`/`deflisten`/`defvar`) — источники данных. Значение реактивно перестраивает дерево.
2. **Виджеты** (`defwidget`) — функции из props → GTK-дерева. Можно вкладывать.
3. **Окна** (`defwindow`) — контейнеры layer-shell/XDG с геометрией и стекингом.

Стиль — SCSS (компилится в GTK CSS). Работает **только подмножество CSS**: color/background/padding/margin/border/border-radius/font-*/min-width/min-height. **Flexbox НЕТ**. Вёрстка — только через `box :orientation "h"/"v"`.

Данные — через **shell-скрипты**, вызываемые `defpoll`. `deflisten` — stdin-стрим от долгоживущего процесса (для событий). `defvar` — in-memory, меняется через `eww update`.

## Четыре уровня компонентов

- **Primitive** — элементарный GTK-виджет или yuck-abstraction без бизнес-логики: `<box>`, `<label>`, `<button>`, свой `radialmeter`, свой `icon-row`. Не привязан к данным.
- **Widget** — конкретная роль с данными: `profile`, `music`, `clock`. Композиция примитивов + ссылка на переменные.
- **Layout container** — **промежуточный уровень**: колонка, секция, группа. Содержит только вложенные widget-ы и `box`-ы. Пример: `left-column`, `middle-column`, `app-dock`. **Зачем**: корневой `dashboard` не превращается в лапшу из скобок, когда виджетов 10+.
- **Window/Dashboard** — окно с геометрией, одной строкой вызывает root-layout.

Правило: если один и тот же GTK-паттерн повторяется **в двух** widget-ах — уже выноси в primitive (defwidget с параметрами) и задокументируй в `components.md`. Третий повтор = технический долг. Если в корне `dashboard` появилась третья вложенность box-ов — выноси в layout container.

### Пример правильной композиции

```yuck
(defwidget left-column []
    (box :orientation "v" :space-evenly false :spacing 8
        (profile)
        (quotes)))

(defwidget middle-column []
    (box :orientation "v" :space-evenly false :spacing 8
        (box :orientation "h" :space-evenly false
            (sysbar-col)
            (music))
        (task)))

(defwidget sysbar-col []
    (box :orientation "v" :space-evenly false
        (sysbar)
        (clock)))

(defwidget right-column []
    (app))

;; Корень — компактный, читается за 3 секунды
(defwidget dashboard []
    (box :class "dashboard" :orientation "h" :space-evenly false
        (left-column)
        (middle-column)
        (right-column)))
```

## Пути в скриптах: всегда `EWWCONFIGDIR`

```yuck
;; ❌ ломается при смене юзера/путей
"~/.config/eww/dashboard/scripts/foo"

;; ✅ правильно — eww подставляет сам
"${EWWCONFIGDIR}/scripts/foo"
```

`EWWCONFIGDIR` — встроенная переменная в контексте yuck, равна директории с конфигом. В rxyhn наследие — абсолютные пути; для нового кода **используй EWWCONFIGDIR**.

## Файловая структура (наша)

```
dashboard/
├── eww.yuck                   — entry: include *.yuck
├── eww.scss                   — entry: @import *.scss
├── src/
│   ├── yuck/
│   │   ├── _variables.yuck    — все defpoll/deflisten/defvar
│   │   ├── _windows.yuck      — defwindow и root widget композиция
│   │   └── _widgets.yuck      — defwidget (все виджеты и примитивы)
│   └── scss/
│       ├── variables.scss     — палитра (цвета)
│       ├── _mixins.scss       — @mixin tile / icon-btn / stat-row  ← ДОБАВИМ
│       ├── index.scss         — глобальные reset/кор-правила
│       └── widgets/*.scss     — стиль каждого виджета
├── scripts/                   — shell-скрипты для defpoll
├── assets/                    — картинки (profile.png, fallback.png)
└── docs/
    ├── framework.md           — ЭТОТ файл
    ├── components.md          — каталог примитивов/виджетов с примерами
    ├── data-sources.md        — defpoll vs deflisten vs defvar, паттерны
    ├── styling.md             — theme, mixins, шрифты, SCSS-ограничения
    └── recipes/               — пошаговые рецепты типовых виджетов
        ├── stat-tile.md
        ├── button-grid.md
        ├── live-data.md
        └── interactive.md
```

## 5-минутный рецепт нового виджета

Пример задачи: «добавь виджет, который показывает среднюю нагрузку CPU за 1/5/15 мин».

### Шаг 1 — источник данных (30с)

Если значение **обновляется по таймеру** → `defpoll` + shell-скрипт в `scripts/`.
Если значение **стримит события** → `deflisten` + долгоживущий скрипт.
Если значение **меняется от кликов виджета** → `defvar` + `eww update`.

```yuck
;; src/yuck/_variables.yuck
(defpoll loadavg :interval "5s" "cat /proc/loadavg | awk '{print $1\"  \"$2\"  \"$3}'")
```

Скрипт в `scripts/` не обязателен — если однострочник, inline. Если сложнее — в файл.

### Шаг 2 — виджет (2 мин)

```yuck
;; src/yuck/_widgets.yuck
(defwidget loadavg-widget []
    (box :class "tile loadavg-tile"
         :orientation "v"
         :space-evenly false
        (label :class "tile-title" :text "Load")
        (label :class "tile-value" :text loadavg)))
```

Используй **существующие SCSS-классы** из палитры (`.tile`, `.tile-title`, `.tile-value` — см. `components.md`). Никаких inline-стилей.

### Шаг 3 — стиль (1 мин)

```scss
// src/scss/widgets/loadavg.scss
.loadavg-tile {
    @include tile;           // цвет, border-radius, padding, margin
    min-width: 120px;
}
```

Импортни в `eww.scss`:
```scss
@import "src/scss/widgets/loadavg";
```

### Шаг 4 — вставить в dashboard (30с)

В `src/yuck/_windows.yuck` найди `defwidget dashboard` и добавь вызов `(loadavg-widget)` в нужную колонку.

### Шаг 5 — reload (5с)

```bash
eww -c ~/.config/eww/dashboard reload
```

Eww держит демон, перерисовывает дерево. Если не применилось — `eww logs` покажет ошибку.

## Чеклист перед финишем

- [ ] Новая переменная — в `_variables.yuck`, а не прямо в defwidget
- [ ] SCSS-класс — в отдельном файле `widgets/*.scss`, импорт в `eww.scss`
- [ ] Никаких хардкод-цветов, размеров — всё через `$background`, `$foreground`, `$blue` и т.п.
- [ ] Нет inline `:style`, если можно классом
- [ ] Виджет вставлен в composition (`dashboard`) — иначе он не рендерится
- [ ] `eww reload` прошёл без ошибок в `eww logs`
- [ ] Новая переиспользуемая штука задокументирована в `components.md`

## Кросс-резаные паттерны (встречаются в любом рецепте)

### NULL / пустая строка / «нет данных»

Источник может вернуть:
- пустую строку (`""`)
- буквальный `"NULL"` (SQL/MySQL-скрипты) или `"null"` (JSON)
- пробелы
- `"—"` как ваш собственный плейсхолдер

**Шаблон фильтра в label**:
```yuck
(label :text "${x == '' || x == 'NULL' || x == 'null' ? '—' : x}")
```

**В тернарке для класса** — то же:
```yuck
(box :class "tile ${x != '' && x != 'NULL' ? 'has-data' : 'empty'}")
```

### Длинные строки: ellipsize + tooltip

Длинный текст (имя трека, commit-message, путь) должен обрезаться и иметь tooltip:

```yuck
(box :tooltip full-text
    (label :text short-text :limit-width 30 :wrap false))
```

`:limit-width N` обрезает до N символов (добавляет `…`). `:tooltip` на родителе показывает полное значение при hover.

### Ручной refresh по клику

Когда хочется кнопку «обновить сейчас» без ожидания следующего poll:

```yuck
(defvar refresh-ts "0")
(defpoll data :interval "30s" :initial ""
    "fetch-something ${refresh-ts}")
(button :onclick "eww update refresh-ts=$(date +%s)" "⟳")
```

`refresh-ts` не нужен скрипту — но изменение defvar форсит eww перезапустить команду. Универсальный паттерн.

## Анти-паттерны

- **Прямой вызов скриптов в defwidget**: `(label :text "${shell "date"}")`. Не делай — не реактивно. Используй `defpoll`.
- **Inline-стили**: `(box :style "background: #111")`. Только через классы в SCSS.
- **Глобальный reset**: `* { all: unset }` в `index.scss` уже есть — значит любой класс начинает с нуля. Не рассчитывай на browser-defaults.
- **Flexbox / grid**: их нет. Верстай только `:orientation` + `:space-evenly` + `:halign/:valign`.
- **GTK 4 хинты**: мы на GTK3. `CircularProgress`, `StackSwitcher`, адвайт-стайл — **не работают**.

## Дальше

- Конкретные кирпичи → `components.md`
- Как данные подключать → `data-sources.md`
- Шрифты, цвета, ограничения CSS → `styling.md`
- Окна, anchor, мультимонитор, Hyprland → `windows.md`
- **Как дебажить когда не работает** → `debugging.md` (читать первым при любой проблеме)
- Готовые к копипасту виджеты → `recipes/*.md`
  - `recipes/stat-tile.md` — «метрика + иконка»
  - `recipes/button-grid.md` — launcher/app-dock
  - `recipes/live-data.md` — deflisten от socket2/dbus/inotify
  - `recipes/interactive.md` — defvar + клик + revealer/stack
  - `recipes/composite.md` — music-like виджеты из нескольких источников
  - `recipes/chart.md` — scale / circular-progress / sparkline
  - `recipes/dynamic-list.md` — bash → JSON → `(for)`
