---
name: Dashboard stack choice — Fabric
name-old-name: not applicable
description: Решение: дашборд на Betrayer делаем на Fabric (python-fabric-git), а не AGS
type: project
originSessionId: 417505ad-14d7-45e9-9259-52a2c99f1515
---
После длительных мучений с AGS (namespace bugs, Astal layer prop не работает, JSX колхоз) — мигрировали на Fabric (python).

- Код: `~/fabric-dashboard/` на хосте Betrayer (100.100.166.114)
- Venv: `~/fabric-dashboard/.venv` — Python 3.13 через uv (3.14 ломается на PyGObject Enum Property)
- Запуск: `~/fabric-dashboard/run.sh` (экспортит HYPRLAND_INSTANCE_SIGNATURE + WAYLAND_DISPLAY + XDG_RUNTIME_DIR)
- Namespace: `fabric` (используется в layerrule blur)
- Blur включён через блочный layerrule (см. project_hyprland_layerrule_054.md)

**Why:** AGS провалился — Astal.Layer.BOTTOM через JSX prop не применялся, требовал хак `hide(); set_layer(); show()`. Плюс сам layout плиточного дашборда на JSX получался громоздкий. Fabric (python + GTK4 + layer-shell) проще и предсказуемее для сложности виджетов пользователя.

**How to apply:** любые правки дашборда — в `~/fabric-dashboard/` на Betrayer. Не трогать `~/ags-dashboard/` (локально) и `~/.config/ags/` (на хосте) — AGS заморожен. Перезапуск fabric: `kill -9 <pid>` + `nohup ~/fabric-dashboard/run.sh &`.
