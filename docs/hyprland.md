# Hyprland-интеграция

Как подружить AGS с Hyprland: запуск, биндинги, workspace-pinning, blur, z-order.

## Автозапуск

В `~/.config/hypr/hyprland.conf`:

```
exec-once = ags run
```

AGS сам управляет своими окнами/слоями, ничего больше из `exec-once` не надо.

## Hot-reload в разработке

AGS перезагружает файлы на лету (watch), но не всегда — если сломался entry, запусти вручную:

```bash
ags quit 2>/dev/null; ags run
```

## Toggle hotkey

```
bind = SUPER, D, exec, ags toggle-window rxyhn-dashboard
```

`rxyhn-dashboard` — это `name` у `<window>` в `src/dashboards/rxyhn.tsx`. Каждый отдельный дашборд — отдельный `name` + отдельный bind.

## Z-order: под Kitty, над обоями

В дашборде указано:

```tsx
layer={Astal.Layer.BACKGROUND}
```

`BACKGROUND` = самый низкий слой, выше только обои. Обычные окна (Kitty, Firefox) будут сверху. Хотите TOP — `Astal.Layer.TOP` (над всеми окнами).

Альтернатива — `Astal.Layer.BOTTOM` (над обоями, но под normal-окнами как и BACKGROUND — разница в порядке между ними).

## Blur за окном дашборда

```
layerrule = blur, ags-dashboard
layerrule = ignorealpha 0.5, ags-dashboard
```

`ags-dashboard` — это `namespace` в `<window>`. Все окна с этим namespace получат blur.

`ignorealpha 0.5` — не применять blur на полностью прозрачные участки (где alpha < 0.5). Для нас важно: между плитками видно обои без матового фильтра.

## Workspace pinning

По умолчанию layer-shell окна **глобальные** — видны на всех workspace. Это хорошо для дашборда-фона, плохо для виджета вроде «тудулист только на ws3».

Два способа:

### 1. Разные namespace под разные экраны

```tsx
// widget привязан только к ws 2
<window namespace="ags-ws2-only" ...>
```

В Hyprland:

```
layerrule = workspace 2, ags-ws2-only
```

Не 100% надёжно — `layerrule workspace` в Hyprland 0.54+ работает нестабильно, см. [#3452](https://github.com/hyprwm/Hyprland/issues/3452).

### 2. Обычное окно (XDG top-level) вместо layer-shell

Если нужна жёсткая привязка к workspace — сделать не layer-shell, а обычное floating-окно:

```tsx
<window
    visible
    name="my-floating"
    application={app}
    // без layer/namespace — это XDG top-level
/>
```

И в Hyprland:

```
windowrule = workspace 2 silent, class:^(ags)$
windowrule = float, class:^(ags)$
windowrule = pin, class:^(ags)$
```

`pin` — прикрепить к текущему ws или к конкретному (зависит от версии Hyprland).

## Прозрачность Kitty (и других окон)

Дашборд прозрачность — это layer-shell + ignorealpha. Для обычных окон типа Kitty:

В `~/.config/kitty/kitty.conf`:
```
background_opacity 0.85
```

И в hyprland:
```
decoration {
    active_opacity = 1.0
    inactive_opacity = 0.95
    dim_inactive = false   # ВАЖНО: не дим, иначе подложка
}
```

Наш bug в прошлый раз: `dim_inactive = true` делал eww-окно серым (т.к. было no_focus → inactive). Убрать dim, либо для конкретного окна ставить `windowrule = nodim`.

## Что ещё

- Live-ресайз дашборда: AGS поддерживает gtk4 css-transitions. Можно делать slide-in по biнду — отдельный рецепт в `docs/recipes.md`.
- Multiple monitors: `monitor={gdkMonitor}` на `<window>`. По умолчанию — все мониторы.
