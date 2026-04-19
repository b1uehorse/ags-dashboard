---
title: "Путь к tile-дашборду на Hyprland: AGS, Fabric, EWW и одна ночь граблей"
author: "Claude + bekh"
---

# Путь к tile-дашборду на Hyprland

*Постмортем одной ночи и объяснение, почему вторая попытка заняла час.*

---

## С чего всё началось

Стоит Betrayer — CachyOS, Hyprland 0.54.3, разрешение 2560×1440 на масштабе 1.67 (логическое 1536×864). Хочется плиточный дашборд в духе rxyhn-скрина из r/unixporn: три колонки, круглые метрики по центру, цитата слева, плеер справа, всё с блюром Hyprland как под Kitty-терминалом. Пусть висит на одном workspace, прямо на обоях, ниже окон.

Референс — это rxyhn's TokyoNight bspdots (позже выяснилось, что репозиторий называется **raexera/tokyo**, это форк). Оригинал написан на EWW для BSPWM + picom. Это важно — запомни.

## Акт 1. AGS и ночь граблей

Первая попытка — AGS (Astal GTK Shell). TypeScript/JSX поверх GJS, рантайм собран Astal-командой на GTK4 и их layer-shell обёртке. Выглядит современно: JSX-виджеты, реактивные биндинги через `createBinding(hypr, "focusedWorkspace")`.

Layout собран за час: три колонки из вложенных Stack'ов, плитки с `cssClasses`, окно с `layer={Astal.Layer.BOTTOM}`. Казалось, всё.

**Первый грабель — layer не применяется.** Пропс `layer` на `<window>` проглатывается без ошибок, но `hyprctl layers` показывает, что поверхность висит на уровне **top**, а не **bottom**. То есть дашборд перекрывает приложения. Три часа на это. Решение — уродский хак в ref-колбэке:

```tsx
<window
  layer={Astal.Layer.BOTTOM}
  $={(self) => {
    self.hide();
    self.set_layer(Astal.Layer.BOTTOM);
    self.show();
  }}
/>
```

То есть Astal игнорирует props, но уважает императивный `set_layer`, если вызвать его пока окно скрыто. Это недокументированный баг.

**Второй грабель — `AstalHyprland.get_default()` возвращает null.** Класс падает с «Hyprland is not running», потому что при запуске AGS через ssh не форвардятся env-переменные. Нужно было явно `HYPRLAND_INSTANCE_SIGNATURE=$SIG ags run`. Ещё час.

**Третий грабель — блюр не работает.** Вот тут мы застряли до утра. Казалось, правило написано верно:

```
layerrule = blur ags-dashboard
layerrule = ignorealpha 0.5, ags-dashboard
```

Hyprctl layers показывает окно как namespace=ags-dashboard. Правила в конфиге есть. `hyprctl reload` сказал «ok». Блюра нет. Пробовал через запятую (`blur, ags-dashboard`) — `invalid field`. Пробовал menu `ignorealpha` как отдельный keyword — `invalid field ignorealpha`. Советы Gemini (которого я спросил вторым мнением) оказались мимо — он предлагал те же inline-формы, которые в 0.54 уже не работают.

Дебаг-сессия кончилась тем, что я лепил красные полупрозрачные квадраты для проверки, снижал alpha до 0.05, увеличивал до 0.9 — и всё равно треугольники обоев оставались чёткими сквозь плитки, без всякого размытия.

На этом моменте пользователь сказал «ебись оно конём, ставь Fabric».

## Акт 2. Fabric — быстрее, но тупик

Fabric — это Python-фреймворк поверх PyGObject и GtkLayerShell. Один бинарь/скрипт, импорты человекочитаемые, никакого JSX.

Установка: `python-fabric-git` из AUR сломался на Python 3.14 (PyGObject 3.50 не может обработать `Enum` как `Property`-тип, конкретно `GtkLayerShell.Layer`). Пришлось поднимать Python 3.13 через `uv`, руками ставить `pygobject`, `pycairo`, и сам fabric с github в venv. Ещё час.

**«Hello fabric» завёлся сразу.** Большой тёмный квадрат, центрированный, виден на обоях. Layer уровень bottom — без хака, просто параметром в `super().__init__(layer="bottom")`. Тут я офигел — AGS требовал пляски, Fabric делает как написано.

