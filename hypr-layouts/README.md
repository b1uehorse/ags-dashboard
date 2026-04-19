# hypr-layouts

Навигационные биндинги Hyprland под разные раскладки.

## Применить

На Betrayer заменить одну строку в `~/.config/hypr/hyprland.conf`:

```ini
source = ~/.config/hypr/layouts/qwerty.conf   # QWERTY: HJKL
source = ~/.config/hypr/layouts/colemak.conf  # Colemak-DH: MNEI
```

Затем `hyprctl reload`.

## Восстановить на чистой машине

```bash
cp hypr-layouts/*.conf ~/.config/hypr/layouts/
```
