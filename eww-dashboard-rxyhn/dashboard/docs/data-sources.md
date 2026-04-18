# Источники данных: defpoll / deflisten / defvar

В eww три способа ввести значение в реактивное дерево. Ниже — когда какой.

## defpoll — периодический опрос

Запускает shell-команду раз в `:interval`, значение = stdout (без `\n` в конце).

```yuck
(defpoll loadavg :interval "5s" "cat /proc/loadavg | awk '{print $1}'")
```

**Когда**:
- Данные меняются по времени, без явного триггера: часы, погода, cpu, ram.
- OK на интервалах 1s — сотни таких поллов не напрягают eww.
- Для дорогих команд (api-вызовы, `nmcli device show`) ставь интервал 30s–10m.

**Подсказки**:
- Скрипт должен быть **быстрым** — блокирует eww на время выполнения.
- `:initial "..."` — значение до первого polling (иначе пустая строка).
- Строчные аргументы в скрипты передавать через env, не через аргументы — меньше эскейпа.

### Экономия ресурсов: `:run-while`

defpoll можно привязать к условию:
```yuck
(defpoll cpu-load
    :interval "1s"
    :run-while dashboard-open
    "awk '{print int($1*100)}' /proc/loadavg")

(defvar dashboard-open "true")
```

Пока `dashboard-open == "true"` — poll крутится. Пока `"false"` — поллинг остановлен, ресурсы не тратятся.

Связка с `eww open/close` через скрипт:
```bash
# обёртка вокруг открытия дашборда
eww update dashboard-open=true
eww open dashboard
# при закрытии:
eww update dashboard-open=false
eww close dashboard
```

**Когда**: тяжёлые polls (температуры gpu через `nvidia-smi`, системная статистика) которые не нужны пока дашборд скрыт.

### ⚠️ КРИТИЧНЫЙ АНТИ-ПАТТЕРН: медленный скрипт в defpoll

**Eww однопоточный в вычислении yuck.** Если скрипт выполняется >100ms — весь интерфейс залипает на этот интервал.

**Никогда** не делай в defpoll напрямую:
- `curl`, `wget`, `ping` — сетевые вызовы
- `nmcli device show` на активной сети — ждёт dhcp
- `apt list --upgradable` — шуршит по репам
- `find $HOME -name '*.log'` — шарит диск

**Правильный паттерн**: отдельный процесс кэширует в файл, defpoll читает файл.

```bash
# scripts/weather-cache — запускается по cron или exec-once
MAXAGE=600  # 10 мин
[ -f /tmp/weather.cache ] && [ $(($(date +%s) - $(stat -c %Y /tmp/weather.cache))) -lt $MAXAGE ] && exit 0
curl -s wttr.in > /tmp/weather.cache.tmp && mv /tmp/weather.cache.tmp /tmp/weather.cache
```

```yuck
(defpoll weather :interval "60s" "jq -r .temp_C /tmp/weather.cache")
```

Скрипт-читатель = 5ms, кэш обновляется отдельно. UI не тормозит.

---

## deflisten — стрим от долгоживущего процесса

Запускает скрипт один раз, читает stdout построчно. Каждая строка = новое значение.

```yuck
(deflisten current-workspace :initial "1"
    "~/.config/eww/dashboard/scripts/hypr-ws-listener")
```

Где `hypr-ws-listener` — bash, который держит UNIX-socket Hyprland и на событие `workspace>>N` печатает `N\n`.

**Когда**:
- Есть источник событий: `socat`, `dbus-monitor`, `inotifywait`, `hyprctl` socket2, `mpris` signals.
- Polling был бы расточительным (ws меняется пару раз в минуту — poll каждую секунду нечего делать).

**Важно**:
- Скрипт **не должен завершаться** — eww отрубит подписку.
- `flush=True` в python / `stdbuf -oL` в bash — иначе линии буферизуются.
- При падении скрипта eww **не рестартит** его автоматом (в версии 0.5+). Пишите с `while true; do ...; done`.

---

## defvar — in-memory переменная

Начальное значение, меняется через `eww update NAME=value` или `onclick` виджета.

```yuck
(defvar mode "normal")

(defwidget mode-switch []
    (button :onclick "eww update mode=${mode == 'normal' ? 'alt' : 'normal'}"
        "Toggle: ${mode}"))
```

**Когда**:
- Состояние UI, которое меняется от кликов: открыт/свёрнут раздел, выбранная вкладка, toggle-флаг.
- Передача значения между виджетами без пересчёта на каждом polling.

---

## Как выбрать

| Ситуация | Что брать |
|---|---|
| «обновляй каждые X сек» | defpoll |
| «реагируй на событие» (hyprland, dbus, mpris, file change) | deflisten |
| «храни состояние UI» | defvar |
| «считай производное от других переменных» | см. ниже |

---

## Вычисляемые значения

Без `defreactive` eww считает inline-выражения в местах использования:

```yuck
(label :text "${ram-usage > 80 ? 'HIGH' : 'ok'}")
(box :class "tile ${battery-capacity < 20 ? 'warn' : ''}")
```

Для сложной логики — либо распиши в скрипте, либо заюзай `defvar` + poll, который его обновляет.

---

## Конвенция наших скриптов

- Один скрипт = одно семейство данных. Разные значения — через флаги.
  ```bash
  # scripts/sys_info --mem  →  54
  # scripts/sys_info --bat  →  87
  ```
- Один stdout-линия — одно значение. Никаких «JSON с 5 полями» — eww не парсит.
- Ошибки — в stderr, stdout оставлять пустым или с запасным дефолтом.
- Shebang `#!/usr/bin/env bash` и `set -u`.
- Путь к скриптам в `_variables.yuck` — через **`${EWWCONFIGDIR}`** (`${EWWCONFIGDIR}/scripts/foo`). Не относительный, не `~/.config/...`.

### `EWWCONFIGDIR` — правила игры

- **В yuck-выражениях** (внутри `"..."` в defpoll/onclick): `${EWWCONFIGDIR}` доступен всегда, eww подставляет сам.
- **Внутри shell-скрипта** (как env-переменная): **НЕ доступен** автоматически. Eww не экспортирует его дочерним процессам.

Если скрипту нужен свой путь к соседним файлам (ассетам, sub-скриптам):
```bash
#!/usr/bin/env bash
# самый надёжный способ узнать где лежит сам скрипт
HERE="$(dirname "$(readlink -f "$0")")"
# sub-скрипт рядом:
"$HERE/sub-helper"
# ассет:
cat "$HERE/../assets/data.json"
```

`readlink -f` раскрывает симлинки — работает даже если скрипт вызвали через ссылку.

---

## Примеры из rxyhn

- `scripts/sys_info` — poll 1s, 4 семейства флагов. Шаблон для простых stat-ов.
- `scripts/music` — poll 5s. Особенность: возвращает playerctl-state как **иконку** (юникод), а не «Playing/Paused» — чтобы прямо вставить в label без условий.
- `scripts/getweather` — poll 10m, wttr.in api. Ответ кэшируется в файл `/tmp/weather.cache`, скрипт просто грепит нужное поле.
- `scripts/check-todo` — poll 10s, 9 флагов. Перебор: это **идеальный кандидат** на `deflisten + inotifywait ~/.todo.txt` — будет быстрее и без нагрузки.
