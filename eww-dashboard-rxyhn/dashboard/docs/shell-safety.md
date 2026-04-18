# Shell safety: quoting, injection, медленные команды

Eww гоняет команды через `sh -c "..."`. Всё что ты пишешь в `:onclick` / `defpoll command` — **shell-строка**, со всеми её ловушками. **Безопасность определяется местом, где ты впервые вставил значение в shell-строку**, а не тем, что дальше скрипт читает аргумент как `"$1"`.

## Фундаментальное правило

**Любая interpolation `${var}` в shell-строку yuck = потенциальный injection**, если `var` может содержать произвольный пользовательский ввод. Argv в скрипте уже ПОЗДНО — escape надо делать ДО попадания в shell.

## Три безопасных способа передать значение

### A. Через временный файл

```yuck
(input :onchange "eww update query={}")
(button :onclick "${EWWCONFIGDIR}/scripts/search-query"
        ">")
```

```yuck
;; НЕ передаём query в команду — только сигнал через clicked
(defvar query-file "/tmp/eww-query")
```

```bash
# scripts/search-query — читает query из состояния через eww get
QUERY="$(eww -c "$HOME/.config/eww/dashboard" get query)"
firefox "https://google.com/?q=$(python3 -c 'import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))' "$QUERY")"
```

`eww get` сам безопасно возвращает значение в skript-argv, минуя интерполяцию в shell-строке.

### B. Через stdin

```yuck
(button :onclick "eww get query | ${EWWCONFIGDIR}/scripts/search-stdin" ">")
```

```bash
# scripts/search-stdin — читает из stdin
read -r QUERY
firefox "https://google.com/?q=$(python3 -c 'import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))' "$QUERY")"
```

Значение никогда не пересекает shell-строку в интерполированном виде.

### C. Whitelist

Когда набор действий фиксированный (5-10 кнопок), не пропускай произвольные значения вообще:

```yuck
(defvar choice "weather")
(button :onclick "${EWWCONFIGDIR}/scripts/quick-action weather" "Weather")
(button :onclick "${EWWCONFIGDIR}/scripts/quick-action cpu" "CPU")
```

```bash
# scripts/quick-action
case "$1" in
    weather) exec show-weather ;;
    cpu) exec htop ;;
    *) echo "unknown action: $1" >&2; exit 1 ;;
esac
```

## ❌ Неработающие и опасные паттерны

### Плохо: interpolation в onclick

```yuck
;; DO NOT DO THIS — юзер введёт "; rm -rf ~" и получишь RCE
(button :onclick "firefox 'https://google.com/?q=${query}'" "go")
```

### Плохо: попытка сэскейпить кавычками

```yuck
;; Кавычка в query разрывает собственную обёртку
(button :onclick "foo \"${query}\"" "go")
```

### Плохо: env-assignment в команде

```yuck
;; Q=$query назначается ДО env-assignment'а команде — придёт пустота или старое значение
(button :onclick "Q=${query} firefox \"https://.../?q=$Q\"" "go")
```

### Плохо: «скрипт с $1 защитит»

```yuck
;; $1 защищает ВНУТРИ скрипта, но уже поздно —
;; shell-строка в yuck уже разорвана до того как argv дошёл
(button :onclick "${EWWCONFIGDIR}/scripts/search \"${query}\"" "go")
```

В argv придёт уже то что получилось после того как shell обработал всю строку, включая произвольный код.

## Анти-паттерн: текстовое поле → eval

Виджет «input + кнопка → выполни команду» (вариации quick-cmd) — **опасный паттерн**, даже локально.

```yuck
(button :onclick "${input-text} &" ">")  ;; произвольное исполнение
```

Никогда в публичной/shared машине. В личной — на свой страх и риск. Безопаснее всегда whitelist (способ C).

## Тихие ошибки от скриптов

```yuck
;; если скрипт падает — x пустой БЕЗ ошибки в логах в некоторых eww-версиях
(defpoll x :interval "5s" "may-fail-cmd")
```

Всегда fallback:
```yuck
(defpoll x :interval "5s" :initial "—" "may-fail-cmd 2>/dev/null || echo '—'")
```

## Чеклист

- [ ] Ни одного `${user-var}` прямо в shell-строке `:onclick`/`defpoll` — только через `eww get` + argv, через stdin, или через whitelist
- [ ] Любой `defpoll` имеет `|| default` или `:initial`
- [ ] Нет `eval`, нет `bash -c "${var}"`, нет `sh -c` с интерполяцией пользовательского ввода
- [ ] Медленные/сетевые команды — через cache-файл, не напрямую в defpoll (см. `data-sources.md`)

## Правило большого пальца

Если в shell-строке есть `${что-то-что-может-содержать-произвольный-текст}` — это injection-риск. Единственный способ чисто — **не помещать значение в shell-строку вообще**: получать его из скрипта через `eww get` или stdin.
