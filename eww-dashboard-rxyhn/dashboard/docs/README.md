# eww-widget framework — индекс документации

Главный артефакт этого репо. Когда пользователь говорит «сделай виджет X», я иду по этим докам и за 5 минут собираю.

## Порядок чтения (первый раз)

0. **[dependencies.md](dependencies.md)** — первая остановка: что должно быть установлено (jq, playerctl, nerd-font и т.п.). Половина проблем = `command not found`.
1. **[framework.md](framework.md)** — ментальная модель eww, 4 уровня компонентов, 5-минутный рецепт, кросс-резаные паттерны (NULL/ellipsize/refresh)
2. **[debugging.md](debugging.md)** — `eww state`, `eww logs`, yuck-квирки, медленные скрипты, типовые ошибки
3. **[components.md](components.md)** — каталог готовых кирпичей (`radialmeter`, `stat-row`, `icon-btn`) + все rxyhn-виджеты с props
4. **[data-sources.md](data-sources.md)** — defpoll / deflisten / defvar, `:run-while`, шаблоны скриптов
5. **[styling.md](styling.md)** — палитра, миксины, шрифты, GTK3-ограничения, под-узлы, Pango markup, `:hexpand/:vexpand`
6. **[windows.md](windows.md)** — geometry/anchor/stacking/namespace, мультимонитор, pin-to-workspace
7. **[shell-safety.md](shell-safety.md)** — quoting, injection, опасные паттерны onclick/input

## Рецепты (копипаст-готовые виджеты)

- **[recipes/stat-tile.md](recipes/stat-tile.md)** — «значение + иконка + подпись»
- **[recipes/button-grid.md](recipes/button-grid.md)** — launcher / app-dock
- **[recipes/live-data.md](recipes/live-data.md)** — deflisten от socket2/dbus/inotify
- **[recipes/interactive.md](recipes/interactive.md)** — defvar + клики + revealer/stack
- **[recipes/composite.md](recipes/composite.md)** — music-like виджеты с несколькими источниками
- **[recipes/chart.md](recipes/chart.md)** — scale / circular-progress / sparkline
- **[recipes/dynamic-list.md](recipes/dynamic-list.md)** — bash → JSON-массив → `(for)`
- **[recipes/interactive-slider.md](recipes/interactive-slider.md)** — scale с `:onchange` (brightness, volume)

## Когда говоришь «сделай виджет X»

Я:
1. Подбираю подходящий рецепт.
2. Копирую скелет.
3. Подставляю твой источник данных и стиль.
4. Добавляю в `layout-container` (не прямо в корень dashboard).
5. `eww reload`, скриншот, показ.

Если `components.md` уже содержит нужный кирпич — используется он. Если нет — создаётся новый примитив и **в том же коммите** добавляется в `components.md`.

## Правило трёх

Если один и тот же паттерн повторился в **двух** виджетах — это уже повод вынести в `components.md`. Три повторения = уже поздно, код пахнет.
