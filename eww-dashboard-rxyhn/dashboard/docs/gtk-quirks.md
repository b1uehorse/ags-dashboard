# GTK3/eww: особенности layout и CSS

Заметки по тому, как на самом деле считается геометрия в eww/GTK3.
Писалось после охоты на выравнивание колонок — чтобы не наступать второй раз.

## Размерная модель

В GTK3 CSS **нет** `box-sizing: border-box`. Модель аддитивная:

```
внешняя_ширина = content(min-width) + 2·padding + 2·border + 2·margin
```

- `min-width` задаёт **content-box**. Padding и border GTK приплюсовывает сверху.
- Если хочешь чтобы два виджета имели одинаковую **внешнюю** ширину —
  либо уравнивай у них padding/border/margin и ставь одинаковый min-width,
  либо считай сумму вручную.

## `hexpand` — это просьба, не приказ

`:hexpand true` говорит "я хочу лишнее место". Если родитель не даёт ширины
(например v-box без `min-width` и без `hexpand` у самого родителя),
expand не из чего взять. Тогда `:halign "fill"` визуально не работает.

Чтобы ребёнок реально растянулся — родитель должен быть шире чем natural width
ребёнка. Это достигается одним из:
- `:min-width` на родителе
- родитель сам `:hexpand true` с родителем-родителя, дающим ширину
- sibling с бóльшей natural width (v-box берёт max по детям)

## Нет аналога GtkSizeGroup

В yuck нельзя сказать "эти N виджетов одной ширины". Единственный рабочий путь —
руками проставить **одинаковый `min-width` в px** всем участникам, и при этом
следить что padding/margin у них тоже сходятся (см. аддитивную модель).

## `:space-evenly` vs `:homogeneous`

Оба атрибута на `box` работают по-разному:

- `:space-evenly true` — делит свободное место на **равные промежутки между детьми
  И по краям**. Правый ребёнок НЕ упирается в правую границу контейнера.
  Годится для симметричного расклада, не годится для прижима к краям.
- `:homogeneous true` — даёт **каждому ребёнку одинаковую ширину** (ширина_родителя / N).
  Годится для N одинаковых ячеек на всю ширину без зазоров по краям.
- `:space-evenly false` (default) — дети пакуются в начало, с `:spacing` между ними.

## Прижим к краю через filler

Чтобы в h-box один ребёнок упёрся в правый край:

```yuck
(box :orientation "h" :space-evenly false
  (thing-left)
  (box :hexpand true)   ;; filler съедает всё свободное место
  (thing-right))
```

Filler — это обычный пустой `(box :hexpand true)`. Работает потому что
hexpand-ребёнок забирает всё оставшееся пространство, отодвигая следующего соседа
к концу.

## `circular-progress` — кастомный виджет, CSS им почти не рулит

Важно: **это не обычный GTK widget**. Его диаметр вычисляется изнутри и
**игнорирует** `min-width` обёртки. Формула:

```
diameter ≈ label_bbox + 2·label_padding + 2·thickness
```

- `:thickness` задаётся в yuck — это **integer пикселей**, не em.
- `label_padding` и `label_min_width` из CSS.
- Если label в em, а thickness в px — при смене font-size диаметр прыгает
  ступенями из-за округления thickness. Нелинейно.

**Следствие**: контролировать выравнивание circular-progress с соседними tile'ами
через `min-width` не получится. Нужно либо фиксировать всю геометрию лейбла и
thickness в абсолютных px и подгонять вручную, либо заменить на обычный виджет.

Для линейных метрик (загрузка, проценты, температура) предпочитать
`scale :active false` — это стандартный GtkScale, геометрия контролируется CSS
на `trough` и `highlight`/`progress`.

Пример: `src/yuck/_widgets.yuck` → `defwidget metric-cell` + `defwidget sysbar`.

## SCSS: переменные проекта

`src/scss/variables.scss` содержит палитру, импортируется автоматически:

```
$background, $background-alt, $background-alt2   — фоны (с alpha)
$foreground                                       — текст
$red, $yellow, $orange, $green, $blue, $blue2,
$magenta, $cyan                                   — акценты (Tokyo Night)
```

Если нужен вариант с прозрачностью (например tertiary text),
используй `rgba(169, 177, 214, 0.7)` напрямую — alias'а `$foreground-alt` нет.

## Перезапуск eww

`eww reload` не всегда подхватывает SCSS (особенно после добавления новых файлов
или переменных). Если правки видны в .scss, но на экране старый рендер:

```bash
eww kill
eww daemon &
eww open dashboard
```

Это гарантирует полную перекомпиляцию yuck и SCSS.

## Стилизация GtkScale как прогресс-бара

`(scale :active false :min 0 :max 100 :value V)` рендерится как GtkScale.
Тонкая полоска достигается стилизацией внутренних GTK-узлов:

```scss
.my-bar {
    min-height: 6px;

    trough {
        min-height: 6px;
        background-color: $background-alt2;
        border-radius: 3px;
        border: none;
    }

    highlight, progress {
        min-height: 6px;
        border-radius: 3px;
        background-color: $blue;
    }
}
```

Селекторы `trough`, `highlight`, `progress` — это внутренние GTK-узлы, а не наши
CSS-классы. GTK3 CSS поддерживает такую адресацию через node names.
