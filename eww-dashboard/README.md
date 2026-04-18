# eww-dashboard

Минимальный скелет плиточного дашборда на [eww](https://github.com/elkowar/eww) для Hyprland. Ложится рядом с `ags-dashboard/` и `fabric-dashboard/` — один и тот же layout, три разных движка.

Цель этой папки — **документация**, а не готовый продукт. Код здесь скелетный (плитки без контента), но `eww.yuck` + `eww.scss` рабочие как отправная точка.

---

## Что такое eww

**E**lKowar's **W**acky **W**idgets — Rust-демон, рисует GTK3 виджеты по декларативному конфигу на lisp-подобном языке **yuck**. Стиль — SCSS. Данные — через shell-команды или файлы, опрашиваемые по интервалу.

Плюсы vs AGS/Fabric:
- **один бинарник**, без рантаймов (не нужен gjs/python/venv).
- хороший для **статических/лёгких виджетов** (status bar, дашборд с текстом/метриками).
- конфиг очень компактный.

Минусы:
- GTK3, не GTK4. Нет современных фич (нет нормального `levelbar` на градиентах, хуже с кастомными шейдерами).
- нет реактивности через объектные модели (AstalHyprland, Fabric signals) — только polling.
- на анимациях и интерактивных формах уступает AGS/Fabric.

**Правило большого пальца:** eww для «смотрелок», AGS/Fabric для «смотрелок+жмакалок».

---

## Установка на Betrayer (CachyOS)

```bash
paru -S eww          # пакет eww в AUR/extra
eww --version        # должен быть 0.6+
```

---

## Структура eww-конфига

eww ожидает конфиг в `$XDG_CONFIG_HOME/eww/` (обычно `~/.config/eww/`), два файла:

| файл | назначение |
| --- | --- |
| `eww.yuck` | layout + окна + переменные + виджеты |
| `eww.scss` | стили (компилируется в GTK CSS внутри eww) |

Для нескольких дашбордов — директории: `~/.config/eww/<name>/eww.yuck`. Запускать с `-c`:

```bash
eww -c ~/.config/eww/dashboard daemon
eww -c ~/.config/eww/dashboard open dashboard
```

---

## Основы yuck

### виджеты

```lisp
(defwidget mywidget [arg1 ?optional]
  (box :class "foo" :orientation "v"
       (label :text arg1)))
```

- `defwidget` — декларация. `[]` — параметры. `?` префикс — опциональный.
- всё в s-выражениях, атрибуты через `:key value`.

### контейнеры

- `(box :orientation "h|v" :spacing N :space-evenly bool ...)` — основной layout.
- `space-evenly false` — **обязательно**, иначе eww растянет детей на равные доли.
- геометрию задаёт родитель; у ребёнка — через `:width`/`:height` или CSS `min-width`.

### окна

```lisp
(defwindow name
  :monitor 0
  :stacking "bg|bottom|normal|overlay|fg"
  :exclusive false
  :focusable false
  :geometry (geometry :anchor "center" :x 0 :y 0 :width "auto" :height "auto")
  (dashboard))
```

- `:stacking "bg"` = layer-shell уровень background/bottom — рисуется под окнами (аналог `layer="bottom"` в fabric, `Astal.Layer.BOTTOM` в AGS).
- `:anchor` поддерживает `"center"`, `"top left"`, `"bottom right"` и пр.

### данные и polling

```lisp
(defpoll battery :interval "10s"
  `cat /sys/class/power_supply/BAT0/capacity`)

(deflisten workspaces :initial "[]"
  "bash -c 'hyprctl -j monitors; ...'")
```

- `defpoll` — тянет по таймеру, один раз.
- `deflisten` — слушает долгий процесс (например, сокет Hyprland).
- затем переменная доступна в виджетах: `(label :text "${battery}%")`.

---

## Прозрачность и блюр

По умолчанию eww-окно **непрозрачное** (GTK3 `.background` класс рисует фон). Чтобы видеть обои:

```scss
window, .background {
  background: transparent;
}
```

Дальше — либо тайлы рисуют свой `background-color`, либо всё через `rgba(...)`.

### блюр на Hyprland 0.54

Hyprland применяет блюр к layer-shell окну по namespace. eww-окна имеют namespace = **имя окна в yuck**: `dashboard` в нашем примере.

```
layerrule {
  name = blur-eww-dashboard
  match:namespace = dashboard
  blur = true
  ignore_alpha = 0.3   # не блюрить прозрачные области (убирает halo вокруг плиток)
}
```

**Важно про 0.54:** inline-форма `layerrule = blur, dashboard` **не парсится** — только блочная с `name = <уникальное>`. Подробнее см. `../fabric-dashboard/` и корневой `README` репо.

Для однотонных тайлов без блюра (текущая просьба пользователя) — layerrule не нужен вовсе, `.tile { background-color: #1a1b26; }`, и всё.

---

## Запуск этого скелета

```bash
cp -r eww-dashboard ~/.config/eww/dashboard
eww -c ~/.config/eww/dashboard daemon
eww -c ~/.config/eww/dashboard open dashboard
```

Чтобы увидеть, какие окна у eww открыты:

```bash
eww -c ~/.config/eww/dashboard active-windows
```

Перезагрузить после правки yuck/scss:

```bash
eww -c ~/.config/eww/dashboard reload
```

---

## Паттерны и подводные

- **`space-evenly false`** на каждом `box` — иначе дети растянутся до одинаковой ширины и плитки поплывут.
- **размеры в yuck vs CSS:** `:width/:height` в yuck = пиксели-минимум. Если хочется «авто под контент» — опустить атрибут и задать `min-width` в SCSS.
- **polling дорогой.** Не опрашивать `hyprctl`/`bash` чаще раза в секунду. Для событий Hyprland — `deflisten` + `socat` к `$XDG_RUNTIME_DIR/hypr/$HIS/.socket2.sock`.
- **eww GTK3** — не все CSS-свойства работают. `border-radius` — ок. Градиенты и фильтры — через `-gtk-...` вендор-префиксы.
- **иконки** — `label :text ""` (Nerd Font). Никаких SVG без плясок.
- **z-order.** `stacking "bg"` кладёт под окна. Если виджет исчезает под обоями — поставить `"bottom"`.

---

## Соответствие layout в других реализациях

| колонка | плитки | AGS (`src/dashboards/rxyhn.tsx`) | fabric (`fabric-dashboard/main.py`) | eww (`eww.yuck`) |
| --- | --- | --- | --- | --- |
| 1 | profile, quote | `<Stack v>` + widgets | `Box(v, [tile, tile])` | `(col-left)` |
| 2 | meters×4 + clock + music + weather + tasks | вложенные `<Stack>` | вложенные `Box` | `(col-mid)` |
| 3 | apps | `<AppColumn>` | `tile("t-apps")` | `(col-right)` |

Layout одинаковый — различия только в синтаксисе движка и в системе биндингов/реактивности.
