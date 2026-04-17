# Примитивы

Каталог переиспользуемых кирпичей. Все — в `src/primitives/`.

---

## `<Tile>`

Контейнер-карточка с фоном темы, скруглением, паддингом. Базовый блок дашборда.

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

## `<IconButton>`

Прозрачная кнопка с иконкой (Nerd Font кодпоинт или любой текст).

**Props:**

| name | type | default | описание |
|---|---|---|---|
| `icon` | string | — | символ (U+F048 и т.п.) |
| `onClick` | `() => void` | — | колбэк |
| `tooltip` | string | — | hover tooltip |
| `class` | string | `""` | доп классы |

**Пример:**

```tsx
<IconButton icon="" tooltip="play" onClick={() => spawn("playerctl play-pause")} />
```

Стиль `.icon-btn` — в `style.scss`. Hover подсвечивает цветом `$accent`.
