# Примитивы

Каталог переиспользуемых кирпичей. Все — в `src/primitives/`.

Принцип: примитивы не знают про бизнес-логику, только принимают props, рендерят GTK. Если что-то тянется на данные (Battery, MPRIS и т.п.) — это уже виджет, а не примитив.

---

## `<Tile>` — контейнер-карточка

Базовый блок дашборда: фон темы, скругление, паддинг.

**Props:**

| name | type | default | описание |
|---|---|---|---|
| `class` | string | `""` | доп CSS-классы через пробел |
| `orientation` | `"vertical" \| "horizontal"` | `"vertical"` | направление flexbox |
| `spacing` | number | `8` | зазор между детьми (px) |
| `hexpand` | bool | `false` | тянуться по горизонтали |
| `vexpand` | bool | `false` | тянуться по вертикали |
| `children` | | | что угодно |

**Пример:**

```tsx
<Tile class="profile-tile" vexpand>
    <label label="Hello" />
</Tile>
```

Стиль `.tile` — в `style.scss`. Переопределить paddings/размеры — через `class` + отдельный класс в scss (`.profile-tile { padding: 1.2rem; }`).

---

## `<Stack>` — flex-контейнер без фона

Обёртка над `<box>` с удобными enum-значениями `halign`/`valign`/`orientation`. Используется для композиции, не имеет своей стилизации.

**Props:**

| name | type | default | описание |
|---|---|---|---|
| `orientation` | `"h" \| "v"` | `"v"` | направление |
| `spacing` | number | `0` | зазор (px) |
| `class` | string | `""` | доп классы |
| `hexpand`/`vexpand` | bool | `false` | тянуться |
| `halign`/`valign` | `"start" \| "center" \| "end" \| "fill"` | `"fill"` | выравнивание |

**Пример:**

```tsx
<Stack orientation="h" spacing={10} halign="center">
    <label label="A" />
    <label label="B" />
</Stack>
```

---

## `<IconButton>` — прозрачная кнопка с иконкой

Nerd Font glyph или любой текст. Hover подсвечивает через `$accent`.

**Props:**

| name | type | default | описание |
|---|---|---|---|
| `icon` | string | — | символ (U+F048 и т.п.) |
| `onClick` | `() => void` | — | колбэк |
| `tooltip` | string | — | hover tooltip |
| `class` | string | `""` | доп классы |

**Пример:**

```tsx
<IconButton icon="" tooltip="play" onClick={() => execAsync("playerctl play-pause")} />
```

---

## `<CircularMeter>` — круговой индикатор 0..1

Ring-progress от `Astal.CircularProgress`, в центре — иконка. Значение — реактивное (Accessor).

**Props:**

| name | type | default | описание |
|---|---|---|---|
| `value` | `Accessor<number>` | — | 0..1, реактивный |
| `icon` | string | — | центральная иконка |
| `size` | number | `56` | px |
| `thickness` | number | `6` | px толщина кольца |
| `class` | string | `""` | доп классы |

**Пример:**

```tsx
<CircularMeter value={systemService.batteryPercent} icon="" />
```

---

## `<Avatar>` — круглая аватарка

Картинка с border-radius = size (круг). Через CSS `background-image`.

**Props:**

| name | type | default | описание |
|---|---|---|---|
| `path` | string | — | абсолютный путь к изображению |
| `size` | number | `72` | px (квадрат) |
| `class` | string | `""` | доп классы |

**Пример:**

```tsx
<Avatar path="/home/bekh/.config/ags/assets/profile.png" size={80} />
```

---

## Когда добавлять новый примитив

Если один и тот же «форм-фактор» встречается в 2+ виджетах — вынести сюда. Примеры кандидатов на будущее:

- `<Sparkline>` — мини-график последних N значений (для CPU/Network/etc)
- `<ProgressBar>` — линейный индикатор
- `<Badge>` — пилюля с текстом и цветом (для статусов)
- `<ScrollList>` — прокручиваемый список с фиксированной высотой
- `<KeyValue>` — иконка/ключ + значение в строку (используется в TaskList, надо вынести)