**И тут тот же грабель про блюр.** Полная копия ситуации: квадрат полупрозрачный, через него должны просвечивать размытые обои, — а они чёткие. Точно такой же `layerrule = blur fabric` в конфиге, ignorealpha не принимается.

В какой-то момент я полез читать `sed -n` вывода конфига и увидел **работающие** layerrule-блоки для waybar/rofi/swaync:

```
layerrule {
    name = blur-waybar
    match:namespace = waybar
    blur = true
}
```

**Блочная форма.** С обязательным `name = <уникальное>`. Inline `layerrule = blur <namespace>` в 0.54 просто игнорируется — конфиг парсится, warning не пишет, правило в никуда. В старых версиях Hyprland этот синтаксис работал, во всех гайдах на reddit'е он же. Но в 0.54 что-то переломали, теперь только блочная.

Замена — и **блюр пошёл**. После пяти часов драк сработало с первой правки. Fabric-квадрат наконец выглядит как Kitty: размытые пятна обоев сквозь полупрозрачный фон.

**Пользователь попросил воссоздать layout AGS**, чтобы оценить Fabric на сложности. Plied out 3 колонки, 4 метра, clock, music, weather, tasks, app-column. Всё отрисовалось. Блюр красивый. Но нет подложки — плитки сами по себе, между ними чистые обои. Красиво.

**Следующий шаг — наполнить плитки.** Вот тут Fabric ударил под дых. Его `CircularProgressBar` оказался сломан по geometry:

```python
def do_get_preferred_width(self):
    return (2 * self.do_calculate_radius(),) * 2

def do_calculate_radius(self):
    alloc = self.get_allocation()
    return min(alloc.width, alloc.height) // 2
```

Классический deadlock: preferred зависит от allocation, allocation от preferred. При первом рендере allocation = 0×0, значит preferred = 0×0, значит GTK аллоцирует минимум — около нуля. Круг схлопывается в синюю точку 4 пикселя независимо ни от чего.

Перепробовал: `set_size_request(70, 70)` — игнор. Обёртка в `Gtk.AspectFrame` с обязательным размером — ring всё равно крошечный. Subclass с override `do_get_preferred_width` — GObject vfunc из Python-subclass не переопределяются без `__gtype_name__` и `type_register`. Overlay поверх Box с size_request — та же ерунда.

Мысль: если один ключевой виджет Fabric сломан, сколько ещё сломано? Слушатели событий? Системные метрики? Писать cairo ручками под каждую круговую штуку — это уже не фреймворк, это я сам себе рисую.

Пользователь пришёл к тому же выводу и сказал переключаться на EWW — потому что *«референс же реально на нём сделан»*.

## Акт 3. EWW и чудо первой попытки

EWW — ElKowar's Wacky Widgets, Rust-демон, конфиг на yuck (lisp-подобный) и SCSS. Виджеты тупые, реактивности почти нет (только polling), зато встроенный `circular-progress` рисуется как надо, и сам движок компактный.

Сначала я попробовал повторить layout сам — сделал скелет yuck/scss. Пока я думал про чудовищность написания виджетов с нуля, пользователь дал ссылку: **github.com/raexera/tokyo** — прямой источник того самого скрина.

Клон — 500 КБ. В `config/eww/dashboard/` лежат 351 строка yuck и 10 скриптов (music, weather, sys_info, task). Всё rxyhn собрал за меня.

**Адаптация под Hyprland заняла три правки:**

1. `_windows.yuck`: убрать X11-специфичные `:windowtype "dock"` и `:wm-ignore true`. Добавить wayland-layer-shell атрибуты:
   ```
   :stacking "bottom"
   :exclusive false
   :focusable false
   ```
   Указать явный `:width/:height` в geometry — на wayland layer-surface без размера не всплывает.

2. `_widgets.yuck`: в eww 0.5 появился встроенный widget `systray`, имя коллизит с кастомным у rxyhn. Переименовал `defwidget systray` → `defwidget sysbar` плюс единственный вызов.

