# Hyprland windowrule — rulebook ошибок

Накопленные ошибки из реальных сессий. Обновлять при каждом новом фейле.

---

## windowrule block: первым должен быть `name`

**Ошибка:** `special category's first value must be the key. Key for <windowrule> is <name>`

**Как было (неправильно):**
```ini
windowrule {
    match:title = eww-tweak
    float = true
}
```

**Как надо:**
```ini
windowrule {
    name = some-rule-name     # ОБЯЗАТЕЛЬНО первым
    match:title = eww-tweak
    float = true
}
```

**Почему:** в синтаксисе Hyprland "special categories" требуют ключ (`name`) как первое поле блока.

---

## `stayfocused` не существует

**Ошибка:** `config option <windowrule:stayfocused> does not exist`

**Как было (неправильно):**
```ini
windowrule {
    name = foo
    stayfocused = false
}
```

**Как надо:** просто не использовать это поле. Для управления фокусом используются другие опции: `nofocus`, `focusonactivate`.

---

## Geometry в eww-окне не может использовать defvar

**Ошибка:** `failed to open window 'dashboard' — Unknown variable dash-w`

**Как было (неправильно):**
```yuck
(defwindow dashboard
    :geometry (geometry :width "${dash-w}px" :height "${dash-h}px" ...))
```

**Как надо:** geometry — статическая строка, только константы:
```yuck
(defwindow dashboard
    :geometry (geometry :width "1200px" :height "700px" ...))
```

**Почему:** geometry резолвится при парсинге конфига, до того как defvar'ы становятся доступны в runtime.

---

## eww daemon требует XDG_RUNTIME_DIR при вызове через ssh/subprocess

**Симптом:** `eww update` молча не работает или не находит сокет.

**Как надо:** всегда прокидывать env:
```bash
export XDG_RUNTIME_DIR=/run/user/1000
eww -c ~/.config/eww/dashboard update var=value
```

В Python subprocess:
```python
subprocess.Popen(
    ["eww", "-c", cfg, "update", f"{name}={value}"],
    env={**os.environ, "XDG_RUNTIME_DIR": f"/run/user/{os.getuid()}"},
)
```
