# Рецепт: interactive (состояние UI через defvar + клики)

Когда виджет должен реагировать на клик: toggle панели, переключение вкладок, DND-режим, свёртка/развёртка.

## Ожидаемые сценарии

- Кнопка «details» сворачивает/разворачивает блок.
- Таб-свитчер: 3 кнопки сверху, ниже меняется содержимое.
- Pin/unpin виджета.

## Сборка toggle-панели (2 минуты)

### 1. Состояние

```yuck
;; src/yuck/_variables.yuck
(defvar details-open "false")
```

Значение — строка (не bool). Сравнение через `==`.

### 2. Виджет

```yuck
;; src/yuck/_widgets.yuck
(defwidget details-toggle []
    (box :class "tile" :orientation "v" :space-evenly false :spacing 8
        (box :orientation "h" :space-evenly false :spacing 10
            (label :class "tile-title" :text "Details" :hexpand true :halign "start")
            (button :class "icon-btn"
                    :onclick "eww update details-open=${details-open == 'true' ? 'false' : 'true'}"
                    "${details-open == 'true' ? '' : ''}"))
        (revealer :transition "slidedown"
                  :reveal {details-open == "true"}
                  :duration "200ms"
            (box :orientation "v" :space-evenly false :spacing 4
                (label :text "это содержимое" :halign "start")
                (label :text "видно только когда открыто" :halign "start")))))
```

**Ключевое**:
- `eww update NAME=value` — единственный способ изменить `defvar`.
- `(revealer ...)` — встроенный анимированный контейнер.
- `:transition` — `none`/`crossfade`/`slideleft`/`slideright`/`slideup`/`slidedown`.
- Сравнение `== 'true'` строковое, кавычки одинарные в JSX-подобной вставке.

### 3. SCSS — ничего специфичного

Тайл через миксин. `icon-btn` тоже из миксина.

### 4. Готово

```bash
eww reload
```

## Паттерн: переключаемая вкладка

```yuck
(defvar tab "time")   ;; "time" | "weather" | "system"

(defwidget tab-switcher []
    (box :class "tile" :orientation "v" :space-evenly false :spacing 8
        ;; хедер — 3 кнопки
        (box :orientation "h" :space-evenly true :spacing 6
            (button :class "tab-btn ${tab == 'time' ? 'active' : ''}"
                    :onclick "eww update tab=time" "Time")
            (button :class "tab-btn ${tab == 'weather' ? 'active' : ''}"
                    :onclick "eww update tab=weather" "Weather")
            (button :class "tab-btn ${tab == 'system' ? 'active' : ''}"
                    :onclick "eww update tab=system" "System"))
        ;; контент — через stack (показывает только match-child)
        (stack :selected tab :transition "crossfade"
            (box :name "time"    (clock))
            (box :name "weather" (weather))
            (box :name "system"  (sysbar)))))
```

`(stack ...)` — ещё один встроенный контейнер: показывает ровно один ребёнок, чьё `:name` совпадает с `:selected`.

SCSS:
```scss
.tab-btn {
    @include icon-btn;
    padding: .4rem 1rem;
    &.active { color: $blue; background-color: rgba(122, 162, 247, 0.15); }
}
```

## Паттерн: hover-trigger

Hover не меняет defvar, но можно показать/скрыть через `:hover` в SCSS:

```yuck
(box :class "hover-group"
    (label :text "Hover me")
    (box :class "hover-secret"
        (label :text "secret!")))
```

```scss
.hover-secret { opacity: 0; transition: opacity .2s; }
.hover-group:hover .hover-secret { opacity: 1; }
```

## Паттерн: кликнул → запусти команду + обнови defvar

```yuck
(button :onclick "playerctl play-pause && eww update last-action='play-toggle'"
        "")
```

Цепочка через `&&` / `;` как в bash. Первый exit-code важен для `&&`.

## Паттерн: форма (ввод → действие)

```yuck
(defvar input-text "")

(defwidget quick-cmd []
    (box :class "tile" :orientation "v" :space-evenly false :spacing 6
        (input :class "cmd-input"
               :onchange "eww update input-text={}"
               :value input-text)
        (button :class "icon-btn"
                :onclick "${input-text} &"
                ">")))
```

- `(input ...)` — текстовое поле. `:onchange` ловит каждое нажатие, `{}` = значение поля.
- `:value input-text` — двусторонняя привязка (форма отображает текущее значение defvar).
- При нажатии кнопки запускается shell-команда из поля.

## Частые ошибки

| Симптом | Причина |
|---|---|
| `defvar` не обновляется | Не `eww update` а что-то ещё; ошибка в escaping |
| Revealer всегда открыт | Забыл `:reveal {...}` — по умолчанию `true` |
| Stack показывает первый child всегда | `:selected` не матчит `:name` строго (case-sensitive) |
| Клик «проваливается» | `:onclick` на `box` не работает, нужен `button` |

## Чеклист

- [ ] `defvar` инициализирован осмысленным дефолтом
- [ ] Клик меняет state через `eww update`
- [ ] Сравнения — строковые, одинарные кавычки в вставках
- [ ] Revealer обёрнут в box с `:space-evenly false`
- [ ] Если `input` — `keymode = "on-demand"` в defwindow, иначе клавиатура не схватывается