3. `scripts/sys_info`: на Betrayer'е нет батарейки, `brightnessctl` берёт не то устройство, `amixer -D pulse` даёт пустоту. Обернул каждую функцию в «если железо отдаёт — вернуть число, иначе 50». Пять строк.

Запуск: `eww -c ~/.config/eww/dashboard daemon` + `eww -c ~/.config/eww/dashboard open dashboard`. Смотрю `hyprctl layers` — **появился новый layer с namespace=gtk-layer-shell**. EWW собран с `libgtk-layer-shell.so.0`, протокол нативный wayland. Никакого XWayland, при том что в yuck торчат X11-атрибуты — они просто игнорируются.

Скриншот — и **там всё**. Профиль «betrayersCurse / bekh», цитата Линуса (скрипт `quotes` подтянул реальную из своего dataset), четыре круговых метрики разных цветов, часы, weather, tasks, music, колонка соцсетей справа. Один в один референс. Двадцать минут от `git clone` до готового дашборда.

**Прозрачность + блюр** — одна правка:

```scss
window, .background { background-color: transparent; }
$background: rgba(26, 27, 38, 0.55);
```

Плюс блочный layerrule в hyprland.conf с namespace `gtk-layer-shell`, `ignore_alpha=0.3` чтобы не было halo. С первой попытки.

---

## Почему вторая сессия заняла час, а первая всю ночь

Четыре причины, в порядке важности:

### 1. Сохранённая memory про синтаксис layerrule

После первой ночи я записал в memory:

> В Hyprland 0.54.3 inline-форма `layerrule = blur <namespace>` и `layerrule = blur, <namespace>` НЕ парсится. Работает только блочная с `name = <уникальное>`.

Этот один факт стоил пять часов в первой сессии. Вторая сессия его знает с самого начала. Одной правкой — блюр.

### 2. Знание про `ignore_alpha`

В первой сессии я видел блюр-halo (тёмная подложка между плитками) и думал, что это какая-то подложка от GTK-шного `.background` класса, искал в неверном месте. На самом деле это физика блюра: размытие усредняет соседние пиксели, в том числе тёмные из плиток, и эта темнота растекается в прозрачные области. `ignore_alpha 0.3` говорит Hyprland'у «не блюрить области с alpha ниже 0.3» — halo исчезает.

Это ещё одна чистая информация, не требующая эксперимента. Но узнать её из документации Hyprland трудно, потому что поле `ignore_alpha` действует **только** внутри блочной формы layerrule — а я в первую ночь писал inline.

### 3. Готовый проверенный код вместо своего

В первой ночи я писал виджеты сам: AGS JSX-layout с плитками, потом Fabric Python-aналог. Каждый раз упирался в косяк фреймворка: Astal игнорит layer prop, Fabric CircularProgressBar collapse в точку. Это невозможно предсказать из документации — это баги, про которые знают только те, кто сам их нашёл.

Во второй ночи мы клонировали rxyhn-конфиг. Автор уже прошёл через все ошибки, виджеты у него рабочие, скрипты не лгут. Мне осталось закрыть три дырки на стыке его окружения (X11/bspwm) и моего (Wayland/Hyprland). Это работа шлюза, не разработка.

### 4. Смена стратегии с «написать» на «взять и адаптировать»

Это не моя мысль — это твоё решение, когда после пары часов с Fabric ты сказал «давай нахуй, берём rxyhn и копируем». Я бы продолжал лепить cairo-CircularMeter вручную, потому что привык думать, что чужой код «всё равно не подойдёт». Подошёл.

Метa-урок: **когда в визуальной нише есть культовая эстетика (tiling dotfiles, retro-терминалы, Neovim-конфиги), всегда есть 2-3 референсных репозитория, на 90% покрывающие задачу**. Время, потраченное на поиск такого репо, окупается десятикратно по сравнению с попыткой воспроизвести по скриншоту.

---

## Технические артефакты, которые стоит унести

### Hyprland 0.54: блочный layerrule

```
layerrule {
    name = blur-<unique>
    match:namespace = <ns>
    blur = true
    ignore_alpha = 0.3
}
```

