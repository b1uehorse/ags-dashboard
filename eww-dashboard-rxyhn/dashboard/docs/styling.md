# SCSS, темы, шрифты, ограничения GTK

## Палитра

Единственный источник цветов — `src/scss/variables.scss`:

```scss
$background:       rgba(26, 27, 38, 0.55);
$background-alt:   rgba(22, 22, 30, 0.55);
$background-alt2:  rgba(30, 32, 46, 0.55);
$foreground:       #a9b1d6;
$red: #F7768E; $yellow: #E0AF68; $orange: #FF9E64;
$green: #9ECE6A; $blue: #7AA2F7; $blue2: #88AFFF;
$magenta: #BB9AF7; $cyan: #73DACA;
```

**Никаких хардкод-цветов в widget-файлах.** Меняется палитра → меняется один файл.

## Mixins (`_mixins.scss` — предлагается добавить)

Сейчас каждый widget дублирует `background-color + border-radius + margin + padding`. Выносим:

```scss
// src/scss/_mixins.scss

@mixin tile {
    background-color: $background;
    border-radius: 12px;
    margin: .5rem;
    padding: 1.5rem;
}

@mixin tile-alt {
    @include tile;
    background-color: $background-alt2;
}

@mixin icon-btn {
    padding: .5rem .8rem;
    border-radius: 10px;
    color: $foreground;
    &:hover {
        color: $blue;
        background-color: rgba(255, 255, 255, 0.05);
    }
}

@mixin nerd {
    font-family: "JetBrainsMono Nerd Font";
}

@mixin mono-bold($size: 1.2em) {
    font-family: "Comic Mono";
    font-weight: bold;
    font-size: $size;
}
```

Подключи в `eww.scss` **первым** после `variables`:

```scss
@import "src/scss/variables";
@import "src/scss/mixins";
@import "src/scss/index";
// ...
```

## Шрифты

В rxyhn 4 семейства:
- **JetBrainsMono Nerd Font** — иконки (всё где юникод-глифы из PUA)
- **Comic Mono** — заголовки, цифры времени
- **Cartograph CF** — курсивный акцент (artist/song/author)
- **Font Awesome 5 Pro/Free** — часть иконок (проблема: у тебя стоит только Nerd Font → Font Awesome иконки тофят)
- **feather** — иконки в powermenu

**Рекомендация**: перевести всё на JetBrainsMono Nerd Font. Там есть feather, font-awesome, devicon — всё в одном. Font Awesome/feather классы в SCSS **заменить на** `@include nerd`.

Список установленных на хосте:
```bash
fc-list | grep -iE "nerd|comic|cartograph|feather|awesome"
```

Если чего-то нет — либо поставить (`paru -S ttf-nerd-fonts-symbols`), либо заменить шрифт-семью в SCSS.

## Ограничения GTK3 CSS

Работают:
- `background-color`, `background-image`, `background-size/position`
- `color`, `font-family`, `font-size`, `font-weight`, `font-style`
- `padding`, `margin`
- `border`, `border-radius`
- `min-width`, `min-height`
- `:hover`, `:active`, `:focus`
- Вложенность SCSS (`.a { .b { } }`)

**НЕ работают**:
- `display: flex/grid` — у GTK свой layout, управляется через `:orientation`/`:space-evenly`/`:halign`/`:valign` в yuck
- `position: absolute/fixed`
- `z-index`
- `transform`, `transition`, `animation` — частично, через `transition-property`, но не всё
- CSS-variables (`--foo`) — используй SCSS-переменные
- `calc()` — кое-где работает, но ненадёжно

**Частично**:
- `opacity` — работает на элементе целиком
- псевдоэлементы `::before/::after` — нет, используй реальные `<label>`
- `margin: 0 auto` — **НЕ работает** (parser roняет: `Junk at end of value for margin`). Центрируй через `:halign "center"` в yuck на родителе

## Pango markup в `label`

У `(label)` есть секретное оружие — **Pango-markup**: HTML-подобные теги прямо в тексте.

```yuck
(label :text "CPU: <span foreground='#f7768e' weight='bold'>78%</span> из 100"
       :use-markup true)
```

Вместо трёх вложенных label с разными классами — один label с inline-тегами.

Что поддерживается:
- `<b>bold</b>`, `<i>italic</i>`, `<u>underline</u>`, `<s>strikethrough</s>`
- `<span foreground='#hex'>цвет</span>`
- `<span background='#hex' foreground='...'>...</span>`
- `<span size='large'>` / `<span size='12000'>` (pt × 1000)
- `<sup>`, `<sub>`, `<tt>` (monospace)

