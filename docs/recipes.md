# Рецепты

Готовые решения для типовых «а как мне сделать X».

---

## Новый тайл с реактивной метрикой

```tsx
// src/widgets/CpuTemp.tsx
import Tile from "../primitives/Tile";
import { createPoll } from "ags";

const temp = createPoll(0, 2000, "bash -c \"sensors | awk '/Package/{print \\$4}' | tr -d '+°C'\"");

export default function CpuTemp() {
    return (
        <Tile class="cputemp-tile">
            <label label={temp((t: any) => `${t}°C`)} />
        </Tile>
    );
}
```

Потом в dashboard:

```tsx
import CpuTemp from "../widgets/CpuTemp";
// ...
<CpuTemp />
```

И стиль в `style.scss`:

```scss
.cputemp-tile { min-width: 80px; }
```

---

## Кнопка запускающая shell-команду

```tsx
import { execAsync } from "ags/process";
import IconButton from "../primitives/IconButton";

<IconButton
    icon=""
    tooltip="Screenshot"
    onClick={() => execAsync("grim -g \"$(slurp)\" ~/Pictures/screen.png")}
/>
```

`execAsync` возвращает Promise, можно `.then(out => ...)` или `.catch(err => ...)`.

---

## Ввод с `<entry>` и обработка Enter

Для мини-терминала или быстрого поиска:

```tsx
import { execAsync } from "ags/process";
import { createState } from "ags";

export default function QuickCmd() {
    const [text, setText] = createState("");
    return (
        <entry
            placeholderText="type shell cmd..."
            text={text}
            onChanged={(self: any) => setText(self.text)}
            onActivate={(self: any) => {
                execAsync(["bash", "-c", self.text]);
                setText("");
            }}
        />
    );
}
```

---

## Toggle видимости виджета по хоткею

В `hyprland.conf`:

```
bind = SUPER, T, exec, ags toggle-window my-widget
```

Где `my-widget` — `name` у `<window>`.

---

## Мониторинг изменения файла (fs watch)

Для когда нужны мгновенные обновления (не polling).

```ts
// src/services/watchedFile.ts
import { monitorFile } from "ags/file";
import { createState } from "ags";

const [content, setContent] = createState("");

monitorFile("/path/to/file", (file, event) => {
    if (event === "changes-done-hint" || event === "created") {
        Utils.readFileAsync(file).then(setContent);
    }
});

export const watchedService = { content };
```

---

## Новый dashboard с собственным layer

```tsx
// src/dashboards/topbar.tsx
import { Astal } from "ags/gtk4";
import app from "ags/gtk4/app";

export default function Topbar() {
    return (
        <window
            visible name="topbar" namespace="ags-topbar"
            application={app}
            layer={Astal.Layer.TOP}
            anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT | Astal.WindowAnchor.RIGHT}
            exclusivity={Astal.Exclusivity.EXCLUSIVE}
        >
            {/* ... */}
        </window>
    );
}
```

Регистрируем в `app.ts`:

```ts
import Topbar from "./src/dashboards/topbar";
app.start({
    css: style,
    main() {
        RxyhnDashboard();
        Topbar();
    },
});
```

`EXCLUSIVE` — резервирует место, обычные окна не залезают поверх.

---

## Анимированное появление окна

GTK4 CSS поддерживает transitions:

```scss
.dashboard {
    opacity: 0;
    transition: opacity 300ms ease;
}
.dashboard.show {
    opacity: 1;
}
```

В TSX переключать класс:

```tsx
const [visible, setVisible] = createState(false);
<box cssClasses={visible(v => ["dashboard", ...(v ? ["show"] : [])])}>
```

---

## Уведомления (notifyd)

```ts
import Notifd from "gi://AstalNotifd";
const nd = Notifd.get_default();

// отправить
nd.send_notification({ summary: "Hello", body: "world" });

// подписаться на входящие
nd.connect("notified", (_, id) => {
    const n = nd.get_notification(id);
    console.log(n.summary);
});
```

---

## Получить текущий workspace Hyprland

```ts
import Hyprland from "gi://AstalHyprland";
import { createBinding } from "ags";

const h = Hyprland.get_default();
const ws = createBinding(h, "focusedWorkspace");

// в JSX:
<label label={ws((w: any) => `WS ${w.id}`)} />
```

Полезно для виджетов-индикаторов в баре.
