# Рецепт: dynamic-list (bash → JSON-массив → `for` в yuck)

Когда число строк переменное: топ-N процессов, список workspaces, список notif-ов, последние коммиты.

## Задача-челлендж: «топ-3 процесса по CPU»

Нужно показать 3 строки вида `${pid}  ${%cpu}  ${command}`, список меняется каждые 3с.

## Ключевой момент

Eww `(for x in array)` ждёт **валидный JSON-массив строк** (либо объектов). Не bash-массив, не newline-separated, не csv. Именно JSON.

## Сборка

### 1. Скрипт-собиратель (надёжный — через jq)

```bash
#!/usr/bin/env bash
# scripts/top-procs — отдаёт JSON-массив строк
set -u
ps -eo pid,pcpu,comm --sort=-pcpu --no-headers | head -3 | \
    jq -R -s -c '
        split("\n") | map(select(. != ""))
    '
```

**Разбор**:
- `ps -eo pid,pcpu,comm --sort=-pcpu --no-headers` — топ по CPU, без заголовка.
- `head -3` — берём 3 строки.
- `jq -R -s -c`:
  - `-R` (raw) — читаем каждую линию как строку без парсинга JSON
  - `-s` (slurp) — собираем все строки в один массив
  - `-c` (compact) — без форматирования
  - `split("\n")` — строки → массив
  - `map(select(. != ""))` — убираем пустые (после последнего `\n`)

Вывод:
```json
["1234  12.5  firefox","5678  8.1  gjs","9101  3.2  kitty"]
```

`jq` **автоматически экранирует** спецсимволы в значениях — кавычки, обратные слэши, переводы строк. Это единственный надёжный способ собирать JSON из shell.

### ❌ Почему НЕ awk

Если тебе говорят «сделай без jq через awk» — не соглашайся. Простейший awk-вариант ломается на любом имени с пробелом:

```bash
# ЛОМАЕТСЯ на "Web Content", "VS Code", "steam /path"
ps -eo comm= | awk 'BEGIN{printf "["} NR>1{printf ","} {printf "\"%s\"", $1} END{print "]"}'
```

Кавычки в имени процесса — и JSON развалится. Eww молча не отрисует. Час дебага.

Если `jq` категорически недоступен — используй python:
```bash
python3 -c 'import sys, json; print(json.dumps([l for l in sys.stdin.read().splitlines() if l]))'
```

### 2. Переменная

```yuck
(defpoll top-procs :interval "3s" :initial "[]"
    "${EWWCONFIGDIR}/scripts/top-procs")
```

### 3. Виджет

```yuck
(defwidget top-procs-list []
    (box :class "tile" :orientation "v" :space-evenly false :spacing 4
        (label :class "tile-title" :text "Top CPU" :halign "start")
        (box :orientation "v" :space-evenly false :spacing 2
            (for line in top-procs
                (label :class "proc-row" :text line :halign "start")))))
```

### 4. SCSS

```scss
.proc-row {
    font-family: "Comic Mono";
    font-size: .95em;
    color: $foreground;
    padding: 2px 0;
}
```

### 5. Reload

```bash
eww reload
```

## Когда массив — это структуры

Если нужно несколько полей (pid **и отдельно** cpu) — возвращай массив объектов.

**⚠️ Грабли**: `ps -eo comm` обычно без пробелов, но `command`/`args` могут содержать пробелы (`"Web Content"`, `"/usr/bin/code --type=renderer"`). Простой `split(" ")` развалит поле. Используй `capture` с regex — именованные группы не зависят от числа пробелов внутри последнего поля:

```bash
ps -eo pid=,pcpu=,comm= --sort=-pcpu --no-headers | head -3 | \
    jq -R -s -c '
        split("\n")
        | map(select(. != "") | capture("^\\s*(?<pid>\\d+)\\s+(?<cpu>\\S+)\\s+(?<cmd>.+)$"))
    '
```

Вывод:
```json
[{"pid":"1234","cpu":"12.5","cmd":"firefox"},{"pid":"5678","cpu":"8.1","cmd":"gjs"}]
```

Использование:
```yuck
(for p in top-procs
    (box :orientation "h" :spacing 10
        (label :text "${p.cmd}")
        (label :text "${p.cpu}%" :class "cpu-num")))
```

Достуаются поля через `.fieldname`.

## Грабли

### Кавычки не экранированы
Если `cmd` содержит `"` — JSON ломается, eww молча ничего не рендерит.
Решение: `jq` сам экранирует. Если вручную awk — добавь `gsub(/"/, "\\\"")`.

### Пустой массив на старте
Без `:initial "[]"` до первого poll eww выдаст «variable is not an array» и логнёт ошибку.

### Слишком длинный список
50+ элементов рендерятся, но GTK3 начинает лагать на перерисовке. Отсекай `head -N`.

### `for` по числу (не по массиву)
```yuck
;; Работает только если переменная — валидный JSON-массив!
(for i in "[1,2,3,4,5]" ...)

;; Если нужно просто «N итераций 0..N-1» — генерируй массив в скрипте:
;; printf '['; for i in $(seq 0 $((N-1))); do [ $i -gt 0 ] && printf ','; printf '%d' $i; done; echo ']'
```

## Паттерн: перезапрос по клику

Если хочешь кнопку «обновить сейчас»:
```yuck
(defvar refresh-nonce "0")

(defpoll top-procs :interval "3s" :initial "[]"
    "${EWWCONFIGDIR}/scripts/top-procs ${refresh-nonce}")

(button :onclick "eww update refresh-nonce=$(date +%s)" "Refresh")
```

`refresh-nonce` не используется скриптом (ему плевать на аргумент), но смена значения форсит eww перезапустить defpoll.

## Чеклист

- [ ] Скрипт отдаёт валидный JSON (`jq -e . < out.json` не падает)
- [ ] `defpoll` имеет `:initial "[]"` или `:initial "[{}]"`
- [ ] Использован `${EWWCONFIGDIR}`, не `~/.config/...`
- [ ] `(for x in var)` — var это имя переменной, без `${}` в этом месте
- [ ] Доступ к полям через `.fieldname`, не `[fieldname]`