Inline формы **не работают**. `ignorealpha`/`ignore_alpha` как отдельный keyword вне блока — отвергается. Namespace у layer-shell surface = то, что приложение передаёт в `zwlr_layer_shell_v1.get_layer_surface(…, namespace)`. Для eww через gtk-layer-shell это буквально строка `gtk-layer-shell`. Для AGS — берётся из JSX props `namespace="ags-dashboard"`. Для Fabric — из Python-args окна.

Чтобы выяснить namespace конкретного приложения, не копаясь в исходниках — `hyprctl layers`. Выхлоп выглядит так:

```
Layer 55dd…: xywh: 235 63 1066 738, namespace: gtk-layer-shell, pid: 61153
```

### Применение layerrule не реактивное

Если приложение уже запущено, `hyprctl reload` не изменит его блюр. Правила применяются в момент создания слоя. Порядок надёжного ввода блюра: правка конфига → reload → рестарт приложения, создающего слой.

### Прозрачность GTK-окна на Wayland

По умолчанию GTK-окно имеет `.background` стиль-класс, который красит сплошной фон темы. Чтобы layer-surface был прозрачным и под ним виделись обои/блюр — явно:

```scss
window, .background {
    background-color: transparent;
}
```

Без этого любые `rgba(…, 0.5)` на внутренних контейнерах бессмысленны, потому что под ними всё равно непрозрачный слой окна.

### AGS Astal: layer prop игнорируется

Обход:

```tsx
<window
  layer={Astal.Layer.BOTTOM}
  $={(self) => {
    self.hide();
    self.set_layer(Astal.Layer.BOTTOM);
    self.show();
  }}
>
```

Без `hide → set_layer → show` вызов `set_layer` на видимом окне не пересоздаёт layer-surface. Ещё одна деталь, которой нет в Astal-доках.

### Fabric Python: CircularProgressBar schlopotchennyi

В теории `fabric.widgets.circularprogressbar` должен рисовать круг нужного размера. На практике его `do_get_preferred_width` возвращает ноль до первой аллокации, и widget схлопывается. Обходы (`set_size_request`, `AspectFrame`, `h_expand=True`) не помогают. Pull request в апстрим или DrawingArea-рукопашка — единственные пути. Если нужен живой progress ring из коробки — брать eww'шный `(circular-progress …)` или писать свой на `cairo.Context` через `Gtk.DrawingArea`.

### EWW на Wayland

Если eww собран с `gtk-layer-shell`, он запускается на Wayland нативно. X11-атрибуты в yuck (`:windowtype`, `:wm-ignore`, `:x/:y` без размеров) игнорируются, но предупреждений не печатают. Нужно явно задать `:stacking "bottom|top|overlay|fg|bg"`, `:exclusive`, `:focusable`, `:width`, `:height`. После этого работает как layer-shell приложение.

### Workspace-pin для layer-shell окон

Hyprland не умеет привязывать layer-surface к workspace «из коробки» (в отличие от windows). Приём:

```python
# fabric, аналогично на любом языке
import socket, os, json, subprocess, threading
from gi.repository import GLib

HIS = os.environ["HYPRLAND_INSTANCE_SIGNATURE"]
SOCK = f"/run/user/{os.getuid()}/hypr/{HIS}/.socket2.sock"

def apply(ws_id):
    GLib.idle_add(lambda: win.show() if ws_id == 1 else win.hide())

def listen():
    cur = json.loads(subprocess.check_output(["hyprctl", "-j", "activeworkspace"]))
    apply(cur["id"])
    s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    s.connect(SOCK)
    for line in s.makefile("r"):
        if line.startswith("workspace>>"):
            apply(int(line.split(">>", 1)[1]))

threading.Thread(target=listen, daemon=True).start()
```

Подписка на `.socket2.sock` — это рекомендованный способ слушать события Hyprland (workspace, window focus, monitor change). Событий много, для дашборда интересен только `workspace>>N`.

---

## Вывод

Пять часов первой ночи = цена знания «в 0.54 только блочный layerrule». Второй час вторых суток = собранный rxyhn-конфиг, скопированный и адаптированный тремя мелкими правками. **Сохраняй артефакты граблей в memory, ищи готовые решения в чужих дотфайлах, не пиши виджетный фреймворк с нуля, если на github уже есть тот, в котором была сделана эстетика с r/unixporn.** Всё.
