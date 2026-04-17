# Сервисы / источники данных

Слой между astal-библиотеками (и собственными polling-скриптами) и виджетами. Виджет никогда не импортит `gi://AstalMpris` напрямую — только через обёртку отсюда.

Все сервисы — в `src/services/`.

## Почему обёртка

1. Единая точка, если astal-API сломается — меняем в одном месте.
2. Удобное именование (`systemService.batteryPercent` vs `createBinding(Battery.get_default(), "percentage")`).
3. Комбинированные метрики (например, «batteryIcon» — зависит от level и charging) — логика только здесь, не в виджетах.
4. Fallback-данные когда сервис недоступен (нет batteryproxy — поставить 1.0 или null).

---

## `systemService` (src/services/system.ts)

| экспорт | тип | описание |
|---|---|---|
| `batteryPercent` | `Accessor<number>` | 0..1, реактивно (Astal.Battery) |
| `batteryCharging` | `Accessor<bool>` | заряжается ли |
| `batteryAvailable` | `Accessor<bool>` | есть ли батарея вообще |
| `volume` | `Accessor<number> \| null` | 0..1 громкости (Astal.Wp), `null` если WP отсутствует |
| `volumeMuted` | `Accessor<bool> \| null` | mute статус |
| `ramUsed` | `Accessor<number>` | 0..1 использования RAM (polling 2s) |
| `cpuUsed` | `Accessor<number>` | 0..1 загрузки CPU (polling 2s) |
| `brightness` | `Accessor<number>` | 0..1 яркости экрана (brightnessctl) |
| `uptime` | `Accessor<string>` | "1 hour, 20 minutes" |
| `diskFree` | `Accessor<string>` | "99G / 135G" |

Poll-интервалы выбираются из расчёта «нагрузка vs актуальность»: клок — 1s, мем/CPU — 2s, диск — 30s, uptime — 60s.

---

## `musicService` (src/services/music.ts)

| экспорт | тип | описание |
|---|---|---|
| `player` | `Accessor<Player \| null>` | первый активный плеер (MPRIS) |
| `title(p)` | `Accessor<string>` | название трека |
| `artist(p)` | `Accessor<string>` | исполнитель |
| `cover(p)` | `Accessor<string>` | путь к обложке |
| `playing(p)` | `Accessor<PlaybackStatus>` | "Playing" / "Paused" / "Stopped" |
| `toggle(p)` | fn | play/pause |
| `next/prev(p)` | fn | переключение |
| `shuffle(p)` | fn | toggle shuffle |

Плеер передаётся параметром, т.к. подписка на свойства требует unwrap из Accessor. В JSX удобнее делать так:

```tsx
const player = musicService.player;
<label label={player(p => p?.title ?? "—")} />
```

---

## `clockService` (src/services/clock.ts)

| экспорт | тип | описание |
|---|---|---|
| `time` | `Accessor<string>` | "HH:MM" (poll 1s) |
| `date` | `Accessor<string>` | "DD/MM/YY" (poll 60s) |
| `weekday` | `Accessor<string>` | "Monday" (poll 60s) |

Если нужен более сложный формат — добавить сюда, не в виджет.

---

## `tasksService` (src/services/tasks.ts)

Читает `~/.todo.txt` (формат todo.txt).

| экспорт | тип | описание |
|---|---|---|
| `raw` | `Accessor<string>` | первые 20 строк |
| `total` | `Accessor<number>` | общее кол-во задач |
| `highPriority` | `Accessor<number>` | кол-во с `(A)` |
| `next` | `Accessor<string>` | первая задача без `(X)` префикса |

---

## Как добавить свой сервис

1. Создать `src/services/foo.ts`.
2. Экспортировать объект `fooService` с Accessor-полями (через `createBinding` / `createPoll` / `createState` / `createComputed`).
3. Задокументировать здесь таблицей.
4. В виджете — только `import { fooService } from "../services/foo"`.

### Паттерны

**Единственное значение от polling-команды:**

```ts
import { createPoll } from "ags";
export const myService = {
    ip: createPoll("", 60_000, "bash -c 'curl -s ifconfig.me'"),
};
```

**Свойство GObject из Astal:**

```ts
import Battery from "gi://AstalBattery";
import { createBinding } from "ags";
const batt = Battery.get_default();
export const myService = {
    percent: createBinding(batt, "percentage"),
};
```

**Комбинированная метрика:**

```ts
import { createComputed } from "ags";
export const myService = {
    batteryLabel: createComputed(
        [batteryPercent, batteryCharging],
        (p, c) => `${Math.round(p * 100)}%${c ? " ⚡" : ""}`
    ),
};
```

**Ручной event-loop / GObject:**

Если нужен нестандартный источник (WebSocket, fs watch) — создаём `GObject.Object`-наследника с `notify`, экспортируем binding на него. Пример в `services/_template_gobject.ts` (TODO).
