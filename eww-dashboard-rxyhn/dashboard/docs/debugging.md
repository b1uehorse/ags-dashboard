# Debugging: когда виджет не такой как ожидал

Первое, что надо освоить до любых «как добавить» — **как смотреть что сейчас внутри**. Иначе половина времени уйдёт на угадывание.

## Главные команды

```bash
# все текущие значения переменных — первый шаг при ЛЮБОЙ проблеме
eww -c ~/.config/eww/dashboard state

# одно конкретное
eww -c ~/.config/eww/dashboard get VARIABLE_NAME

# лог демона (ошибки SCSS, yuck-парсинг, ошибки скриптов)
eww -c ~/.config/eww/dashboard logs

# лайв-лог (следить пока правишь)
tail -f ~/.cache/eww/eww_*.log

# текущие открытые окна
eww -c ~/.config/eww/dashboard active-windows

# перечитать конфиг без рестарта
eww -c ~/.config/eww/dashboard reload
```

## Алгоритм «виджет странный»

1. **Переменная пустая/неправильная?**
   ```bash
   eww get VARNAME
   ```
   - Пусто → скрипт не выполняется или возвращает пусто. Проверь руками:
     ```bash
     bash -x ~/.config/eww/dashboard/scripts/foo --flag
     ```
   - Значение есть, но не то → проблема в логике скрипта.
   - Значение правильное, но виджет показывает другое → проблема в шаблоне yuck.

2. **Скрипт молчит, eww не реагирует?**
   - `eww logs` покажет `script returned non-zero` или `timeout`.
   - Проверь `chmod +x`.
   - Проверь shebang (`#!/usr/bin/env bash`).

3. **Стиль не применился?**
   - `eww logs` часто выдаёт `error parsing SCSS: ...` с указанием строки.
   - Некоторые CSS-свойства тихо игнорятся (см. `styling.md`).

4. **Виджет «прыгает», мигает, перерисовывается не так?**
   - defpoll с очень маленьким интервалом (1s) + дорогим скриптом → жди вечность. Смотри следующий пункт.
   - Reveaeler/stack с кривыми `:transition` → глюки. Пробуй `:transition "none"` как baseline.

## Анти-паттерн: медленный defpoll убивает UI

**Eww однопоточный в вычислении yuck-шаблонов.** Если скрипт в defpoll выполняется 3 секунды — весь интерфейс залипает.

Правила:
- Сетевые вызовы (curl, wget, ping, api) — **никогда** в defpoll напрямую.
- Вместо этого: отдельный cron-like процесс кэширует в файл, defpoll читает файл.
- Пример: `scripts/getweather` кэширует в `/tmp/weather.cache` раз в 10 минут, виджет читает кэш мгновенно.

Шаблон:
```bash
# scripts/weather-cache
#!/usr/bin/env bash
CACHE=/tmp/weather.cache
MAXAGE=600  # 10 мин
if [ ! -f "$CACHE" ] || [ $(( $(date +%s) - $(stat -c %Y "$CACHE") )) -gt $MAXAGE ]; then
    curl -s wttr.in/Moscow?format=j1 > "$CACHE.tmp" && mv "$CACHE.tmp" "$CACHE"
fi
jq -r ".current_condition[0].temp_C" "$CACHE"
```

```yuck
(defpoll weather-temp :interval "60s" "~/.config/eww/dashboard/scripts/weather-cache")
```

Скрипт выполняется 10ms (чтение файла), кэш обновляется раз в 10 минут. UI не тормозит.

## Yuck-квирки, на которых спотыкаются

### Сравнение со строками — всегда в одинарных кавычках
```yuck
;; ✅ работает
:class "${mode == 'active' ? 'on' : 'off'}"
;; ❌ ломает парсер
:class "${mode == "active" ? "on" : "off"}"
;; ❌ и это не работает — нет неявного булева для пустой строки
:class "${mode ? 'on' : 'off'}"
```

### Число vs строка
```yuck
;; если defpoll возвращает "42\n" (с переводом)
:value battery-capacity   ;; работает, eww чаще тримит
:value "${battery-capacity + 0}"  ;; форсирует число
;; но если скрипт вернул "42.5" а виджет ждёт int:
:thickness 12   ;; ✅ литерал
:thickness "${round(battery-capacity)}"   ;; если надо из строки → число
```

**Грабли**: `0.52` от `uptime`/`/proc/loadavg` ставится в `:value` circular-progress, который ждёт число 0..100 — виджет просто не отрисует. Умножай в скрипте: `awk '{print int($1*100)}'`.

### Пустой stdout от скрипта
```yuck
(defpoll x :initial "—" "sometimes-empty-cmd")
;; потом в виджете
(label :text "${x != '' ? x : '—'}")  ;; страховка
```

### Абсолютные пути
```yuck
;; ❌ плохо — ломается при смене юзера/директории
"~/.config/eww/dashboard/scripts/foo"

;; ✅ хорошо — EWWCONFIGDIR установлен eww самим собой
"${EWWCONFIGDIR}/scripts/foo"
```

`EWWCONFIGDIR` доступен как в yuck (как переменная), так и через окружение для скриптов.

## Самые частые ошибки в логах

| Сообщение | Где искать |
|---|---|
| `Junk at end of value for margin` | GTK3 не ест `auto` в margin/padding. Убери. |
| `failed to load SCSS: Invalid selector...` | Пытаешься использовать `>`, `+` CSS-комбинаторы — GTK их не знает. |
| `variable X is undefined` | Забыл `defpoll`, опечатка в имени. |
| `expected value, found ')'` | Yuck-синтаксис: где-то лишняя/недостающая скобка. |
| `Failed to initialize GTK` | Нет `WAYLAND_DISPLAY` в окружении демона. |
| `cannot connect to bus` | Нет `DBUS_SESSION_BUS_ADDRESS`. Запускай eww из юзерской сессии, не по SSH. |

## Чеклист при любой проблеме

- [ ] `eww state` — посмотреть значения переменных
- [ ] `eww logs` — найти ошибки парсинга
- [ ] `bash -x scripts/X --flag` — скрипт работает руками?
- [ ] `chmod +x`, shebang правильный
- [ ] `eww reload` после каждой правки yuck/scss
- [ ] Если правка defwindow — `eww close NAME && eww open NAME`
