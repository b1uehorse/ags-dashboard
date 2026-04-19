---
name: Hyprland 0.54 layerrule syntax
description: В Hyprland 0.54 inline layerrule не работает, нужна блочная форма с name=
type: project
originSessionId: 417505ad-14d7-45e9-9259-52a2c99f1515
---
В Hyprland 0.54.3 на хосте Betrayer inline-форма `layerrule = blur <namespace>` и `layerrule = blur, <namespace>` НЕ парсится (ошибка `special category's first value must be the key. Key for <layerrule> is <name>`). Работает только блочная:

```
layerrule {
    name = blur-fabric
    match:namespace = fabric
    blur = true
}
```

`ignorealpha` как отдельный keyword не принимается (`invalid field ignorealpha`).

**Why:** из-за этого мы несколько часов думали что blur не работает вообще — оказалось, просто правило не применялось, потому что конфиг его игнорировал. Gemini давал advice с запятой — тоже мимо для этой версии.

**How to apply:** в любой работе с layer-shell окнами (ags, fabric, eww) на этом хосте — добавлять правила ТОЛЬКО блочной формой с уникальным `name=`. Правило применяется при СОЗДАНИИ layer'а, после `hyprctl reload` нужно перезапустить приложение.