Обязательно: `:use-markup true` на label — иначе eww покажет теги как текст.

**Когда полезно**: номер с единицами другим цветом, составные строки, подсветка слов внутри сообщения. Когда НЕ полезно: сложные вёрстки — там лучше несколько виджетов.

## Жадность боксов: `:hexpand` / `:vexpand`

GTK3 boxes по умолчанию **занимают свой минимум** (по содержимому). Чтобы бокс растянулся в доступное пространство — поставь `:hexpand true` или `:vexpand true`.

```yuck
;; Распушить левую часть, прижать правую
(box :orientation "h" :space-evenly false
    (label :text "Title" :hexpand true :halign "start")
    (label :text "X" :halign "end"))
```

- `:hexpand true` на элементе = «я хочу расти по горизонтали».
- `:space-evenly true` на box = «распределить детей равномерно».
- `:halign "fill"` = «растянуться по ширине».
- `:halign "start"|"end"|"center"` = «прижаться туда».

**Правило**: `:hexpand/:vexpand` на ребёнке, `:halign/:valign` на ребёнке для прижатия, `:space-evenly` на родителе.

**Типичная ошибка**: новички раздувают виджет через `margin/padding` в SCSS — не работает, нужен `:hexpand true` на правильном уровне.

## Выравнивание и вёрстка

Вся «raster-геометрия» — через yuck:

- `:orientation "h"|"v"` — направление потока детей
- `:space-evenly true|false` — растягивать ли детей по всему пространству (default: true!)
- `:halign "start"|"center"|"end"|"fill"` / `:valign ...` — выравнивание самого бокса в родителе
- `:spacing N` — отступ между детьми
- `:hexpand true/false` / `:vexpand true/false` — расти ли в доступное пространство

**Частая ошибка**: забыл `:space-evenly false` → дети раздулись до full-width, выглядит криво. Почти всегда в дашбордных тайлах нужно `false`.

## Border & тени

GTK3 поддерживает `border: Npx solid color` и `border-radius`. Тени через `box-shadow` часто глючат на layer-shell окнах (обрезаются). Для «glass»-эффекта лучше делегировать Hyprland через `layerrule = blur, <namespace>`.

## GTK-nodes (под-узлы) — скрытая подмножка CSS

GTK-виджеты внутри себя имеют **под-узлы** со своими селекторами. Если хочешь покрасить часть виджета — надо знать как.

### scale (прогресс-бар / слайдер)

```scss
.my-scale {
    trough   { background-color: $background-alt; min-height: 4px; border-radius: 2px; }
    highlight { background-color: $blue; border-radius: 2px; }  // заполненная часть
    slider   { all: unset; }  // thumb (ползунок) — скрыть
}
```

Node-дерево: `scale > trough > highlight`, `scale > trough > slider`.

### entry (input)

```scss
.my-input {
    selection { background-color: $blue; color: $background; }
    // сам текст — просто .my-input { color: ... }
    // placeholder — нет отдельного селектора, эмулируй через :empty + label
}
```

### button (с иконкой/текстом внутри)

```scss
.my-btn {
    // фон кнопки
    background-color: $background;
    // дочерний label:
    label { color: $foreground; font-size: 1.1em; }
    // состояния:
    &:hover { ... }
    &:active { ... }
    &:focus { ... }
    &:disabled { opacity: .4; }
}
```

### circular-progress

```scss
.my-radial {
    color: $blue;    // цвет заполнения
    background-color: $background-alt;  // цвет «пустой» части
    // text/label внутри — обычный селектор:
    label { color: $foreground; }
}
```

### revealer / stack — никаких под-узлов

Transition/anchor задаются в yuck (`:transition`, `:duration`), SCSS управляет только видимой оболочкой.

### Как узнать какие есть под-узлы

```bash
GTK_DEBUG=interactive eww open dashboard
```

Откроется GTK Inspector — можно кликать по элементам и видеть CSS-классы и под-узлы. Работает если инспектор собран в gtk (обычно да).

## Hot-reload

- `eww reload` — перечитывает ВСЁ (yuck + scss). Работает почти всегда.
- При изменении `defwindow` (геометрия, namespace) — иногда нужен `eww close NAME && eww open NAME`.
- Ошибки → `eww logs` (логи в `~/.cache/eww/eww_*.log`).
