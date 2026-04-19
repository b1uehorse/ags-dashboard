# wtfutil как главный десктоп-виджет (рабочий стол 1)

Заметки для себя: что может wtfutil, как его кастомизировать, что поставить первым. Ориентирован на DBA-стек Profi.

## 1. Что это такое

Terminal-дэшборд на Go. Одно окно с сеткой виджетов, каждый виджет — отдельный модуль, подтягивает и рисует свои данные. Обновление — по расписанию (на модуль свой интервал). Управление — клавиатурой, без мыши. ~80 встроенных модулей, плюс универсальный `cmdrunner` = «запусти shell и покажи вывод» → через него можно воткнуть что угодно.

**Роль виджета на рабочем столе:** запускается в kitty на workspace 1, Hyprland прибивает окно к этому воркспейсу, сверху ничего не перекрывает — получаешь живую панель статусов.

## 2. Конфиг — один YAML

Путь: `~/.config/wtf/config.yml`. Первый запуск `wtfutil` создаёт дефолтный. Всё редактирование руками в нём. Reload — `r` внутри wtfutil, либо рестарт процесса.

Структура верхнего уровня:

```yaml
wtf:
  colors:
    background: "black"
    border:
      focusable: "darkslateblue"
      focused:   "orange"
      normal:    "gray"
    checkbox:
      checked:   "green"
      unchecked: "red"
    text: "white"
    title: "white"
  grid:
    columns: [36, 36, 36]   # ширины колонок в ячейках
    rows:    [10, 10, 10, 10, 10]  # высоты строк
  refreshInterval: 1
  selected: 0
  term: xterm-256color
  openFileUtil: xdg-open
  mods:
    # ← здесь модули
```

**Главный приём** — `grid.columns` и `grid.rows`. Ты **сам** задаёшь сетку. Потом в каждом модуле пишешь `position:` — какие клетки сетки он занимает. Это как CSS Grid, но в терминале. Можешь сделать один модуль на весь экран, можешь мозаику 5×5.

## 3. Позиционирование модуля

В каждом `mods.<name>` есть секция:

```yaml
position:
  top:    0
  left:   0
  height: 2   # сколько строк сетки занять
  width:  1   # сколько колонок
```

Координаты — **индексы клеток**, не пиксели и не символы. `top: 0, left: 0` — левая верхняя клетка. `height: 2` — модуль растянется на 2 строки из `grid.rows`.

Если хочется «один виджет на весь экран» — `height: len(rows)`, `width: len(cols)`.

## 4. Несколько страниц

`focusable: true` + глобальные хоткеи `1, 2, 3…` переключают фокус на виджеты. Для многостраничного дэша есть **`wtf.navigation`** и отдельные файлы конфигов, либо через «группы» в одном конфиге. Проще — один плотный лэйаут на страницу 1 и всё.

## 5. Важные модули под DBA-стек

### `cmdrunner` — главная дверь к свободе

Запускает произвольную команду по таймеру, печатает stdout. Любой виджет, которого нет в wtfutil, делается так.

```yaml
mods:
  mysql_status:
    type: cmdrunner
    enabled: true
    cmd: ssh
    args: ["-i", "/home/bekh/wrk/keys/ssh_keys/bekh_profi.key",
           "BekmemetevVO@vr-db-4-1.x340.org",
           "sudo mysql -e 'SHOW SLAVE STATUS\\G' | grep -E 'Running|Behind'"]
    refreshInterval: 60
    position: { top: 0, left: 0, height: 2, width: 1 }
    title: "vr-db-4-1 slave"
```

**Применения для тебя:**
- `pt-diskstats` или `ssh host "iostat -xm 1 2"` — I/O по базам
- `ssh host "sudo mysql -e 'SHOW PROCESSLIST'" | wc -l` — счётчик активных сессий
- `ssh host "sudo mysql -e 'SHOW SLAVE STATUS\\G'" | grep Behind` — лаг репликации
- `zabbix-tui` или `p /Users/bekh/wrk/profi_auto/meta/zabbix-tui.py --max-days=1 --json` — свежие алёрты
- `curl -s https://youtrack.x340.org/api/issues?...` — твои задачи
- `git -C /path log --oneline -5` — последние коммиты в ключевом репо

### `clocks_b` — мульти-часы

```yaml
clocks_b:
  enabled: true
  locations:
    Tbilisi: Asia/Tbilisi
    Moscow:  Europe/Moscow
    Bangkok: Asia/Bangkok   # для планов
    UTC:     UTC
  refreshInterval: 15
  position: { top: 0, left: 2, height: 1, width: 1 }
```

### `weather` / `prettyweather`

wttr.in под капотом. Tbilisi прогноз.

```yaml
prettyweather:
  enabled: true
  city: Tbilisi
  unit: m
  refreshInterval: 3600
  language: ru
  position: { top: 1, left: 2, height: 2, width: 1 }
```

