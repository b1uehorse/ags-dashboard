# Рецепт: button-grid (сетка/колонка launcher-кнопок)

Колонка или сетка иконок, каждая открывает приложение или выполняет действие. Типичный «app dock».

## Ожидаемый вид

```
┌───┐
│ 🦊 │  firefox
│ 💬 │  telegram
│ 📝 │  code
│ 💻 │  terminal
└───┘
```

Все иконки **одинаковой ширины**, centered, hover подсвечивает синим.

## Ключевая проблема

Разные nerd-font глифы имеют разную intrinsic ширину → `halign: center` даёт кривую колонку. Решение — жёсткий `min-width` на кнопках.

## Сборка (2 минуты)

### 1. Данные (нет — всё hardcoded)

Список приложений описывается прямо в yuck. Можно вынести в `defvar`-массив, но для 5-7 кнопок не стоит.

### 2. Виджет

```yuck
;; src/yuck/_widgets.yuck

(defwidget launch-btn [icon cmd ?class ?tooltip]
    (button :class "launch-btn ${class ?: ''}"
            :onclick "${cmd} &"
            :tooltip {tooltip ?: ''}
        icon))

(defwidget app-column []
    (box :class "tile applications"
         :orientation "v"
         :space-evenly false
         :spacing 12
        (launch-btn :icon "" :cmd "nautilus"       :tooltip "Files")
        (launch-btn :icon "" :cmd "telegram-desktop" :tooltip "Telegram")
        (launch-btn :icon "" :cmd "code"            :tooltip "VSCode")
        (launch-btn :icon "" :cmd "kitty"           :tooltip "Terminal")
        (launch-btn :icon "" :cmd "firefox"         :tooltip "Firefox")))
```

**Ключевые детали**:
- `:onclick "${cmd} &"` — амперсанд обязателен, иначе кнопка блокнется на время запуска приложения.
- `:tooltip` обязателен — помогает нахойер вспомнить что куда.
- `launch-btn` — переиспользуемый примитив: один раз описал, везде зовёшь.

### 3. SCSS

```scss
// src/scss/widgets/applications.scss
.applications {
    @include tile;
    padding: 1rem .5rem;
}

.launch-btn {
    @include nerd;
    @include icon-btn;
    min-width: 48px;      // ← выравнивает разноширинные глифы
    min-height: 48px;
    font-size: 2.4em;
    padding: 0;
}
```

**Почему `min-width: 48px` а не `width`**: CSS в GTK предпочитает min-hint-ы; `width` часто игнорится. 48 хватает большинству глифов, крупные (spotify ``) сами подвинут.

**Почему НЕ `label { margin: 0 auto; }`**: GTK3 CSS **не поддерживает** `auto` в margin-значениях (выдаёт `Junk at end of value for margin`). Центрирование label внутри button работает по-умолчанию — если label один ребёнок кнопки, GTK центрирует сам. Если нужна явная центровка — оберни в `(box :halign "center" label)` в yuck.

### 4. Вставить

```yuck
;; в src/yuck/_windows.yuck, внутри (defwidget dashboard ...)
(app-column)
```

### 5. Reload

```bash
eww -c ~/.config/eww/dashboard reload
```

## Вариации

### Горизонтальная панель

Поменять `:orientation "v"` → `"h"`, SCSS не трогать. Получится dock.

### 2D сетка

```yuck
(defwidget app-grid []
    (box :class "tile applications" :orientation "v" :space-evenly false
        (box :orientation "h" :spacing 10
            (launch-btn :icon "" :cmd "firefox")
            (launch-btn :icon "" :cmd "code"))
        (box :orientation "h" :spacing 10
            (launch-btn :icon "" :cmd "telegram-desktop")
            (launch-btn :icon "" :cmd "spotify"))))
```

### Цветная подсветка по группе

```yuck
(launch-btn :icon "" :cmd "firefox" :class "browser")
```
```scss
.launch-btn.browser:hover { color: $orange; }
```

### Кнопка с текстом-названием

```yuck
(defwidget labeled-btn [icon cmd text]
    (button :class "labeled-btn" :onclick "${cmd} &"
        (box :orientation "v" :space-evenly false :halign "center" :spacing 4
            (label :class "lbtn-icon" :text icon)
            (label :class "lbtn-text" :text text))))
```

### Powermenu-стиль (каждая кнопка своя команда + стиль)

Видно в `task-list` — `:onclick "systemctl poweroff"`, `:onclick "betterlockscreen -l"`. Паттерн тот же, просто не-приложения.

## Чеклист

- [ ] `launch-btn` — отдельный `defwidget` (переиспользовать)
- [ ] `min-width/min-height` на кнопке обязательно
- [ ] Центровка label внутри button — автоматом, если label единственный ребёнок (НЕ `margin: 0 auto` — GTK3 не поддерживает `auto`)
- [ ] `:onclick` с `&` в конце команды
- [ ] `:tooltip` на каждой кнопке
- [ ] Импорт `applications.scss` в `eww.scss`
