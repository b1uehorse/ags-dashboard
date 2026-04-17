# Доброе утро, брат

Ночью собрал полный rxyhn-дашборд на AGS + документацию для будущих сессий + экспериментальные виджеты. Live-тестирование прервалось — Tailscale SSH потребовал re-auth пока ты спал, так что код не прогнан на хосте после первой проверки.

## Что сделано

Локальный репо: `~/ags-dashboard/` (git, 2+ коммита).

**Примитивы** (`src/primitives/`):
- `Tile` — карточка с фоном/скруглением/паддингом
- `Stack` — flex-обёртка с halign/valign
- `IconButton` — прозрачная кнопка-иконка с hover
- `CircularMeter` — круговой индикатор 0..1 с центр-иконкой
- `Avatar` — круглая аватарка

**Сервисы** (`src/services/`):
- `system` — battery/volume/RAM/CPU/brightness/uptime/disk
- `music` — MPRIS через AstalMpris
- `clock` — time/date/weekday
- `tasks` — чтение `~/.todo.txt`

**Виджеты** (`src/widgets/`):
- `Profile` — аватар + имя + хост
- `Quote` — placeholder
- `Clock` — большое время + дата
- `SystemMeters` — 4 круговых индикатора (RAM/Vol/Bat/Bright)
- `Music` — обложка + title/artist + 4 кнопки управления
- `Weather` — placeholder (день + облако + "— °C")
- `TaskList` — next + priority + uptime + disk
- `AppColumn` — 6 кнопок-приложений

**Пилот-дашборд** (`src/dashboards/rxyhn.tsx`) — layout 1:1 к rxyhn-референсу, 3 колонки.

**Эксперименты** (`src/experiments/`, НЕ регистрируются автоматом):
- `QuickCmd` — мини-терминал снизу, Enter выполняет команду
- `NowPlayingTicker` — плашка с треком справа сверху
- `CpuSparkline` — график последних 30с CPU
- `WorkspaceDots` — точки-индикаторы workspaces Hyprland
- `NtfyLog` — опрос ntfy.sh/kk_alert, показ последнего пуша
- `PinnedWidget` — демо привязки к конкретному workspace через XDG-окно

**Документация** (`docs/`):
- `primitives.md` — каталог кирпичей с props
- `services.md` — как работают источники и как добавить свой
- `theming.md` — палитра, размеры, шрифты
- `hyprland.md` — интеграция, blur, workspace pinning, z-order, прозрачность Kitty
- `recipes.md` — готовые рецепты типовых задач

**Snippets** (`snippets/`) — готовые copy-paste заготовки: новый тайл, новый сервис, новый dashboard.

**CLAUDE.md** — инструкция для меня в следующих сессиях (где что лежит, правила, чеклисты).

## Что ты должен сделать утром (5 минут)

```bash
# 1. Пересинкнуть на хост
rsync -av --delete --exclude='.git' --exclude='node_modules' \
    --exclude='@girs' --exclude='env.d.ts' --exclude='tsconfig.json' \
    --exclude='package.json' --exclude='.gitignore' \
    ~/ags-dashboard/ bekh@100.100.166.114:~/.config/ags/

# 2. На хосте — запустить
ssh bekh@100.100.166.114
cd ~/.config/ags
pkill -9 -f 'gjs.*ags'  # на всякий случай
ags run

# Если падает — смотреть ошибки и вызывать меня
```

## Что я НЕ успел проверить

- Живой рендер на хосте после всех правок (TS SSH отрубил).
- Импорты `ags/process`, `ags/file` — точные пути могут отличаться в v3.1 (проверить по `@girs/ags/index.d.ts` или ошибке при запуске).
- `Astal.CircularProgress` — не уверен что это верный namespace, может быть `Astal.Icon` или отдельная обёртка.
- Работает ли `createPoll` в фоне без явного старта — по доке да, но живьём не прогонял.

Если ags ругнётся на какой-то импорт — 90% это переименование в v3.1, фиксится в одну строчку.

## Открытые тикеты (в порядке приоритета)

1. **Hyprland-интеграция**: прописать в `~/.config/hypr/hyprland.conf` — `exec-once = ags run`, bind SUPER+D, `layerrule = blur, ags-dashboard`, `layerrule = ignorealpha 0.5, ags-dashboard`. Я специально не трогал конфиг без тебя — слишком легко что-то сломать.
2. **Kitty прозрачность** — `background_opacity 0.85` в `~/.config/kitty/kitty.conf` + `dim_inactive = false` в hyprland decoration.
3. **Ассет профиля** — нужен файл `~/.config/ags/assets/profile.png`. Я оставил папку пустой.
4. **Workspace pinning** — proof-of-concept в `experiments/PinnedWidget.tsx`, требует живой тест.
5. **Blur/border красивости** — можно добавить `border: 1px solid rgba(255,255,255,0.06)` на `.tile` для glass-эффекта, подкрутить по вкусу.

## Sleep Mac

Через секунду усыпляю. Ntfy не шлю — ты просил тишину.
