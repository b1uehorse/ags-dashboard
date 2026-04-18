# Окна: геометрия, anchor, stacking, namespace

Второй виджет или многомониторный сетап — и `defwindow` становится реальной темой.

## Три типа позиционирования

### 1. Anchor-based (прилипание к стороне)

```yuck
(defwindow sidebar
    :monitor 0
    :geometry (geometry :x "20px" :y "0px"
                        :width "280px" :height "100%"
                        :anchor "top right")
    :stacking "top"
    ...)
```

- `:anchor "top right"` — окно прилипает к верхнему-правому углу. `:x`/`:y` — отступ **от этой точки**.
- Варианты: `"top|bottom|center"` + `"left|right|center"`. `"center center"` = точный центр.
- `:width/:height` в px или `%` от экрана.

**Когда**: бары, сайдбары, корнер-плашки, OSD.

### 2. Floating centered (плавающее по центру экрана)

```yuck
(defwindow dashboard
    :monitor 0
    :geometry (geometry :x 0 :y 0 :width "1050px" :height "650px"
                        :anchor "center")
    :stacking "bottom"
    ...)
```

`:x :y = 0 0` + `:anchor "center"` → точно по центру. Смещение — через положительные/отрицательные x/y.

### 3. Полноэкранное / полупрозрачное поверх всего

```yuck
:anchor "center center"
:width "100%" :height "100%"
:stacking "overlay"
```

Плюс в yuck вокруг контента — большой `(box)` с клик-обработчиком для закрытия.

## Anchor ≠ margin — частая путаница

- **Anchor** — к какой стороне прилепить окно (layer-shell-понятие).
- **Margin** от края окна до контента — это padding tile-а внутри, через SCSS.

Если хочешь «виджет справа с отступом 20px от правого края» — **не ставь margin-right: 20px в scss**. Ставь:
```yuck
:anchor "top right"
:geometry (geometry :x "20px" :y "100px" ...)
```

## Stacking order

| Значение | Поведение |
|---|---|
| `"bottom"` | Ниже всех окон, выше обоев. Для дашбордов-«обоев». |
| `"background"` | Ниже даже layer-shell-окон других приложений. Только для фоновых виджетов. |
| `"top"` | Выше обычных окон (kitty, firefox). Для баров, тулбаров. |
| `"overlay"` | Выше всего — даже fullscreen. Для критичных OSD, lockscreen-like. |

## Exclusive zone

```yuck
:exclusive false  ;; окно НЕ резервирует место — обычные окна могут поверх него ходить
:exclusive true   ;; окно резервирует полосу вдоль своего anchor — как панель таскбара
```

Дашборд-обои = `false`. Бар/панель = `true`.

## Focusable

```yuck
:focusable false  ;; клики мыши проходят сквозь; клавиатура игнорируется
:focusable "ondemand"  ;; клики работают, клавиатура через Esc / явный focus
:focusable true  ;; полноценное окно (редко для дашбордов)
```

- `false` — статичный info-виджет.
- `"ondemand"` — интерактивный с кнопками/input-ами.
- `true` — всплывающее модальное окно.

## Namespace (для layer-shell)

```yuck
:namespace "eww-dashboard"
```

Устанавливает уникальный layer-shell namespace. Нужен чтобы:
- Hyprland-правила фильтровали именно этот виджет: `layerrule = blur, eww-dashboard`.
- Другие eww-окна не смешивались с этим в правилах.

Без `:namespace` eww использует `gtk-layer-shell` (общий) — блюр/правила применятся ко всем eww-окнам скопом.

## Мультимонитор

```yuck
:monitor 0  ;; первый монитор
:monitor 1  ;; второй
:monitor "DP-1"  ;; по имени (hyprctl monitors -j)
```

**Чтобы узнать имена**:
```bash
hyprctl monitors | grep -E "Monitor|description"
```

Если монитор с `:monitor 1` отключили — eww **молча не откроет окно**. Лучше иметь fallback-скрипт который определяет и подставляет defvar с индексом.

## Скрытие/показ по workspace (Hyprland)

Layer-shell **не биндится к workspace** в Hyprland — живёт на мониторе, виден всегда. Чтобы виджет жил только на ws N:

```bash
# scripts/pin-to-ws.sh 1
# слушает socket2 Hyprland, делает eww open/close на workspace>>N
```

См. `scripts/pin-ws.sh` — рабочий образец. Добавь в hyprland.conf:
```
exec-once = ~/.config/eww/dashboard/scripts/pin-ws.sh 1
```

## Шаблон: несколько окон из одного конфига

```yuck
(defwindow bar-left
    :monitor 0
    :geometry (geometry :anchor "top left" :width "300px" :height "40px")
    :stacking "top"
    :exclusive true
    (left-bar))

(defwindow bar-right
    :monitor 0
    :geometry (geometry :anchor "top right" :width "300px" :height "40px")
    :stacking "top"
    :exclusive true
    (right-bar))
```

Открываются по отдельности:
```bash
eww open bar-left
eww open bar-right
```

Или все разом: `eww open-many bar-left bar-right`.

## Чеклист

- [ ] Для многомониторного сетапа — `:monitor` явный
- [ ] `:namespace "uniq-name"` если собираешься делать Hyprland-правила
- [ ] `:exclusive` честно отражает назначение (бар vs плавающий)
- [ ] `:focusable "ondemand"` если есть input/button с keymap
- [ ] Геометрия — через `:anchor` + x/y, а не margin в SCSS