### `gitlab` / `github`

Нативные модули. Под GitLab — токен и URL инстанса:

```yaml
gitlab:
  enabled: true
  apiVersion: v4
  domain: https://gitlab.x340.org/api
  projects:
    - "group/repo"
  username: BekmemetevVO
  refreshInterval: 300
  position: { top: 2, left: 0, height: 2, width: 2 }
```

Токен — в `GITLAB_TOKEN` env var.

### `jenkins`

```yaml
jenkins:
  enabled: true
  url: https://jenkins-prod.x340.org
  user: BekmemetevVO
  jobs:
    - "db-deploy"
    - "pt-osc-runner"
  successBallColor: green
  failureBallColor: red
  position: { top: 4, left: 0, height: 2, width: 1 }
```

Пароль через env `WTF_JENKINS_API_KEY`.

### `jira` — аналог подходит для YouTrack?

Нативного YouTrack-модуля нет. **Делаешь через `cmdrunner`:**

```yaml
youtrack_my:
  type: cmdrunner
  cmd: bash
  args: ["-c", "curl -s -H 'Authorization: Bearer '$YT_TOKEN 'https://youtrack.x340.org/api/issues?fields=idReadable,summary&query=for:me+%23Unresolved&$top=10' | jq -r '.[] | \"\\(.idReadable) \\(.summary)\"'"]
  refreshInterval: 300
  title: "YouTrack: мои задачи"
  position: { top: 0, left: 3, height: 3, width: 1 }
```

### `gerrit` / `gcalcli` / `todo` — по желанию

`todo` умеет локальный список дел прямо в файле (`~/.config/wtf/todo.yml`), интерактивный — можно отмечать выполненным.

### `logger`

Показывает хвост лог-файла. Удобно для Jenkins-логов, mysqld.err (если прокинут), etc.

```yaml
logger:
  filePath: /var/log/nginx/error.log
  lines: 20
```

### `cryptoexchanges`, `newrelic`, `hibp` — по вкусу

HIBP (have-i-been-pwned) полезен после истории с утёкшим CSV.

## 6. Цвета и рамки

Глобально — `wtf.colors` (см. выше). Per-module:

```yaml
  mysql_status:
    borderColor: "orange"
    title: "⚡ MySQL"
```

`title` поддерживает юникод и эмодзи, окрашивается в `wtf.colors.title`.

## 7. Hotkeys, которые надо знать

- `Tab` / `Shift+Tab` — перемещение фокуса по focusable-модулям
- `r` — принудительный refresh всего
- `Esc` — выход из детального режима модуля
- `/` — поиск в некоторых модулях
- `?` — help текущего модуля
- в `todo`: `j/k` навигация, `n` новый, `space` toggle, `d` удалить

Переопределить хоткеи — через `keyboardShortcuts` в корне конфига.

## 8. Границы и что НЕ получится

- **wtfutil — read-only дэшборд.** Не TUI-приложение. Интерактивность в пределах "посмотреть, открыть ссылку в браузере". Написать в YouTrack через wtf не получится.
- **Свой нативный модуль** = форк wtfutil + Go. 95% потребностей закрываются `cmdrunner`.
- **Живые графики/спарклайны** — есть только в `power`, `prometheus`, некоторых модулях. Через `cmdrunner` можно печатать ASCII-график (`spark` CLI) вручную.
- **Длинные команды в cmdrunner** — не кликаются, не паджинатся. Для живых логов — `logger`, не `cmdrunner "tail -f"`.

## 9. План старта под "десктоп-виджет на workspace 1"

1. `wtfutil` один раз — сгенерит дефолтный конфиг. Удалить всё из `mods:`, сетку задать под свой монитор (~3–4 колонки × 5–6 строк).
2. Добавить `clocks_b` (tbilisi+moscow+bangkok+utc), `prettyweather`, `todo`.
3. Через `cmdrunner` добавить 2–3 SSH-чека ключевых БД (slave lag, процессы).
4. Добавить `gitlab` с твоими активными репо + `jenkins` с твоими джобами.
5. YouTrack через `cmdrunner` с $YT_TOKEN.
6. В Hyprland — `windowrulev2 = workspace 1 silent, class:^(kitty)$, title:^(wtf)$` (или launch kitty с `--title wtf` из exec-once).
7. `exec-once = kitty --title wtf wtfutil` в `~/.config/hypr/hyprland.conf`.

Дальше — итеративно добавлять `cmdrunner`-модули под вопросы, которые чаще всего задаёшь терминалу.

## 10. Полезные ссылки

- https://wtfutil.com/modules/ — список всех модулей с примерами YAML
- https://github.com/wtfutil/wtf — репо
- https://wtfutil.com/posts/configuration/ — глобальный конфиг
- `wtfutil --help` — CLI-флаги (`--config` чтобы держать несколько конфигов для разных экранов)
